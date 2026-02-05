/**
 * Share Hit Tracking Route
 * 
 * POST /api/share/[token]/hit - Increment access count for a share link
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Increment access count using RPC function
    const { error } = await supabaseAdmin.rpc('increment_share_access', {
      share_token: token,
    });

    if (error) {
      console.error('Failed to increment access count:', error);
      // Don't expose internal errors
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Share hit tracking error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
