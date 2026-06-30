'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Ноцтой алдаа гарлаа
            </h1>
            <p className="text-gray-600 mb-6">
              Уучлаарай, системд ноцтой алдаа гарсан байна. Дахин оролдоно уу.
            </p>
            {error.digest && (
              <p className="text-xs text-gray-400 mb-6">
                Алдааны код: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 bg-[#02251A] text-white rounded-lg hover:bg-[#034a35] transition-colors"
            >
              Дахин оролдох
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
