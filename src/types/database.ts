/**
 * Database Types
 * 
 * TypeScript types for Supabase tables.
 * Ideally generated with `npx supabase gen types typescript`.
 * This is a manual definition for development.
 */

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          data: ProjectData;
          created_at: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          id?: string;
          name?: string;
          owner_id: string;
          data?: ProjectData;
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          data?: ProjectData;
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
      };
      share_links: {
        Row: {
          id: string;
          project_id: string;
          created_by: string;
          expires_at: string | null;
          is_active: boolean;
          access_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          created_by: string;
          expires_at?: string | null;
          is_active?: boolean;
          access_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          created_by?: string;
          expires_at?: string | null;
          is_active?: boolean;
          access_count?: number;
          created_at?: string;
        };
      };
    };
    Functions: {
      increment_share_access: {
        Args: { share_token: string };
        Returns: undefined;
      };
      get_shared_project: {
        Args: { share_token: string };
        Returns: SharedProjectResult[];
      };
    };
  };
}

// Result type for get_shared_project function
export interface SharedProjectResult {
  project_id: string;
  project_name: string;
  project_data: ProjectData;
  project_updated_at: string;
  link_is_active: boolean;
  link_expires_at: string | null;
}

// Project data stored in JSONB
export interface ProjectData {
  model: {
    nodes: Array<{ id: string; x: number; y: number }>;
    members: Array<{
      id: string;
      type: 'frame' | 'truss';
      startNodeId: string;
      endNodeId: string;
      materialId: string;
      sectionId: string;
    }>;
    materials: Array<{ id: string; name: string; E: number }>;
    sections: Array<{ id: string; name: string; A: number; I: number }>;
    supports: Array<{ nodeId: string; dx: boolean; dy: boolean; rz: boolean }>;
  };
  loadCases: Array<{
    id: string;
    name: string;
    type: string;
    loads: Array<{
      id: string;
      type: string;
      target: string;
      targetId: string;
      fx?: number;
      fy?: number;
      mz?: number;
      w?: number;
      direction?: string;
    }>;
  }>;
  units?: {
    length: string;
    force: string;
    stress: string;
  };
  settings?: {
    maxIterations: number;
    tolerance: number;
    includeShearDeformation: boolean;
  };
}

// Helper type for project with joined data
export type ProjectWithShareLinks = Database['public']['Tables']['projects']['Row'] & {
  share_links?: Database['public']['Tables']['share_links']['Row'][];
};
