'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon, Undo, Redo } from 'lucide-react';
import { useEffect } from 'react';
import { htmlToMarkdown, markdownToHtml } from '@/lib/markdown';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  categoryId?: string; // Required for file uploads
  articleId?: string; // Required for file uploads
}

export default function TiptapEditor({ 
  content, 
  onChange, 
  placeholder = 'Энд бичнэ үү...', 
  className = '',
  categoryId,
  articleId,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#02251A] underline hover:text-[#02251A]',
        },
      }),
      Image.configure({
        inline: false, // Block element for better text flow
        allowBase64: false, // Only use R2 URLs
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4 block',
        },
      }),
    ],
    content: markdownToHtml(content),
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      // Get content as HTML and convert to Markdown
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onChange(markdown);
    },
  });

  useEffect(() => {
    if (editor && content) {
      const html = markdownToHtml(content);
      const currentHtml = editor.getHTML();
      // Only update if content actually changed to avoid infinite loops
      if (html !== currentHtml && html.trim() !== currentHtml.trim()) {
        editor.commands.setContent(html, false); // false = don't emit update event
      }
    } else if (editor && !content) {
      // Clear editor if content is empty
      editor.commands.clearContent();
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className={`border-2 border-gray-200 rounded-lg bg-white min-h-[300px] p-4 ${className}`}>
        <p className="text-gray-400">Уншиж байна...</p>
      </div>
    );
  }

  return (
    <div className={`border-2 border-gray-200 rounded-lg bg-white focus-within:border-[#02251A] focus-within:ring-2 focus-within:ring-[#02251A]/20 transition-all ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('bold') ? 'bg-[#02251A]/10 text-[#02251A]' : 'text-gray-700'
          }`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('italic') ? 'bg-[#02251A]/10 text-[#02251A]' : 'text-gray-700'
          }`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-[#02251A]/10 text-[#02251A]' : 'text-gray-700'
          }`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-[#02251A]/10 text-[#02251A]' : 'text-gray-700'
          }`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-[#02251A]/10 text-[#02251A]' : 'text-gray-700'
          }`}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('bulletList') ? 'bg-[#02251A]/10 text-[#02251A]' : 'text-gray-700'
          }`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('orderedList') ? 'bg-[#02251A]/10 text-[#02251A]' : 'text-gray-700'
          }`}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('link') ? 'bg-[#02251A]/10 text-[#02251A]' : 'text-gray-700'
          }`}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <label className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700 cursor-pointer" title="Add Image">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              
              if (!categoryId) {
                alert('Ангилал сонгоно уу. Эхлээд ангилал сонгоод дараа нь зураг оруулна уу.');
                return;
              }

              // Use temp ID if articleId is not provided or is "new"
              const uploadArticleId = articleId && articleId !== 'new' ? articleId : `temp-${Date.now()}`;

              try {
                // Store position BEFORE inserting loading text
                const insertPos = editor.state.selection.from;
                const loadingText = 'Uploading image...';
                
                // Show loading state
                editor.chain().focus().insertContent(loadingText).run();
                
                const formData = new FormData();
                formData.append('file', file);
                formData.append('categoryId', categoryId);
                formData.append('articleId', uploadArticleId);

                const response = await fetch('/api/upload', {
                  method: 'POST',
                  body: formData,
                });

                if (!response.ok) {
                  const error = await response.json();
                  throw new Error(error.error || 'Failed to upload image');
                }

                const data = await response.json();
                
                // Remove loading text
                const deleteFrom = Math.max(0, insertPos);
                const deleteTo = Math.min(editor.state.doc.content.size, insertPos + loadingText.length);
                
                if (deleteFrom < deleteTo) {
                  editor.chain().focus()
                    .setTextSelection({ from: deleteFrom, to: deleteTo })
                    .deleteSelection()
                    .run();
                }
                
                // Insert image as block element using TipTap's setImage command
                // This properly handles block-level insertion
                editor.chain().focus()
                  .setImage({ src: data.url, alt: '' })
                  .run();
                
                // Ensure cursor is positioned after the image
                // For block images, we need to create a new paragraph after insertion
                requestAnimationFrame(() => {
                  const { state } = editor;
                  const { selection } = state;
                  
                  // Find the image node that was just inserted
                  let imagePos = -1;
                  state.doc.descendants((node, pos) => {
                    if (node.type.name === 'image' && node.attrs.src === data.url && imagePos === -1) {
                      imagePos = pos;
                    }
                  });
                  
                  if (imagePos !== -1) {
                    // Calculate position after the image
                    const imageNode = state.doc.nodeAt(imagePos);
                    if (imageNode) {
                      const afterImagePos = imagePos + imageNode.nodeSize;
                      
                      // Insert a new paragraph after the image
                      editor.chain()
                        .setTextSelection({ from: afterImagePos, to: afterImagePos })
                        .insertContent('<p></p>')
                        .setTextSelection({ from: afterImagePos + 3, to: afterImagePos + 3 })
                        .focus()
                        .run();
                    }
                  }
                });
              } catch (error: any) {
                alert(`Зураг оруулахад алдаа гарлаа: ${error.message}`);
                // Try to remove loading text if it exists
                try {
                  const docText = editor.getText();
                  const loadingIndex = docText.indexOf('Uploading image...');
                  if (loadingIndex !== -1) {
                    // Find the position in the document
                    let pos = 0;
                    let found = false;
                    editor.state.doc.descendants((node, nodePos) => {
                      if (!found && pos + node.textContent.length > loadingIndex) {
                        const textPos = loadingIndex - pos;
                        const deleteFrom = nodePos + textPos;
                        const deleteTo = deleteFrom + 'Uploading image...'.length;
                        if (deleteFrom >= 0 && deleteTo <= editor.state.doc.content.size) {
                          editor.chain().focus()
                            .setTextSelection({ from: deleteFrom, to: deleteTo })
                            .deleteSelection()
                            .run();
                        }
                        found = true;
                      }
                      pos += node.textContent.length;
                    });
                  }
                } catch (cleanupError) {
                  // If cleanup fails, just clear if editor only has loading text
                  const docText = editor.getText().trim();
                  if (docText === 'Uploading image...') {
                    editor.chain().focus().clearContent().run();
                  }
                }
              } finally {
                // Reset file input
                e.target.value = '';
              }
            }}
          />
          <ImageIcon className="h-4 w-4" />
        </label>
        <div className="w-px h-6 bg-gray-300" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700 disabled:opacity-50"
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700 disabled:opacity-50"
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="min-h-[300px]" />
    </div>
  );
}
