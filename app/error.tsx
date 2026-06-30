'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error) {
      console.error('Application error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Алдаа гарлаа
        </h1>
        <p className="text-gray-600 mb-6">
          Уучлаарай, системд алдаа гарсан байна. Дахин оролдоно уу.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6">
            Алдааны код: {error.digest}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#034a35] transition-colors"
          >
            Дахин оролдох
          </button>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Нүүр хуудас
          </Link>
        </div>
      </div>
    </div>
  );
}
