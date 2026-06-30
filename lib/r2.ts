import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize R2 client (R2 is S3-compatible)
const getR2Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const endpoint = process.env.R2_ENDPOINT;

  if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error('R2 credentials are not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT in your .env file.');
  }

  // Create S3Client with proper configuration for Cloudflare R2
  // R2 requires forcePathStyle: true and doesn't support CRC32 checksums
  const client = new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    // Required for R2 compatibility
    forcePathStyle: true,
  });
  
  return client;
};

// Generate file path: categories/{categorySlug}/articles/{articleId}/files/{filename}
export function generateFilePath(
  categorySlug: string,
  articleId: string,
  originalFilename: string,
  fileType: 'image' | 'video' | 'document' = 'image'
): string {
  const extension = originalFilename.split('.').pop()?.toLowerCase() || 'bin';
  const uniqueId = uuidv4().substring(0, 8);
  const sanitizedFilename = originalFilename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
  const filename = `${uniqueId}_${sanitizedFilename}`;
  
  return `categories/${categorySlug}/articles/${articleId}/${fileType}s/${filename}`;
}

// Upload file to R2
export async function uploadToR2(
  file: Buffer,
  filePath: string,
  contentType: string
): Promise<string> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filePath,
    Body: file,
    ContentType: contentType,
    // Make files publicly accessible
    ACL: 'public-read',
  });

  await client.send(command);

  // Return public URL
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error('R2_PUBLIC_URL is not configured');
  }

  return `${publicUrl}/${filePath}`;
}

// Delete file from R2
export async function deleteFromR2(filePath: string): Promise<void> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: filePath,
  });

  await client.send(command);
}

// List files in a directory
export async function listFiles(prefix: string): Promise<string[]> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('R2_BUCKET_NAME is not configured');
  }

  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });

  const response = await client.send(command);
  return (response.Contents || []).map(item => item.Key || '').filter(Boolean);
}

// Get public URL for a file path
export function getPublicUrl(filePath: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error('R2_PUBLIC_URL is not configured');
  }
  return `${publicUrl}/${filePath}`;
}
