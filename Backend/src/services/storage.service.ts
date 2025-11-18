import { supabase } from '../config/database';
import fs from 'fs';

/**
 * Service for handling file uploads to Supabase Storage
 */
class StorageService {
  private readonly bucketName = 'analysis-files';

  /**
   * Initialize storage bucket (create if doesn't exist)
   */
  async initializeBucket(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();

      if (listError) {
        console.error('❌ Failed to list buckets:', listError);
        return;
      }

      const bucketExists = buckets?.some(b => b.name === this.bucketName);

      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
          public: false, // Private bucket (require authentication)
          fileSizeLimit: 10485760, // 10MB
        });

        if (createError) {
          console.error('❌ Failed to create bucket:', createError);
        } else {
          console.log(`✅ Created storage bucket: ${this.bucketName}`);
        }
      } else {
        console.log(`✅ Storage bucket already exists: ${this.bucketName}`);
      }
    } catch (error) {
      console.error('❌ Storage initialization error:', error);
    }
  }

  /**
   * Upload file to Supabase Storage
   */
  async uploadFile(
    filePath: string,
    fileName: string,
    userId: string,
    fileType: 'csv' | 'image'
  ): Promise<{ path: string; url: string } | null> {
    try {
      // Read file from disk
      const fileBuffer = fs.readFileSync(filePath);

      // Generate storage path: userId/fileType/fileName
      const storagePath = `${userId}/${fileType}/${Date.now()}-${fileName}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer, {
          contentType: fileType === 'csv' ? 'text/csv' : 'image/*',
          upsert: false,
        });

      if (error) {
        console.error('❌ Failed to upload file to storage:', error);
        return null;
      }

      console.log(`✅ Uploaded file to storage: ${storagePath}`);

      // Get public URL (for private bucket, this requires signed URL)
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(storagePath);

      return {
        path: storagePath,
        url: urlData.publicUrl,
      };
    } catch (error) {
      console.error('❌ File upload error:', error);
      return null;
    }
  }

  /**
   * Download file from Supabase Storage
   */
  async downloadFile(storagePath: string): Promise<Blob | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(storagePath);

      if (error) {
        console.error('❌ Failed to download file:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ File download error:', error);
      return null;
    }
  }

  /**
   * Delete file from Supabase Storage
   */
  async deleteFile(storagePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([storagePath]);

      if (error) {
        console.error('❌ Failed to delete file:', error);
        return false;
      }

      console.log(`✅ Deleted file from storage: ${storagePath}`);
      return true;
    } catch (error) {
      console.error('❌ File delete error:', error);
      return false;
    }
  }

  /**
   * Get signed URL for private file access (valid for 1 hour)
   */
  async getSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .createSignedUrl(storagePath, expiresIn);

      if (error) {
        console.error('❌ Failed to create signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('❌ Signed URL error:', error);
      return null;
    }
  }
}

export const storageService = new StorageService();
