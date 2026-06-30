import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCategoryBySlug } from '@/lib/db';
import { ChevronRight, Home, Eye } from 'lucide-react';
import Header from '@/components/Header';
import CategoryIcon from '@/components/CategoryIcon';
import SearchBar from '@/components/SearchBar';
import type { Metadata } from 'next';


interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://help.lime.mn';
const ogImage = `${siteUrl}/og-image.png`;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return { title: 'LIME тусламж' };
  return {
    title: `${category.title} - LIME тусламж`,
    description: category.description || `${category.title} — LIME-ийн тусламж, зааварчилгаа`,
    openGraph: {
      title: `${category.title} - LIME тусламж`,
      description: category.description || `${category.title} — LIME-ийн тусламж`,
      url: `${siteUrl}/${categorySlug}`,
      siteName: 'LIME тусламж',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'LIME тусламж' }],
      locale: 'mn_MN', type: 'website',
    },
    twitter: { card: 'summary_large_image', title: `${category.title} - LIME тусламж`, images: [ogImage] },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--lime-bg)' }}>
      <Header />

      {/* Category Hero Band */}
      <section className="lime-hero py-10">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/40 mb-4">
            <Link href="/" className="hover:text-white/70 transition-colors flex items-center gap-1">
              <Home className="h-3 w-3" />
              Нүүр
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/70">{category.title}</span>
          </nav>

          <div className="flex items-center gap-4">
            {category.icon && (
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.2)' }}>
                <CategoryIcon iconName={category.icon} size={28} color="#C8FF00" />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{category.title}</h1>
              {category.description && (
                <p className="text-sm text-white/50 mt-1">{category.description}</p>
              )}
            </div>
            <div className="ml-auto">
              <span className="lime-badge" style={{ fontSize: '0.8rem', height: '26px', padding: '0 10px' }}>
                {category.articles.length} нийтлэл
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Articles */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Compact search on inner page */}
        <div className="mb-6">
          <SearchBar />
        </div>
        <div className="space-y-3">
          {category.articles.length > 0 ? (
            category.articles
              .sort((a, b) => (b.views || 0) - (a.views || 0))
              .map((article, index) => (
                <Link
                  key={article.id}
                  href={`/${category.slug}/${article.slug}`}
                  className="lime-article-row group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-xl font-bold text-gray-100 w-7 flex-shrink-0 text-right">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-900 group-hover:text-[#02251A] font-medium block leading-tight transition-colors">
                        {article.title}
                      </span>
                      {(article.views || 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Eye className="h-3 w-3" />{article.views} удаа уншсан
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#02251A] flex-shrink-0 transition-colors" />
                </Link>
              ))
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              Нийтлэл байхгүй байна.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
