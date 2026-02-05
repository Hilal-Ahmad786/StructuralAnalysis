/**
 * Project Data Access Layer
 * 
 * Server-side functions for project CRUD operations.
 * All functions use the server Supabase client with RLS.
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ProjectData } from '@/types/database';

interface Project {
  id: string;
  name: string;
  owner_id: string;
  data: ProjectData;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface CreateProjectInput {
  name?: string;
  data?: ProjectData;
}

export interface UpdateProjectInput {
  name?: string;
  data?: ProjectData;
}

/**
 * Get all projects for the current user
 */
export async function getUserProjects(): Promise<Project[]> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }

  return data ?? [];
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching project:', error);
    throw new Error('Failed to fetch project');
  }

  return data;
}

/**
 * Create a new project
 */
export async function createProject(input: CreateProjectInput = {}): Promise<Project> {
  const supabase = await createServerSupabaseClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  const defaultData: ProjectData = {
    model: {
      nodes: [],
      members: [],
      materials: [
        { id: 'steel-s235', name: 'Steel S235', E: 210000000 },
        { id: 'steel-s355', name: 'Steel S355', E: 210000000 },
      ],
      sections: [
        { id: 'ipe-200', name: 'IPE 200', A: 0.00285, I: 0.0000194 },
        { id: 'ipe-300', name: 'IPE 300', A: 0.00538, I: 0.0000836 },
        { id: 'heb-200', name: 'HEB 200', A: 0.00781, I: 0.0000570 },
      ],
      supports: [],
    },
    loadCases: [
      {
        id: 'lc-1',
        name: 'Dead Load',
        type: 'dead',
        loads: [],
      },
    ],
  };

  const projectData = {
    owner_id: user.id,
    name: input.name ?? 'Untitled Project',
    data: input.data ?? defaultData,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }

  return data;
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string, 
  input: UpdateProjectInput
): Promise<Project> {
  const supabase = await createServerSupabaseClient();

  const updateData: Record<string, unknown> = {};
  
  if (input.name !== undefined) {
    updateData.name = input.name;
  }
  
  if (input.data !== undefined) {
    updateData.data = input.data;
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }

  return data;
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
}

/**
 * Duplicate a project
 */
export async function duplicateProject(projectId: string): Promise<Project> {
  const supabase = await createServerSupabaseClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Not authenticated');
  }

  // Get original project
  const original = await getProject(projectId);
  
  if (!original) {
    throw new Error('Project not found');
  }

  // Create duplicate
  const projectData = {
    owner_id: user.id,
    name: `${original.name} (Copy)`,
    data: original.data,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) {
    console.error('Error duplicating project:', error);
    throw new Error('Failed to duplicate project');
  }

  return data;
}
