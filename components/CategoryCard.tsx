import Link from 'next/link';
import type { Category } from '@/types';
import { ChevronRight } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/${category.slug}`} className="lime-card group block">
      {/* Icon + Title row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {category.icon ? (
            <div className="lime-card-icon">
              <CategoryIcon
                iconName={category.icon}
                size={22}
                color="#FFFFFF"
              />
            </div>
          ) : (
            <div className="lime-card-icon">
              <span className="text-white font-bold text-sm">
                {category.title.charAt(0)}
              </span>
            </div>
          )}
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#02251A] leading-tight transition-colors">
            {category.title}
          </h3>
        </div>
        <span className="lime-badge">{category.articles.length}</span>
      </div>

      {/* Top articles */}
      {category.articles.length > 0 && (
        <div className="space-y-2 mb-4">
          {category.articles
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 3)
            .map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-700 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#02251A] flex-shrink-0 opacity-60" />
                <span className="line-clamp-1">{article.title}</span>
              </div>
            ))}
        </div>
      )}

      {/* View all link */}
      <div className="flex items-center gap-1 text-xs font-semibold text-[#02251A] mt-auto">
        <span>Бүгдийг харах</span>
        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Lime accent bottom border on hover */}
      <div className="lime-card-accent" />
    </Link>
  );
}
