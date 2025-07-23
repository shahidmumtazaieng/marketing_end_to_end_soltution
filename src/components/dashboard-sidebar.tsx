
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Search,
  Bot,
  Settings,
  DollarSign,
  Briefcase,
  FileCog,
  Contact,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

const callingAgentItems = [
    { href: '/calling-agent/configure', label: 'Configure Agent' },
    { href: '/calling-agent/number-management', label: 'Number Management' },
    { href: '/calling-agent/analytics', label: 'Analytics' },
    { href: '/calling-agent/operations', label: 'Operations' },
]

const primaryNavItems = [
    { href: '/scraper', label: 'Data Scraper', icon: Search },
    { href: '/orders', label: 'Order Management', icon: CreditCard },
    { href: '/vendors', label: 'Vendor Management', icon: Users },
]

const settingsItems = [
    { href: '/settings', label: 'General Settings', icon: Settings },
    { href: '/invoice-settings', label: 'Invoice Settings', icon: FileCog },
    { href: '/billing', label: 'Billing', icon: DollarSign },
]

export function DashboardSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    // For sub-pages, we want the main category to be active
    if (href.split('/').length > 2) {
        const base_path = '/' + pathname.split('/')[1];
        return base_path === href;
    }
    return pathname === href;
  }

  return (
    <div className={cn('h-full border-r border-border/50', className)}>
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b border-border/50 px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold font-headline">
             <Briefcase className="h-6 w-6" style={{
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
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = isLinkActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    isActive && 'bg-muted text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
             {primaryNavItems.map(({ href, label, icon: Icon }) => {
              const isActive = isLinkActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    isActive && 'bg-muted text-primary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}

             <Accordion type="single" collapsible defaultValue={pathname.startsWith('/calling-agent') ? "item-1" : ""}>
                <AccordionItem value="item-1" className="border-none">
                    <AccordionTrigger className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:no-underline",
                        pathname.startsWith('/calling-agent') && 'bg-muted text-primary'
                    )}>
                        <div className="flex items-center gap-3">
                            <Bot className="h-4 w-4" />
                            AI Calling Agent
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                       {callingAgentItems.map(({ href, label }) => (
                         <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                                pathname === href && 'text-primary'
                            )}
                            >
                            {label}
                        </Link>
                       ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            
             <Accordion type="single" collapsible defaultValue={pathname.startsWith('/billing') || pathname.startsWith('/settings') || pathname.startsWith('/invoice') ? "item-1" : ""}>
                <AccordionItem value="item-1" className="border-none">
                     <AccordionTrigger className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:no-underline",
                        (pathname.startsWith('/billing') || pathname.startsWith('/settings') || pathname.startsWith('/invoice')) && 'bg-muted text-primary'
                    )}>
                         <div className="flex items-center gap-3">
                            <Settings className="h-4 w-4" />
                            Settings & Billing
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-4">
                        {settingsItems.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                                pathname === href && 'text-primary'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
          </nav>
        </div>
      </div>
    </div>
  );
}
