import TurndownService from 'turndown';

// Convert HTML to Markdown
export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });
  
  // Configure turndown to handle images and links properly
  turndownService.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: (content) => `~~${content}~~`,
  });

  return turndownService.turndown(html);
}

// Convert Markdown to HTML (simple version - for initial load)
// For better conversion, we could use marked or markdown-it
export function markdownToHtml(markdown: string | undefined | null): string {
  // Handle undefined/null/empty values
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }
  
  // Simple conversion - for complex cases, use a proper Markdown parser
  // For now, we'll assume the content is already HTML or use a simple regex
  // In production, you might want to use 'marked' or 'markdown-it'
  
  // If it looks like HTML, return as is
  if (markdown.trim().startsWith('<')) {
    return markdown;
  }
  
  // Otherwise, treat as Markdown and do basic conversion
  // This is a simplified version - for production, use a proper Markdown parser
  // Split by lines to handle block-level elements properly
  const lines = markdown.split('\n');
  let html = '';
  let listType: 'ul' | 'ol' | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle images (can be inline or block)
    if (line.includes('![')) {
      const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        // Close any open list
        if (listType) {
          html += `</${listType}>\n`;
          listType = null;
        }
        html += `<img src="${imageMatch[2]}" alt="${imageMatch[1]}" />`;
        // Replace the image markdown in the line
        const remainingLine = line.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '').trim();
        if (remainingLine) {
          // Process remaining content on the same line
          html += processInlineMarkdown(remainingLine);
        }
        html += '\n';
        continue;
      }
    }
    
    // Headers
    if (line.startsWith('### ')) {
      if (listType) {
        html += `</${listType}>\n`;
        listType = null;
      }
      html += `<h3>${processInlineMarkdown(line.substring(4))}</h3>\n`;
    } else if (line.startsWith('## ')) {
      if (listType) {
        html += `</${listType}>\n`;
        listType = null;
      }
      html += `<h2>${processInlineMarkdown(line.substring(3))}</h2>\n`;
    } else if (line.startsWith('# ')) {
      if (listType) {
        html += `</${listType}>\n`;
        listType = null;
      }
      html += `<h1>${processInlineMarkdown(line.substring(2))}</h1>\n`;
    } else if (line.startsWith('- ')) {
      if (listType !== 'ul') {
        if (listType) {
          html += `</${listType}>\n`;
        }
        html += '<ul>\n';
        listType = 'ul';
      }
      html += `<li>${processInlineMarkdown(line.substring(2))}</li>\n`;
    } else if (/^\d+\. /.test(line)) {
      if (listType !== 'ol') {
        if (listType) {
          html += `</${listType}>\n`;
        }
        html += '<ol>\n';
        listType = 'ol';
      }
      const match = line.match(/^\d+\. (.*)/);
      if (match) {
        html += `<li>${processInlineMarkdown(match[1])}</li>\n`;
      }
    } else {
      if (listType) {
        html += `</${listType}>\n`;
        listType = null;
      }
      if (line.trim()) {
        // Process inline images in regular paragraphs
        let processedLine = line.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
        html += `<p>${processInlineMarkdown(processedLine)}</p>\n`;
      } else {
        html += '<br />\n';
      }
    }
  }
  
  if (listType) {
    html += `</${listType}>\n`;
  }
  
  return html;
}

function processInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}
