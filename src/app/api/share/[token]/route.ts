/**
 * Individual Share Link Route
 * 
 * DELETE /api/share/[token] - Revoke a share link
 * PATCH /api/share/[token] - Update share link (toggle active)
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabase/server';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Delete the share link (RLS ensures only owner can delete)
    const { error } = await supabase
      .from('share_links')
      .delete()
      .eq('id', token);

    if (error) {
      console.error('Error deleting share link:', error);
      return NextResponse.json({ error: 'Failed to delete share link' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/share/[token] error:', error);
    return NextResponse.json({ error: 'Failed to delete share link' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body;

    const supabase = await createServerSupabaseClient();

    // Update share link (RLS ensures only owner can update)
    const { data, error } = await supabase
      .from('share_links')
      .update({ is_active: isActive })
      .eq('id', token)
      .select()
      .single();

    if (error) {
      console.error('Error updating share link:', error);
      return NextResponse.json({ error: 'Failed to update share link' }, { status: 500 });
    }

    return NextResponse.json({ shareLink: data });
  } catch (error) {
    console.error('PATCH /api/share/[token] error:', error);
    return NextResponse.json({ error: 'Failed to update share link' }, { status: 500 });
  }
}
