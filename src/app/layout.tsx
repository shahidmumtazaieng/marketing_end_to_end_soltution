
'use client';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Briefcase } from 'lucide-react';
import { Preloader } from '@/components/preloader';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", inter.variable, spaceGrotesk.variable)}>
        <Preloader />
        <div className="min-h-screen w-full flex flex-col bg-background">
            <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2 font-semibold font-headline">
                        <Briefcase className="h-6 w-6 animated-gradient-text" />
                        <span className="animated-gradient-text">LeadFlow Central</span>
                    </Link>
                    <nav className="hidden md:flex gap-6 text-sm font-medium">
                        <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</Link>
                        <Link href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</Link>
                        <Link href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
                    </nav>
                    <div className="flex items-center gap-2">
                         <Button variant="outline" asChild>
                            <Link href="/auth">Login</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/signup">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                {children}
            </main>
             <footer className="border-t border-border/50">
                <div className="container mx-auto py-6 px-4 text-center text-muted-foreground text-sm">
                    <p>&copy; {new Date().getFullYear()} LeadFlow Central. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
