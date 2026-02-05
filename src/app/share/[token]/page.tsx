/**
 * Shared Project View Page
 * 
 * Public page for viewing shared projects (read-only).
 * Uses service role to fetch data, tracks access client-side.
 */

import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ShareViewer } from '@/components/share/ShareViewer';
import { ShareHitTracker } from '@/components/share/ShareHitTracker';
import type { SharedProjectResult } from '@/types/database';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    notFound();
  }

  // Fetch share link and project using admin client (bypasses RLS)
  const response = await supabaseAdmin.rpc('get_shared_project', {
    share_token: token,
  });
  
  const shareData = response.data as SharedProjectResult[] | null;

  if (response.error || !shareData || shareData.length === 0) {
    notFound();
  }

  const share: SharedProjectResult = shareData[0]!;

  // Check if link is active
  if (!share.link_is_active) {
    return (
      <ShareError 
        title="Link Unavailable" 
        message="This share link has been revoked by the owner." 
      />
    );
  }

  // Check if link has expired
  if (share.link_expires_at && new Date(share.link_expires_at) < new Date()) {
    return (
      <ShareError 
        title="Link Expired" 
        message="This share link has expired. Please request a new link from the project owner." 
      />
    );
  }

  // Prepare project data for viewer
  const project = {
    id: share.project_id,
    name: share.project_name,
    data: share.project_data,
    updatedAt: share.project_updated_at,
  };

  return (
    <>
      {/* Client component for tracking access */}
      <ShareHitTracker token={token} />
      
      {/* Main viewer */}
      <ShareViewer project={project} />
    </>
  );
}

function ShareError({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400">{message}</p>
        <a
          href="/"
          className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}
