'use client';

import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';

interface TinyMCEEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  categoryId?: string; // Required for file uploads
  articleId?: string; // Required for file uploads
}

export default function TinyMCEEditor({
  content,
  onChange,
  placeholder = 'Энд бичнэ үү...',
  className = '',
  categoryId,
  articleId,
}: TinyMCEEditorProps) {
  const editorRef = useRef<any>(null);

  // Generate temp article ID if needed
  const getArticleId = () => {
    if (articleId && articleId !== 'new') {
      return articleId;
    }
    return `temp-${Date.now()}`;
  };

  // Image upload handler
  const handleImageUpload = async (blobInfo: any, progress: (percent: number) => void): Promise<string> => {
    // Use categoryId if available, otherwise use temp category (for FAQs or new articles)
    const uploadCategoryId = categoryId || 'temp-category';
    const uploadArticleId = getArticleId();
    
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());
    formData.append('categoryId', uploadCategoryId);
    formData.append('articleId', uploadArticleId);

    try {
      progress(0);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      progress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Зураг оруулахад алдаа гарлаа');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      throw new Error(error.message || 'Зураг оруулахад алдаа гарлаа');
    }
  };

  // Video upload handler
  const handleVideoUpload = async (blobInfo: any, progress: (percent: number) => void): Promise<string> => {
    if (!categoryId) {
      throw new Error('Ангилал сонгоно уу');
    }

    const uploadArticleId = getArticleId();
    
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());
    formData.append('categoryId', categoryId);
    formData.append('articleId', uploadArticleId);

    try {
      progress(0);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      progress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Видео оруулахад алдаа гарлаа');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      throw new Error(error.message || 'Видео оруулахад алдаа гарлаа');
    }
  };

  // File (PDF) upload handler
  const handleFileUpload = async (blobInfo: any, progress: (percent: number) => void): Promise<string> => {
    if (!categoryId) {
      throw new Error('Ангилал сонгоно уу');
    }

    const uploadArticleId = getArticleId();
    
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());
    formData.append('categoryId', categoryId);
    formData.append('articleId', uploadArticleId);

    try {
      progress(0);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      progress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Файл оруулахад алдаа гарлаа');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      throw new Error(error.message || 'Файл оруулахад алдаа гарлаа');
    }
  };

  return (
    <div className={className}>
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
        onInit={(evt, editor) => {
          editorRef.current = editor;
          
          // Enable drag and drop for images within the editor
          // TinyMCE supports drag and drop by default, but we ensure images are draggable
          const body = editor.getBody();
          
          // Make sure images can be dragged
          editor.on('NodeChange', () => {
            const images = body.querySelectorAll('img');
            images.forEach((img: any) => {
              img.draggable = true;
              img.style.cursor = 'move';
            });
          });
          
          // Handle drag start for images
          editor.on('dragstart', (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
              // Allow dragging images
              return true;
            }
          });
        }}
        value={content}
        onEditorChange={(content) => onChange(content)}
        init={{
          height: 800,
          min_height: 600,
          menubar: true,
          placeholder: placeholder,
          language: 'en',
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount', 'autoresize'
          ],
          toolbar: 'undo redo | formatselect | ' +
            'bold italic underline strikethrough | forecolor backcolor | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | ' +
            'link image media | code preview fullscreen | help',

          // Only Mulish — no font switching
          font_family_formats: 'Mulish=Mulish,sans-serif;',

          // Format menu options
          formatselect: true,
          
          // Block formats dropdown (includes font sizes via format)
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Preformatted=pre',
          
          // Image upload configuration
          images_upload_handler: handleImageUpload,
          automatic_uploads: true,
          file_picker_types: 'image media file',
          
          // Drag and drop configuration for images
          images_file_types: 'jpg,jpeg,png,gif,webp,svg',
          block_unsupported_drop: false, // Allow drag and drop of supported file types
          
          // Better image upload dialog
          image_advtab: true,
          image_caption: true,
          image_list: false,
          image_title: true,
          image_description: false,
          image_dimensions: true,
          image_class_list: [
            {title: 'None', value: ''},
            {title: 'Responsive', value: 'img-responsive'},
            {title: 'Rounded', value: 'rounded-lg'},
          ],
          
          // Enable drag and drop for images within editor
          object_resizing: true, // Allow resizing images
          image_resize: true, // Enable image resize handles
          draggable_modal: true, // Allow dragging modal dialogs
          
          // Media (video) upload configuration
          media_live_embeds: true,
          
          // File (PDF) upload configuration
          file_picker_callback: (callback, value, meta) => {
            if (meta.filetype === 'file') {
              // Create file input for PDFs and documents
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'application/pdf,.pdf,.doc,.docx');
              
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;

                try {
                  const uploadArticleId = getArticleId();
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('categoryId', categoryId || '');
                  formData.append('articleId', uploadArticleId);

                  const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                  });

                  if (!response.ok) {
                    throw new Error('Файл оруулахад алдаа гарлаа');
                  }

                  const data = await response.json();
                  callback(data.url, { text: file.name, title: file.name });
                } catch (error) {
                  alert('Файл оруулахад алдаа гарлаа');
                }
              };

              input.click();
            } else if (meta.filetype === 'media') {
              // Create file input for videos
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'video/*');
              
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;

                try {
                  const uploadArticleId = getArticleId();
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('categoryId', categoryId || '');
                  formData.append('articleId', uploadArticleId);

                  const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                  });

                  if (!response.ok) {
                    throw new Error('Видео оруулахад алдаа гарлаа');
                  }

                  const data = await response.json();
                  // Insert video as HTML5 video element
                  const videoHtml = `<video controls width="100%"><source src="${data.url}" type="${file.type}">Your browser does not support the video tag.</video>`;
                  callback(videoHtml, {});
                } catch (error) {
                  alert('Видео оруулахад алдаа гарлаа');
                }
              };

              input.click();
            }
          },
          
          // Content styling — Mulish (LIME brandbook typeface)
          content_style: `
            @import url('https://fonts.googleapis.com/css2?family=Mulish:wght@400;500;600;700&display=swap');
            body { 
              font-family: 'Mulish', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              font-size: 16px;
              line-height: 1.6;
              color: #374151;
            }
            p {
              margin: 0.75em 0;
            }
            h1, h2, h3, h4, h5, h6 {
              font-weight: 600;
              margin-top: 1em;
              margin-bottom: 0.5em;
            }
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 1rem auto;
              border-radius: 8px;
              cursor: move; /* Show move cursor on images */
            }
            img[draggable="true"] {
              cursor: grab;
            }
            img[draggable="true"]:active {
              cursor: grabbing;
            }
            video {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 1rem auto;
              border-radius: 8px;
            }
            a {
              color: #02251A;
              text-decoration: underline;
            }
            a:hover {
              color: #02251A;
            }
            code {
              background-color: #f3f4f6;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
            }
            pre {
              background-color: #f3f4f6;
              padding: 1rem;
              border-radius: 8px;
              overflow-x: auto;
            }
            blockquote {
              border-left: 4px solid #02251A;
              padding-left: 1rem;
              margin-left: 0;
              color: #6b7280;
            }
          `,
          
          // Editor body font
          body_class: 'prose-editor',
          body_id: 'tinymce-editor-body',
          
          // Format options visibility
          formats: {
            bold: { inline: 'strong', remove: 'all' },
            italic: { inline: 'em', remove: 'all' },
            underline: { inline: 'u', exact: true },
            strikethrough: { inline: 'del' },
          },
          
          // Style formats for better formatting options
          style_formats: [
            { title: 'Paragraph', format: 'p' },
            { title: 'Heading 1', format: 'h1' },
            { title: 'Heading 2', format: 'h2' },
            { title: 'Heading 3', format: 'h3' },
            { title: 'Heading 4', format: 'h4' },
            { 
              title: 'Inline', 
              items: [
                { title: 'Bold', icon: 'bold', format: 'bold' },
                { title: 'Italic', icon: 'italic', format: 'italic' },
                { title: 'Underline', icon: 'underline', format: 'underline' },
                { title: 'Strikethrough', icon: 'strikethrough', format: 'strikethrough' },
                { title: 'Code', icon: 'code', format: 'code' },
              ]
            },
            {
              title: 'Blocks',
              items: [
                { title: 'Paragraph', format: 'p' },
                { title: 'Blockquote', format: 'blockquote' },
                { title: 'Div', format: 'div' },
                { title: 'Pre', format: 'pre' }
              ]
            },
            {
              title: 'Alignment',
              items: [
                { title: 'Left', icon: 'alignleft', format: 'alignleft' },
                { title: 'Center', icon: 'aligncenter', format: 'aligncenter' },
                { title: 'Right', icon: 'alignright', format: 'alignright' },
                { title: 'Justify', icon: 'alignjustify', format: 'alignjustify' }
              ]
            }
          ],
          
          // Paste configuration
          paste_data_images: true,
          paste_as_text: false,
          
          // Resize configuration
          resize: true,
          autoresize_bottom_margin: 16,
        }}
      />
    </div>
  );
}
