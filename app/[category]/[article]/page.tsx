import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getArticle, incrementArticleViews, getCategoryBySlug } from '@/lib/db';
import { ChevronRight, Home } from 'lucide-react';
import ArticleFeedback from '@/components/ArticleFeedback';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import { sanitizeArticleHtml } from '@/lib/sanitize-html';
import type { Metadata } from 'next';


function isHTML(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return trimmed.startsWith('<') && (trimmed.includes('</') || trimmed.includes('/>'));
}

interface PageProps {
  params: Promise<{
    category: string;
    article: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, article: articleSlug } = await params;
  const article = await getArticle(category, articleSlug);

  if (!article) {
    return { title: 'LIME тусламж - Knowledge Base', description: 'LIME-ийн тусламж, зааварчилгаа' };
  }

  const stripHtmlAndMarkdown = (text: string) => {
    if (!text) return '';
    let cleaned = text.replace(/<[^>]*>/g, '');
    cleaned = cleaned.replace(/#{1,6}\s+/g, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    return cleaned.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);
  };

  const description = article.excerpt
    ? stripHtmlAndMarkdown(article.excerpt)
    : stripHtmlAndMarkdown(article.content) || 'LIME-ийн тусламж, зааварчилгаа';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://help.lime.mn';
  const imageUrl = `${siteUrl}/og-image.png`;

  return {
    title: `${article.title} - LIME тусламж`,
    description,
    openGraph: {
      title: article.title, description,
      url: `${siteUrl}/${category}/${articleSlug}`,
      siteName: 'LIME тусламж',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: article.title }],
      locale: 'mn_MN', type: 'article',
    },
    twitter: { card: 'summary_large_image', title: article.title, description, images: [imageUrl] },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { category, article: articleSlug } = await params;
  const article = await getArticle(category, articleSlug);

  if (!article) notFound();

  await incrementArticleViews(article.id);

  // Fetch the real category title from DB — not slug capitalization
  const categoryData = await getCategoryBySlug(category);
  const categoryLabel = categoryData?.title ?? category;

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
            <Link href={`/${category}`} className="hover:text-white/70 transition-colors">
              {categoryLabel}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/60 truncate max-w-[200px] sm:max-w-none">{article.title}</span>
          </nav>
        </div>
      </div>

      {/* Article content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Article header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {article.title}
            </h1>
          </div>

          {/* Article body */}
          <div className="px-8 py-8">
            <div className="prose prose-lg max-w-none">
              {isHTML(article.content) ? (
                <div className="prose-content" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }} />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div className="px-8 pb-8 pt-2 border-t border-gray-100 mt-4">
            <ArticleFeedback articleId={article.id} />
          </div>
        </article>

        {/* Back link */}
        <div className="mt-6">
          <Link
            href={`/${category}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#02251A] transition-colors group"
          >
            <ChevronRight className="h-4 w-4 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
            {categoryLabel} руу буцах
          </Link>
        </div>
      </main>
    </div>
  );
}
