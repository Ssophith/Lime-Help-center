import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, generateFilePath } from '@/lib/r2';
import { getCategoryById } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';
import { requireSameOrigin } from '@/lib/csrf';

// Hard cap on uploads. TinyMCE editor needs images + the occasional PDF / video
// for support articles. Anything above this should go through a different
// channel (R2 direct upload, etc.).
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

// Strict extension/content-type allowlist. Match TinyMCE's accept patterns
// in `components/TinyMCEEditor.tsx` (images_file_types + the video/PDF
// file_picker_callbacks).
const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',           // images
  'mp4', 'webm', 'mov',                                  // video
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', // documents
]);
const ALLOWED_MIME_PREFIXES = ['image/', 'video/'];
const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);

function fileExtensionAllowed(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase();
  return !!ext && ALLOWED_EXTENSIONS.has(ext);
}

function mimeAllowed(mime: string): boolean {
  if (ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))) return true;
  return ALLOWED_MIMES.has(mime);
}

export async function POST(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const unauth = await requireAuth();
  if (unauth) return unauth;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const categoryId = formData.get('categoryId') as string;
    const articleId = formData.get('articleId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!articleId) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `Файл хэт том байна (${Math.round(file.size / 1024 / 1024)} MB). Хязгаар: ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    if (!fileExtensionAllowed(file.name)) {
      return NextResponse.json({ error: 'Зөвшөөрөгдөөгүй файлын төрөл.' }, { status: 415 });
    }
    if (!mimeAllowed(file.type)) {
      return NextResponse.json({ error: 'Зөвшөөрөгдөөгүй content-type.' }, { status: 415 });
    }

    // Use temp category if categoryId is not provided or is 'temp-category'
    let category;
    if (categoryId && categoryId !== 'temp-category') {
      category = await getCategoryById(categoryId);
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
    } else {
      // Create a temporary category object for temp uploads
      category = {
        id: 'temp-category',
        slug: 'temp',
        title: 'Temporary',
        order: 0,
        articles: [],
      };
    }

    // Determine file type based on content type and extension
    const contentType = file.type;
    const fileName = file.name.toLowerCase();
    let fileType: 'image' | 'video' | 'document' = 'document';
    
    if (contentType.startsWith('image/')) {
      fileType = 'image';
    } else if (contentType.startsWith('video/')) {
      fileType = 'video';
    } else if (contentType === 'application/pdf' || fileName.endsWith('.pdf')) {
      fileType = 'document';
    } else if (contentType.startsWith('application/') || fileName.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt)$/)) {
      fileType = 'document';
    } else {
      fileType = 'document'; // Default to document for unknown types
    }

    // Generate file path: categories/{categorySlug}/articles/{articleId}/files/{filename}
    const filePath = generateFilePath(category.slug, articleId, file.name, fileType);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const publicUrl = await uploadToR2(buffer, filePath, contentType);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      type: fileType,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Handle file deletion
export async function DELETE(request: NextRequest) {
  const csrf = requireSameOrigin(request);
  if (csrf) return csrf;
  const unauth = await requireAuth();
  if (unauth) return unauth;
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    const { deleteFromR2 } = await import('@/lib/r2');
    await deleteFromR2(filePath);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}
