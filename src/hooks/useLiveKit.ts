'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Room,
  RoomEvent,
  LocalParticipant,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack,
  Track,
} from 'livekit-client';
import axios from 'axios';

export function useLiveKit() {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  
  // Connect to a LiveKit room
  const connect = useCallback(async (username: string, roomName: string) => {
    try {
      // Get token from the API
      const response = await axios.get(`/api/livekit-token?username=${username}&room=${roomName}`);
      const { token } = response.data;
      
      if (!token) {
        throw new Error('Failed to get LiveKit token');
      }
      
      // Create and connect to the room
      const roomInstance = new Room();
      
      // Set up event listeners
      roomInstance.on(RoomEvent.ParticipantConnected, () => {
        setParticipants(roomInstance.remoteParticipants.values());
      });
      
      roomInstance.on(RoomEvent.ParticipantDisconnected, () => {
        setParticipants(roomInstance.remoteParticipants.values());
      });
      
      roomInstance.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
      });
      
      // Connect to the room
      await roomInstance.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-domain.com', token);
      
      // Add event listeners for tracks
      roomInstance.remoteParticipants.forEach((participant) => {
        handleRemoteParticipant(participant);
      });
      
      setRoom(roomInstance);
      setIsConnected(true);
      setError(null);
      setParticipants(roomInstance.remoteParticipants.values());
      
    } catch (err) {
      console.error('Error connecting to LiveKit:', err);
      setError('Failed to connect to the voice chat room');
      setIsConnected(false);
    }
  }, []);
  
  // Disconnect from the room
  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setParticipants([]);
    }
  }, [room]);
  
  // Enable/disable microphone
  const toggleMicrophone = useCallback(async (enabled: boolean) => {
    if (!room) return;
    
    try {
      if (enabled) {
        // Request microphone permission and publish
        await room.localParticipant.enableMicrophone();
      } else {
        // Mute the microphone
        room.localParticipant.disableMicrophone();
      }
    } catch (err) {
      console.error('Error toggling microphone:', err);
      setError('Failed to toggle microphone');
    }
  }, [room]);
  
  // Handle remote participant tracks
  const handleRemoteParticipant = (participant: RemoteParticipant) => {
    // Handle existing tracks
    participant.tracks.forEach((publication) => {
      handleTrackPublication(publication, participant);
    });
    
    // Handle new tracks
    participant.on('trackPublished', (publication) => {
      handleTrackPublication(publication, participant);
    });
  };
  
  // Handle track publication
  const handleTrackPublication = (
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    if (publication.track) {
      handleTrack(publication.track, participant);
    }
    
    publication.on('subscribed', (track) => {
      handleTrack(track, participant);
    });
  };
  
  // Process a new track
  const handleTrack = (track: RemoteTrack, participant: RemoteParticipant) => {
    // Only handle audio tracks
    if (track.kind !== Track.Kind.Audio) return;
    
    // Attach the track to an audio element
    const audioElement = new Audio();
    track.attach(audioElement);
    
    // Play the audio
    audioElement.play().catch((error) => {
      console.error('Error playing audio:', error);
    });
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);
  
  return {
    room,
    isConnected,
    error,
    participants,
    connect,
    disconnect,
    toggleMicrophone,
  };
} 