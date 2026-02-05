/**
 * New Project Page
 * 
 * Creates a new project and redirects to the editor.
 */

import { redirect } from 'next/navigation';
import { getServerUser } from '@/lib/supabase/server';
import { createProject } from '@/server/db/projects';

export default async function NewProjectPage() {
  const user = await getServerUser();
  
  if (!user) {
    redirect('/login?redirect=/project/new');
  }

  // Create new project
  const project = await createProject({
    name: 'Untitled Project',
  });

  // Redirect to editor
  redirect(`/project/${project.id}`);
}
