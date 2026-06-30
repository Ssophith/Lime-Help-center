'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function PageLoader() {
  const [loading, setLoading] = useState(true);
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Load animation data
    fetch('/animations/lime_loader.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(() => setAnimationData(null));
  }, []);

  useEffect(() => {
    // Hide loader after page is fully loaded
    const handleLoad = () => {
      setTimeout(() => setLoading(false), 300);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  if (!loading || !animationData) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="w-32 h-32">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
        />
      </div>
    </div>
  );
}
