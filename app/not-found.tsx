import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f4f4f5] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Хуудас олдсонгүй
        </h2>
        <p className="text-gray-600 mb-6">
          Уучлаарай, таны хайж буй хуудас олдсонгүй байна.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#02251A] text-white rounded-lg hover:bg-[#034a35] transition-colors"
        >
          Нүүр хуудас руу буцах
        </Link>
      </div>
    </div>
  );
}
