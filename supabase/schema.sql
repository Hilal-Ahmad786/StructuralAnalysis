/**
 * Supabase Database Schema
 * 
 * Run this in the Supabase SQL Editor to create the required tables.
 * 
 * Tables:
 * - projects: Stores structural analysis projects
 * - share_links: Manages project sharing
 * 
 * RLS (Row Level Security) policies are included.
 */

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  version INTEGER NOT NULL DEFAULT 1
);

-- Index for faster queries by owner
CREATE INDEX IF NOT EXISTS projects_owner_id_idx ON projects(owner_id);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects(updated_at DESC);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = owner_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SHARE LINKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS share_links_project_id_idx ON share_links(project_id);
CREATE INDEX IF NOT EXISTS share_links_created_by_idx ON share_links(created_by);

-- Enable RLS
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own share links
CREATE POLICY "Users can view own share links"
  ON share_links FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create share links for own projects"
  ON share_links FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own share links"
  ON share_links FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own share links"
  ON share_links FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to increment share access count (callable via RPC)
CREATE OR REPLACE FUNCTION increment_share_access(share_token UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE share_links
  SET access_count = access_count + 1
  WHERE id = share_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW());
END;
$$;

-- Function to get project for share link (bypasses RLS)
CREATE OR REPLACE FUNCTION get_shared_project(share_token UUID)
RETURNS TABLE (
  project_id UUID,
  project_name TEXT,
  project_data JSONB,
  project_updated_at TIMESTAMPTZ,
  link_is_active BOOLEAN,
  link_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.data,
    p.updated_at,
    sl.is_active,
    sl.expires_at
  FROM share_links sl
  JOIN projects p ON p.id = sl.project_id
  WHERE sl.id = share_token;
END;
$$;

-- ============================================================================
-- SAMPLE DATA (for development)
-- ============================================================================

-- Uncomment to add sample project for testing (requires a valid user ID)
-- INSERT INTO projects (name, owner_id, data) VALUES (
--   'Sample Portal Frame',
--   'YOUR_USER_ID_HERE',
--   '{"model":{"nodes":[{"id":"N1","x":0,"y":0},{"id":"N2","x":0,"y":4}],"members":[],"materials":[],"sections":[],"supports":[]},"loadCases":[]}'
-- );
