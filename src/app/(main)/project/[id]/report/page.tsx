/**
 * Project Report Page
 * 
 * Generates a printable HTML report with analysis results.
 * Uses Server Component for initial data fetch, Client Component for interactivity.
 */

import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase/server';
import { getProject } from '@/server/db/projects';
import { ReportClient } from './ReportClient';

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const user = await getServerUser();
  
  if (!user) {
    const { id } = await params;
    redirect(`/login?redirect=/project/${id}/report`);
  }

  const { id } = await params;
  const project = await getProject(id);
  
  if (!project) {
    notFound();
  }

  return (
    <ReportClient
      project={{
        id: project.id,
        name: project.name,
        data: project.data,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      }}
      userName={user.email || undefined}
    />
  );
}
