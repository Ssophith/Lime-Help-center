'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ArticleFeedbackProps {
  articleId: string;
}

export default function ArticleFeedback({ articleId }: ArticleFeedbackProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (type: 'helpful' | 'not-helpful') => {
    if (submitted) return;
    
    setFeedback(type);
    setSubmitted(true);
    
    // In a real app, you'd send this to an API endpoint
    try {
      await fetch(`/api/articles/${articleId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div>
      <p className="text-gray-700 mb-4">Та хүссэн мэдээллээ авч чадсан уу?</p>
      <div className="flex gap-4">
        <button
          onClick={() => handleFeedback('helpful')}
          disabled={submitted}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            feedback === 'helpful'
              ? 'bg-green-50 border-green-500 text-green-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          } ${submitted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <ThumbsUp className="h-5 w-5" />
          <span>Тийм</span>
        </button>
        <button
          onClick={() => handleFeedback('not-helpful')}
          disabled={submitted}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            feedback === 'not-helpful'
              ? 'bg-red-50 border-red-500 text-red-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          } ${submitted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          <ThumbsDown className="h-5 w-5" />
          <span>Үгүй</span>
        </button>
      </div>
      {submitted && (
        <p className="mt-4 text-sm text-gray-600">Баярлалаа! Таны санал бодол бидэнд чухал.</p>
      )}
    </div>
  );
}
