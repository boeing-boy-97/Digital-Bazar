// Storage Provider - REAL S3 / R2 / Local (dev only)
// Validates MIME, size, dimensions, path traversal per lib/storage/validation.ts

import { validateFileUpload, generateSafeFileName } from './validation';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
  provider: string;
}

export async function uploadFile(file: { name: string; type: string; size: number; buffer: Buffer }): Promise<UploadResult> {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  const validation = validateFileUpload(file);
  
  if (!validation.valid) {
    return { success: false, error: validation.error, provider };
  }

  const safeName = generateSafeFileName(file.name);

  try {
    if (provider === 'local') {
      return await uploadLocal(file, safeName);
    } else if (provider === 's3' || provider === 'r2') {
      return await uploadS3R2(file, safeName);
    } else {
      return await uploadLocal(file, safeName);
    }
  } catch (e: any) {
    console.error(`[STORAGE] Upload failed via ${provider}: ${e.message}`);
    return { success: false, error: e.message, provider };
  }
}

async function uploadLocal(file: { name: string; type: string; size: number; buffer: Buffer }, safeName: string): Promise<UploadResult> {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[STORAGE] Using LOCAL storage in production - files will be lost on Vercel (ephemeral). Use S3/R2 for REAL per .env.example');
  }

  const fs = require('fs');
  const path = require('path');
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, safeName);
  fs.writeFileSync(filePath, file.buffer);

  const url = `/uploads/${safeName}`;
  console.log(`[STORAGE] File uploaded LOCAL: ${url} (dev only)`);
  return { success: true, url, key: safeName, provider: 'local' };
}

async function uploadS3R2(file: { name: string; type: string; size: number; buffer: Buffer }, safeName: string): Promise<UploadResult> {
  const bucket = process.env.STORAGE_BUCKET;
  const region = process.env.STORAGE_REGION || 'ap-south-1';
  const accessKey = process.env.STORAGE_ACCESS_KEY;
  const secretKey = process.env.STORAGE_SECRET_KEY;
  const endpoint = process.env.STORAGE_ENDPOINT;
  const publicUrl = process.env.STORAGE_PUBLIC_URL;

  if (!bucket || !accessKey || !secretKey) {
    throw new Error('S3/R2 not configured - set STORAGE_BUCKET/ACCESS_KEY/SECRET_KEY per .env.example for REAL storage');
  }

  // npm i @aws-sdk/client-s3 - eval to avoid webpack when not installed
  const s3Require = eval("require") as any;
  const { S3Client, PutObjectCommand } = s3Require('@aws-sdk/client-s3');

  const s3Config: any = {
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey }
  };

  if (endpoint) {
    s3Config.endpoint = endpoint;
    s3Config.forcePathStyle = false;
  }

  const s3 = new S3Client(s3Config);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: safeName,
    Body: file.buffer,
    ContentType: file.type,
    CacheControl: 'public, max-age=31536000, immutable'
  });

  await s3.send(command);

  const url = publicUrl ? `${publicUrl}/${safeName}` : `https://${bucket}.s3.${region}.amazonaws.com/${safeName}`;
  console.log(`[STORAGE] REAL file uploaded via ${process.env.STORAGE_PROVIDER} to ${url}`);
  return { success: true, url, key: safeName, provider: process.env.STORAGE_PROVIDER || 's3' };
}

export function getStorageConfigState() {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  if (provider === 'local') {
    return { 
      mode: 'local', 
      healthy: process.env.NODE_ENV !== 'production', 
      message: process.env.NODE_ENV === 'production' 
        ? 'MOCK local storage in prod - files lost on deploy, use S3/R2 per .env.example for REAL' 
        : 'Local storage for dev - OK'
    };
  }
  const bucket = process.env.STORAGE_BUCKET;
  const accessKey = process.env.STORAGE_ACCESS_KEY;
  if (!bucket || !accessKey) {
    return { mode: provider, healthy: false, message: `${provider} not configured - set STORAGE_BUCKET/ACCESS_KEY/SECRET_KEY per .env.example` };
  }
  return { mode: provider, healthy: true, message: `REAL storage via ${provider} bucket ${bucket}` };
}
