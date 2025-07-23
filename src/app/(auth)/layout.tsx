
'use client';
import React from 'react';
import '../globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", inter.variable, spaceGrotesk.variable)}>
        <div className="min-h-screen w-full flex flex-col bg-background">
            <main className="flex-1 flex items-center justify-center p-4">
                {children}
            </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
