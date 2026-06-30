'use client';

import { useState } from 'react';
import type { FAQ } from '@/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sanitizeArticleHtml } from '@/lib/sanitize-html';

interface FAQListProps {
  faqs: FAQ[];
}

// Helper to detect HTML content (TinyMCE output always starts with <p> or other tags)
function isHTML(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return trimmed.startsWith('<') && (trimmed.includes('</') || trimmed.includes('/>'));
}

export default function FAQList({ faqs }: FAQListProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Safety check
  if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {faqs.map((faq, index) => {
        // Safety check for each FAQ
        if (!faq || !faq.id) {
          return null;
        }

        return (
          <div
            key={faq.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-900 font-medium pr-4">
                {faq.title}
              </span>
              {openIndex === index ? (
                <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </button>
            {openIndex === index && (
              <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                <div className="mt-4">
                  {faq.content && typeof faq.content === 'string' && faq.content.trim() ? (
                    isHTML(faq.content) ? (
                      // HTML content from TinyMCE — server-side sanitized.
                      <div
                        className="faq-html-content"
                        dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(faq.content) }}
                      />
                    ) : (
                      // Plain text / Markdown fallback
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {faq.content}
                        </ReactMarkdown>
                      </div>
                    )
                  ) : (
                    <p className="text-gray-500">Агуулга байхгүй байна.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
