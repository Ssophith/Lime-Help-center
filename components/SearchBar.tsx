'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronRight, Loader2 } from 'lucide-react';
import type { Article } from '@/types';

interface SearchBarProps {
  hero?: boolean; // true = large hero mode with lime button
}

export default function SearchBar({ hero = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<Article & { categorySlug: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (query.trim().length >= 2) {
      setLoading(true);
      debounceTimer.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
          if (!response.ok) { setResults([]); setShowDropdown(false); setLoading(false); return; }
          const data = await response.json();
          const searchResults = Array.isArray(data.results) ? data.results : [];
          setResults(searchResults);
          setShowDropdown(true);
          setSelectedIndex(-1);
        } catch {
          setResults([]); setShowDropdown(false);
        } finally { setLoading(false); }
      }, 300);
    } else { setResults([]); setShowDropdown(false); setLoading(false); }
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === 'Enter' && query.trim()) handleSubmit(e as any);
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : prev); break;
      case 'ArrowUp': e.preventDefault(); setSelectedIndex(prev => prev > 0 ? prev - 1 : -1); break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          router.push(`/${results[selectedIndex].categorySlug}/${results[selectedIndex].slug}`);
          setShowDropdown(false); setQuery('');
        } else if (query.trim()) handleSubmit(e as any);
        break;
      case 'Escape': setShowDropdown(false); inputRef.current?.blur(); break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) { router.push(`/search?q=${encodeURIComponent(query)}`); setShowDropdown(false); }
  };

  const stripHtml = (html: string) => html ? html.replace(/<[^>]*>/g, '').substring(0, 120) : '';

  return (
    <div ref={searchRef} className="w-full max-w-2xl mx-auto relative">
      <form onSubmit={handleSubmit}>
        {hero ? (
          /* ── Hero search style ───────────── */
          <div className="lime-search-wrapper">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {loading
                ? <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                : <Search className="h-5 w-5 text-gray-400" />}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
              placeholder="Mэдээлэл хайх..."
              className="lime-search-input"
            />
            <button type="submit" className="lime-search-btn">Хайх</button>
          </div>
        ) : (
          /* ── Inline search style ─────────── */
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {loading ? <Loader2 className="h-5 w-5 text-gray-400 animate-spin" /> : <Search className="h-5 w-5 text-gray-400" />}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
              placeholder="Хайх..."
              className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 text-gray-900 focus:outline-none focus:border-[#02251A] focus:ring-2 focus:ring-[#02251A]/10 shadow-sm text-sm"
            />
          </div>
        )}
      </form>

      {/* Dropdown */}
      {showDropdown && query.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1.5" />Хайж байна...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.slice(0, 8).map((article, index) => (
                <button
                  key={article.id}
                  onClick={() => { router.push(`/${article.categorySlug}/${article.slug}`); setShowDropdown(false); setQuery(''); }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${index === selectedIndex ? 'bg-[#02251A]/5 border-l-4 border-[#C8FF00]' : 'border-l-4 border-transparent'}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm mb-0.5 line-clamp-1">{article.title}</h3>
                      {(article.excerpt || article.content) && (
                        <p className="text-xs text-gray-500 line-clamp-1">{stripHtml(article.excerpt || article.content)}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
              {results.length > 8 && (
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="block px-4 py-3 text-center text-xs font-semibold text-[#02251A] hover:bg-gray-50 border-t border-gray-100"
                  onClick={() => setShowDropdown(false)}
                >
                  Бүх үр дүн ({results.length}) харах →
                </Link>
              )}
            </div>
          ) : (
            <div className="p-5 text-center text-sm text-gray-400">Илэрц олдсонгүй</div>
          )}
        </div>
      )}
    </div>
  );
}
