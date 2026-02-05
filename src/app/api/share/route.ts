/**
 * Share Links API Route
 * 
 * POST /api/share - Create a new share link for a project
 * GET /api/share - List share links for a project
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getServerUser } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, expiresAt, expiresIn } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate expiry date - support both expiresAt (ISO string) and expiresIn (duration)
    let finalExpiresAt: string | null = null;
    
    if (expiresAt) {
      // Direct ISO string provided
      finalExpiresAt = expiresAt;
    } else if (expiresIn && expiresIn !== 'never') {
      const expiry = new Date();
      switch (expiresIn) {
        case '1h':
          expiry.setHours(expiry.getHours() + 1);
          break;
        case '24h':
          expiry.setHours(expiry.getHours() + 24);
          break;
        case '7d':
          expiry.setDate(expiry.getDate() + 7);
          break;
        case '30d':
          expiry.setDate(expiry.getDate() + 30);
          break;
        default:
          expiry.setDate(expiry.getDate() + 7); // Default 7 days
      }
      finalExpiresAt = expiry.toISOString();
    }

    // Create share link
    const { data: shareLink, error: shareError } = await supabase
      .from('share_links')
      .insert({
        project_id: projectId,
        created_by: user.id,
        expires_at: finalExpiresAt,
        is_active: true,
        access_count: 0,
      })
      .select()
      .single();

    if (shareError) {
      console.error('Error creating share link:', shareError);
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
    }

    // Return link with token (id is the token)
    return NextResponse.json({
      link: {
        id: shareLink.id,
        token: shareLink.id,
        created_at: shareLink.created_at,
        expires_at: shareLink.expires_at,
        is_active: shareLink.is_active,
        access_count: shareLink.access_count,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/share error:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from('share_links')
      .select(`
        id,
        project_id,
        expires_at,
        is_active,
        access_count,
        created_at
      `)
      .order('created_at', { ascending: false });

    // Filter by project if specified
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: shareLinks, error } = await query;

    if (error) {
      console.error('Error fetching share links:', error);
      return NextResponse.json({ error: 'Failed to fetch share links' }, { status: 500 });
    }

    // Map to include token field
    const links = shareLinks?.map(link => ({
      id: link.id,
      token: link.id,
      project_id: link.project_id,
      created_at: link.created_at,
      expires_at: link.expires_at,
      is_active: link.is_active,
      access_count: link.access_count,
    })) || [];

    return NextResponse.json({ links });
  } catch (error) {
    console.error('GET /api/share error:', error);
    return NextResponse.json({ error: 'Failed to fetch share links' }, { status: 500 });
  }
}
