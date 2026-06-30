'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronRight, ArrowLeft } from 'lucide-react';
import type { Article } from '@/types';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';

const stripHtml = (html: string) =>
  html ? html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 160) : '';

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<Array<Article & { categorySlug: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(data => { setResults(data.results || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [q]);

  return (
    <>
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-10">
        <SearchBar />
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="lime-section-label">Хайлт</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? 'Хайж байна...' : (
              <>
                <span className="text-[#02251A]">"{q}"</span>
                {' '}<span className="font-normal text-gray-500 text-lg">— {results.length} илэрц</span>
              </>
            )}
          </h1>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#02251A] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Нүүр
        </Link>
      </div>

      {/* No results */}
      {results.length === 0 && !loading && q.length >= 2 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
               style={{ background: '#F4F4F5' }}>
            <Search className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium mb-1">"{q}" хайлтаар илэрц олдсонгүй</p>
          <p className="text-sm text-gray-400">Өөр үг ашиглан дахин хайж үзнэ үү</p>
        </div>
      )}

      {/* Results list */}
      <div className="space-y-3">
        {results.map((article) => (
          <Link
            key={article.id}
            href={`/${article.categorySlug}/${article.slug}`}
            className="lime-article-row group block"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 group-hover:text-[#02251A] mb-1 transition-colors">
                  {article.title}
                </h2>
                {(article.excerpt || article.content) && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {stripHtml(article.excerpt || article.content)}
                  </p>
                )}
                <span className="inline-block mt-1.5 text-xs text-gray-400 capitalize">
                  {article.categorySlug}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-[#02251A] flex-shrink-0 mt-0.5 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--lime-bg)' }}>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Suspense fallback={
          <div className="py-20 text-center text-gray-400">Хайж байна...</div>
        }>
          <SearchContent />
        </Suspense>
      </main>
    </div>
  );
}
