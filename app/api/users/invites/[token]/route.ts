import { NextRequest, NextResponse } from 'next/server';
import { getInviteByToken } from '@/lib/db-users';

// GET /api/users/invites/[token] - Get invite by token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invite = await getInviteByToken(token);
    
    if (!invite) {
      return NextResponse.json({ error: 'Урилга олдсонгүй' }, { status: 404 });
    }

    // Check if invite is expired
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Урилга хүчингүй болсон байна' }, { status: 400 });
    }

    // Check if invite is already used
    if (invite.usedAt) {
      return NextResponse.json({ error: 'Энэ урилга аль хэдийн ашиглагдсан байна' }, { status: 400 });
    }

    return NextResponse.json(invite);
  } catch (error) {
    console.error('Failed to fetch invite:', error);
    return NextResponse.json({ error: 'Failed to fetch invite' }, { status: 500 });
  }
}
