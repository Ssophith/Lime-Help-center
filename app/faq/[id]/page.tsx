import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getFAQById } from '@/lib/db';
import { ChevronRight, Home } from 'lucide-react';
import Header from '@/components/Header';
import { sanitizeArticleHtml } from '@/lib/sanitize-html';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://help.lime.mn';
const ogImage = `${siteUrl}/og-image.png`;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const faq = await getFAQById(id);
  if (!faq) return { title: 'LIME тусламж' };
  const desc = faq.content?.replace(/<[^>]*>/g, '').substring(0, 160) || 'LIME-ийн түгээмэл асуулт';
  return {
    title: `${faq.title} - LIME тусламж`,
    description: desc,
    openGraph: {
      title: faq.title,
      description: desc,
      url: `${siteUrl}/faq/${id}`,
      siteName: 'LIME тусламж',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'LIME тусламж' }],
      locale: 'mn_MN', type: 'article',
    },
    twitter: { card: 'summary_large_image', title: faq.title, description: desc, images: [ogImage] },
  };
}

function isHTML(content: string): boolean {
  const t = content?.trim();
  return t?.startsWith('<') && (t.includes('</') || t.includes('/>'));
}

export default async function FAQPage({ params }: PageProps) {
  const { id } = await params;
  const faq = await getFAQById(id);
  if (!faq) notFound();

  return (
    <div className="min-h-screen" style={{ background: 'var(--lime-bg)' }}>
      <Header />

      {/* Slim breadcrumb bar */}
      <div style={{ background: 'var(--lime-dark)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-white/40">
            <Link href="/" className="hover:text-white/70 transition-colors flex items-center gap-1">
              <Home className="h-3 w-3" />Нүүр
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/60 truncate">{faq.title}</span>
          </nav>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* FAQ header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <div className="lime-section-label">Асуулт & Хариулт</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {faq.title}
            </h1>
          </div>

          {/* FAQ body */}
          <div className="px-8 py-8">
            <div className="prose prose-lg max-w-none">
              {isHTML(faq.content) ? (
                <div className="prose-content faq-html-content" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(faq.content) }} />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{faq.content}</ReactMarkdown>
              )}
            </div>
          </div>
        </article>

        {/* Back link */}
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#02251A] transition-colors group"
          >
            <ChevronRight className="h-4 w-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            Түгээмэл асуултууд руу буцах
          </Link>
        </div>
      </main>
    </div>
  );
}
