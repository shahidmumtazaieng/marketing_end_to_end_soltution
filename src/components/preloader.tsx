'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Briefcase } from 'lucide-react';

export function Preloader() {
  const [isMounted, setIsMounted] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(() => {
        setIsPreloading(false);
      }, 2500); // Animation duration + delay
      return () => clearTimeout(timer);
    }
  }, [isMounted]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background transition-opacity duration-500',
        isPreloading ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <style jsx>{`
        .draw-animation {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 2s ease-out forwards 0.5s;
        }
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        .fade-in-animation {
          opacity: 0;
          animation: fadeIn 1s ease-in forwards 0.2s;
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
        .pulse-animation {
          animation: pulse 1.5s infinite ease-in-out;
          transform-origin: center;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.75;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      
      <div className="fade-in-animation flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 font-semibold font-headline text-2xl">
           <Briefcase className="h-8 w-8" style={{
                background: 'linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)))',
                color: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text'
             }}/>
            <span style={{
                background: 'linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)))',
                color: 'transparent',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text'
            }}>LeadFlow Central</span>
        </div>
        <svg width="150" height="100" viewBox="0 0 150 100" className="overflow-visible">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
          <path
            className="draw-animation"
            d="M 10 90 Q 40 80, 60 50 T 100 40 T 140 10"
            stroke="url(#line-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="140" cy="10" r="5" fill="hsl(var(--primary))" className="fade-in-animation pulse-animation" style={{animationDelay: '2s'}} />
        </svg>
      </div>
    </div>
  );
}
