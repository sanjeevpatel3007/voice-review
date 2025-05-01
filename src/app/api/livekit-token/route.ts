import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const username = url.searchParams.get('username');
  const room = url.searchParams.get('room');

  if (!username || !room) {
    return NextResponse.json(
      { error: 'Missing username or room' },
      { status: 400 }
    );
  }

  // Define the API key and secret
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'LiveKit API key or secret is not set' },
      { status: 500 }
    );
  }

  // Create a new token
  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
  });

  // Grant permissions to the room
  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });

  // Generate the token
  const token = at.toJwt();

  // Return the token in the response
  return NextResponse.json({ token });
} 