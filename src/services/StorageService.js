import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

// Initialize Supabase client only if credentials are provided
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Upload a lab report PDF to Supabase Storage
 * @param {File} file - The PDF file to upload
 * @param {string} clinicId - The clinic ID
 * @param {string} petId - The pet ID
 * @param {string} labId - The lab test ID
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadLabReport = async (file, clinicId, petId, labId) => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please add your Supabase credentials to .env.local');
  }

  // Generate unique file name
  const timestamp = Date.now();
  const fileName = `clinic-${clinicId}/pet-${petId}/lab-${labId}-${timestamp}.pdf`;

  // Upload the file
  const { data, error } = await supabase.storage
    .from('pet-reports')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'application/pdf'
    });

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('pet-reports')
    .getPublicUrl(fileName);

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
  const urlParts = fileUrl.split('/storage/v1/object/public/pet-reports/');
  if (urlParts.length < 2) {
    console.warn('Invalid file URL format:', fileUrl);
    return;
  }

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('pet-reports')
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