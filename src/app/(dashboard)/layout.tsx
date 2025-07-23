
'use client';
import React from 'react';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { UserNav } from '@/components/user-nav';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
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


// Using a client component to manage theme on initial load
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.className = savedTheme;
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("antialiased", inter.variable, spaceGrotesk.variable)}>
          <div className="min-h-screen w-full flex bg-background">
            <DashboardSidebar className="hidden lg:block" />
            <div className="flex flex-col flex-1 w-full">
              <header className="sticky top-0 h-16 flex items-center gap-4 border-b bg-background/80 backdrop-blur-sm border-border/50 px-4 md:px-6 z-50">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 lg:hidden"
                    >
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 bg-background/95">
                    <DashboardSidebar />
                  </SheetContent>
                </Sheet>
                <div className="w-full flex-1">
                  {/* Header content like search can go here */}
                </div>
                <UserNav />
              </header>
              <main className="flex-1 p-4 md:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
        <Toaster />
      </body>
    </html>
  );
}
