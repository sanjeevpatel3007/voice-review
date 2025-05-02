'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack,
  Track,
  Participant,
  LocalTrackPublication,
  AudioTrack,
} from 'livekit-client';
import axios from 'axios';

export function useLiveKit() {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);

  const connect = useCallback(async (username: string, roomName: string) => {
    try {
      const response = await axios.get(`/api/livekit-token?username=${username}&room=${roomName}`);
      const { token } = response.data;

      if (!token) {
        throw new Error('Failed to get LiveKit token');
      }

      const roomInstance = new Room();

      const updateParticipants = () => {
        setParticipants(Array.from(roomInstance.remoteParticipants.values()));
      };

      roomInstance.on(RoomEvent.ParticipantConnected, updateParticipants);
      roomInstance.on(RoomEvent.ParticipantDisconnected, updateParticipants);
      roomInstance.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
      });

      await roomInstance.connect(
        process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-domain.com',
        token
      );

      roomInstance.remoteParticipants.forEach((participant) => {
        handleRemoteParticipant(participant);
      });

      setRoom(roomInstance);
      setIsConnected(true);
      setError(null);
      updateParticipants();
    } catch (err) {
      console.error('Error connecting to LiveKit:', err);
      setError('Failed to connect to the voice chat room');
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
      setParticipants([]);
    }
  }, [room]);

  const toggleMicrophone = useCallback(async (enabled: boolean) => {
    if (!room) return;

    try {
      if (enabled) {
        const micTrack = await room.localParticipant.setMicrophoneEnabled(true);
        if (!micTrack) {
          console.warn('Microphone not available or permission denied');
        }
      } else {
        await room.localParticipant.setMicrophoneEnabled(false);
      }
    } catch (err) {
      console.error('Error toggling microphone:', err);
      setError('Failed to toggle microphone');
    }
  }, [room]);

  const handleRemoteParticipant = (participant: RemoteParticipant) => {
    participant.trackPublications.forEach((publication: RemoteTrackPublication) => {
      handleTrackPublication(publication, participant);
    });

    participant.on('trackPublished', (publication: RemoteTrackPublication) => {
      handleTrackPublication(publication, participant);
    });
  };

  const handleTrackPublication = (
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    if (publication.track) {
      handleTrack(publication.track, participant);
    }

    publication.on('subscribed', (track: RemoteTrack) => {
      handleTrack(track, participant);
    });
  };

  const handleTrack = (track: RemoteTrack, participant: RemoteParticipant) => {
    if (track.kind !== Track.Kind.Audio) return;

    const audioElement = new Audio();
    track.attach(audioElement);

    audioElement.play().catch((error) => {
      console.error('Error playing audio:', error);
    });
  };

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
