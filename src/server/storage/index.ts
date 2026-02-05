/**
 * Server Storage Utilities
 * 
 * File storage helpers using Supabase Storage.
 * Currently a placeholder for future file upload features.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================================================
// Types
// ============================================================================

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

// ============================================================================
// Constants
// ============================================================================

const BUCKET_NAME = 'project-files';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/pdf',
  'text/csv',
  'application/json',
];

// ============================================================================
// Upload Functions
// ============================================================================

/**
 * Upload a file to storage
 */
export async function uploadFile(
  userId: string,
  projectId: string,
  file: File
): Promise<UploadResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: 'File type not allowed',
    };
  }

  // Generate unique path
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${userId}/${projectId}/${timestamp}-${sanitizedName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    success: true,
    path: data.path,
    url: urlData.publicUrl,
  };
}

/**
 * Upload a file from base64 data
 */
export async function uploadBase64(
  userId: string,
  projectId: string,
  base64Data: string,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  // Decode base64
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Validate size
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Generate path
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${userId}/${projectId}/${timestamp}-${sanitizedName}`;

  // Upload
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    success: true,
    path: data.path,
    url: urlData.publicUrl,
  };
}

// ============================================================================
// Download Functions
// ============================================================================

/**
 * Download a file from storage
 */
export async function downloadFile(path: string): Promise<Blob | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .download(path);

  if (error) {
    console.error('Download error:', error);
    return null;
  }

  return data;
}

/**
 * Get a signed URL for temporary access
 */
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}

// ============================================================================
// Delete Functions
// ============================================================================

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string): Promise<boolean> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    return false;
  }

  return true;
}

/**
 * Delete all files for a project
 */
export async function deleteProjectFiles(
  userId: string,
  projectId: string
): Promise<boolean> {
  const { data: files, error: listError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(`${userId}/${projectId}`);

  if (listError || !files) {
    return false;
  }

  if (files.length === 0) {
    return true;
  }

  const paths = files.map((f) => `${userId}/${projectId}/${f.name}`);
  const { error: deleteError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove(paths);

  return !deleteError;
}

// ============================================================================
// List Functions
// ============================================================================

/**
 * List files for a project
 */
export async function listProjectFiles(
  userId: string,
  projectId: string
): Promise<FileMetadata[]> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(`${userId}/${projectId}`);

  if (error || !data) {
    return [];
  }

  return data.map((file) => ({
    name: file.name,
    size: file.metadata?.size ?? 0,
    type: file.metadata?.mimetype ?? 'application/octet-stream',
    lastModified: new Date(file.updated_at ?? file.created_at).getTime(),
  }));
}
