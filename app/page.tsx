import Link from 'next/link';
import { getCategories, getFAQs, getMostReadArticles } from '@/lib/db';
import { ChevronRight, Phone, Mail, Globe } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import CategoryCard from '@/components/CategoryCard';
import FAQList from '@/components/FAQList';
import Header from '@/components/Header';
import type { Category, FAQ } from '@/types';

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export default async function Home() {
  let categories: Category[] = [];
  let faqs: FAQ[] = [];
  let mostReadArticles: Array<{ id: string; title: string; slug: string; categorySlug: string; views: number }> = [];

  try {
    const [categoriesData, faqsData, mostRead] = await Promise.all([
      getCategories(),
      getFAQs(),
      getMostReadArticles(6),
    ]);
    categories = Array.isArray(categoriesData) ? categoriesData : [];
    faqs = Array.isArray(faqsData) ? faqsData : [];
    mostReadArticles = (mostRead || []).map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      categorySlug: article.categorySlug,
      views: article.views || 0,
    }));
  } catch (error) {
    console.error('Error loading data:', error);
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--lime-bg)' }}>
      <Header />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="lime-hero">
        <div className="lime-hero-glow" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-white/60 uppercase tracking-widest mb-6">
            <span style={{ color: 'var(--lime-accent)' }}>●</span>
            LIME Тусламжийн Төв
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Танд хэрхэн{' '}
            <span style={{ color: 'var(--lime-accent)' }}>туслах вэ?</span>
          </h1>
          <p className="text-base sm:text-lg text-white/60 mb-10 max-w-xl mx-auto">
            LIME апп ашиглах заавар болон түгээмэл асуултуудын хариултыг эндээс аваарай
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <SearchBar hero />
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['Дата авах', 'Аяллын дата', 'Дуудлага', 'Багц сунгах'].map((q) => (
              <Link
                key={q}
                href={`/search?q=${encodeURIComponent(q)}`}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-white/60 border border-white/10 hover:border-white/30 hover:text-white transition-all duration-200"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <section className="mb-16">
          <div className="lime-section-label">Ангилал</div>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Юу хайж байна вэ?
            </h2>
            <span className="text-sm text-gray-500">{categories.length} ангилал</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </section>

        {/* ── Popular Articles ──────────────────────── */}
        {mostReadArticles.length > 0 && (
          <section className="mb-16">
            <div className="lime-section-label">Түгээмэл</div>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Хамгийн их уншсан
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mostReadArticles.map((article, i) => (
                <Link
                  key={article.id}
                  href={`/${article.categorySlug}/${article.slug}`}
                  className="lime-article-row group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="text-2xl font-bold text-gray-100 w-8 flex-shrink-0 text-right leading-none">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-gray-900 group-hover:text-[#02251A] font-medium text-sm leading-tight line-clamp-2 transition-colors">
                      {article.title}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#02251A] flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ ──────────────────────────────────── */}
        {faqs.length > 0 && (
          <section className="mb-16">
            <div className="lime-section-label">Асуулт & Хариулт</div>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Түгээмэл асуултууд
              </h2>
            </div>
            <FAQList faqs={faqs} />
          </section>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="lime-footer mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Brand */}
            <div>
              <Link href="/" className="inline-block mb-4">
                <img src="/icons/lime-logo-text.png" alt="LIME" className="h-7 w-auto brightness-0 invert" />
              </Link>
              {/* <p className="text-sm text-white/50 leading-relaxed mb-5">
                LIME — Виртуал оператор. Хязгааргүй ярь!
              </p> */}
              {/* Social */}
              <div className="flex items-center gap-3">
                {[
                  { href: 'https://www.facebook.com/LimeAppOfficial', label: 'Facebook', d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                  { href: 'https://www.instagram.com/lime.mongolia', label: 'Instagram', d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                  { href: 'https://x.com/LimeAppOfficial', label: 'X (Twitter)', d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                  { href: 'https://www.youtube.com/@lime-7190', label: 'YouTube', d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
                ].map(({ href, label, d }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d={d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Түргэн холбоос</h3>
              <ul className="space-y-2.5">
                {categories.slice(0, 5).map(cat => (
                  <li key={cat.id}>
                    <Link href={`/${cat.slug}`} className="text-sm text-white/50 hover:text-white transition-colors">
                      {cat.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Бидэнтэй холбогдох</h3>
              <div className="space-y-3">
                <a href="tel:+97672117211" className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors group">
                  <Phone className="h-4 w-4 flex-shrink-0 group-hover:text-[#C8FF00] transition-colors" />
                  +976 7211 7211
                </a>
                <a href="mailto:info@onlime.mn" className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors group">
                  <Mail className="h-4 w-4 flex-shrink-0 group-hover:text-[#C8FF00] transition-colors" />
                  info@onlime.mn
                </a>
                <a href="https://lime.mn" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors group">
                  <Globe className="h-4 w-4 flex-shrink-0 group-hover:text-[#C8FF00] transition-colors" />
                  lime.mn
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/8 mt-10 pt-6">
            <p className="text-xs text-white/30 text-center">© {new Date().getFullYear()} LIME Mongolia. Бүх эрх хуулиар хамгаалагдсан.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
