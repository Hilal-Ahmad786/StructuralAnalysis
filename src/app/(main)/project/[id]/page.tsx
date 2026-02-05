/**
 * Project Editor Page
 * 
 * Loads a project from the database and renders the editor.
 */

import { notFound, redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase/server';
import { getProject } from '@/server/db/projects';
import { ProjectEditor } from '@/components/project/ProjectEditor';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const user = await getServerUser();
  
  if (!user) {
    const { id } = await params;
    redirect(`/login?redirect=/project/${id}`);
  }

  const { id } = await params;
  const project = await getProject(id);
  
  if (!project) {
    notFound();
  }

  return (
    <ProjectEditor
      projectId={project.id}
      initialName={project.name}
      initialData={project.data}
    />
  );
}
