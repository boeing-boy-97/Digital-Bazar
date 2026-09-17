// File Upload Security - MIME, extension, size, dimensions validation

export const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
export const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
export const maxFileSize = 5 * 1024 * 1024; // 5MB
export const maxImageDimensions = { width: 4000, height: 4000 };

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

export function validateFileUpload(file: { name: string; type: string; size: number }): FileValidationResult {
  // Check size
  if (file.size > maxFileSize) {
    return { valid: false, error: `File too large. Max ${maxFileSize / 1024 / 1024}MB`, code: 'FILE_TOO_LARGE' };
  }

  // Check MIME type - never trust extension alone
  if (!allowedImageTypes.includes(file.type)) {
    return { valid: false, error: `Invalid file type ${file.type}. Allowed: ${allowedImageTypes.join(', ')}`, code: 'INVALID_MIME' };
  }

  // Check extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return { valid: false, error: `Invalid extension ${ext}. Allowed: ${allowedExtensions.join(', ')}`, code: 'INVALID_EXTENSION' };
  }

  // Check filename for path traversal
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid filename', code: 'INVALID_FILENAME' };
  }

  return { valid: true };
}

export function generateSafeFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  // Never trust user-supplied filename, generate safe one
  return `${timestamp}_${random}.${ext}`;
}

export function validateImageDimensions(width: number, height: number): FileValidationResult {
  if (width > maxImageDimensions.width || height > maxImageDimensions.height) {
    return { valid: false, error: `Image too large. Max ${maxImageDimensions.width}x${maxImageDimensions.height}`, code: 'DIMENSIONS_TOO_LARGE' };
  }
  if (width < 10 || height < 10) {
    return { valid: false, error: 'Image too small', code: 'DIMENSIONS_TOO_SMALL' };
  }
  return { valid: true };
}
