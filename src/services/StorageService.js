import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

// Initialize Supabase client only if credentials are provided
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const PET_REPORTS_BUCKET = "pet-reports";

const sanitizeFileName = (fileName = "file") =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const stripExtension = (fileName = "") =>
  fileName.includes(".") ? fileName.substring(0, fileName.lastIndexOf(".")) : fileName;

const getFileExtension = (file) => {
  const originalName = file?.name || "";
  const fromName = originalName.includes(".") ? originalName.split(".").pop() : "";

  if (fromName) return fromName.toLowerCase();

  const mimeExtensions = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };

  return mimeExtensions[file?.type] || "bin";
};

const uploadPublicFile = async (bucket, filePath, file) => {
  if (!supabase) {
    throw new Error("Supabase is not configured. Please add your Supabase credentials to .env.local");
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (error) {
    console.error("[StorageService] Upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
};

/**
 * Upload a lab report PDF to Supabase Storage
 * @param {File} file - The PDF file to upload
 * @param {string} clinicId - The clinic ID
 * @param {string} petId - The pet ID
 * @param {string} labId - The lab test ID
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadLabReport = async (file, clinicId, petId, labId) => {
  console.log('[StorageService] Starting upload with:', { clinicId, petId, labId, fileName: file.name });

  // Generate unique file name
  const timestamp = Date.now();
  const extension = getFileExtension(file);
  const fileName = `clinic-${clinicId}/pet-${petId}/lab-${labId}-${timestamp}.${extension}`;

  console.log('[StorageService] Generated fileName:', fileName);

  const publicUrl = await uploadPublicFile(PET_REPORTS_BUCKET, fileName, file);

  console.log('[StorageService] Generated public URL:', publicUrl);

  return publicUrl;
};

/**
 * Upload a super admin funds proof file to Supabase Storage
 * Stored under a dedicated namespace to keep payment proofs separate from medical records.
 * @param {File} file
 * @param {string} fundId
 * @returns {Promise<string>}
 */
export const uploadFundsProof = async (file, fundId = "pending") => {
  console.log("[StorageService] Starting funds proof upload:", { fundId, fileName: file?.name });

  const timestamp = Date.now();
  const extension = getFileExtension(file);
  const safeBaseName = sanitizeFileName(stripExtension(file?.name || "proof"));
  const filePath = `superadmin/funds/${fundId}/${timestamp}-${safeBaseName}.${extension}`;

  const publicUrl = await uploadPublicFile(PET_REPORTS_BUCKET, filePath, file);

  console.log("[StorageService] Funds proof URL:", publicUrl);

  return publicUrl;
};

/**
 * Delete a lab report PDF from Supabase Storage
 * @param {string} fileUrl - The full URL of the file to delete
 * @returns {Promise<void>}
 */
export const deleteLabReport = async (fileUrl) => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  // Extract the file path from the URL
  const urlParts = fileUrl.split(`/storage/v1/object/public/${PET_REPORTS_BUCKET}/`);
  if (urlParts.length < 2) {
    console.warn('Invalid file URL format:', fileUrl);
    return;
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from(PET_REPORTS_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error('Supabase delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Check if Supabase is configured
 * @returns {boolean}
 */
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseKey);
};
