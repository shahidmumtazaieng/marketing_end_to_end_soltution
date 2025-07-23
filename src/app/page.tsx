
'use client';

import { Button } from '@/components/ui/button';
import { AnimatedGraph } from '@/components/animated-graph';
import { Bot, BarChart, TrendingUp, Users, PhoneForwarded, CheckCircle, Search, FileText, Star, BriefcaseBusiness, Zap, Building } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { cn } from '@/lib/utils';


const painPoints = [
    {
        title: "Struggling to Find Quality Leads?",
        description: "Our powerful data scraping tool pulls targeted leads from Google Maps or SerpAPI, giving you a steady stream of potential customers in your city or town.",
        solution: "Scrape local businesses like AC repair or cleaning services with a few clicks and export to CSV/Excel for easy outreach.",
        icon: Search,
        image: "https://ingenuitymarketing.com/wp-content/uploads/2020/10/ingWEB201022AttractingClients.jpg",
        imageHint: "map search",
    },
    {
        title: "Tired of Manual Customer Calls?",
        description: "Cold calling takes hours and feels repetitive. Let our AI calling agent handle it with your voice or professional pre-built voices.",
        solution: "Automate calls with a cloned voice or select from male/female options, supporting multiple languages for personalized outreach.",
        icon: PhoneForwarded,
        image: "https://assets.mailshake.com/wp-content/uploads/2021/12/10084201/1489380_Blog-Image_9_110922.jpg",
        imageHint: "call center",
    },
    {
        title: "Vendor Management Chaos?",
        description: "Coordinating vendors and tracking orders is a headache. Our platform streamlines assignments and updates in real time.",
        solution: "Assign orders to vendors based on location, expertise, or workload, with a mobile app for seamless updates.",
        icon: Users,
        image: "https://www.leadsquared.com/wp-content/uploads/2023/11/A-guide-to-effective-vendor-management.png",
        imageHint: "team collaboration",
    },
    {
        title: "Professional Invoices a Hassle?",
        description: "Creating branded invoices and collecting payments shouldn’t be complex. Our system makes it quick and professional.",
        solution: "Generate invoices with your logo, before/after images, and payment QR codes, shareable via WhatsApp or email.",
        icon: FileText,
        image: "https://cdn.dribbble.com/userupload/12066392/file/original-6fb7ee6be315488265e2d7349dfc2465.jpg?resize=752x&vertical=center",
        imageHint: "invoice document",
    },
];

const features = [
  {
    icon: TrendingUp,
    title: 'Targeted Lead Generation',
    description: 'Find local businesses like AC repair or cleaning services in any city or town. Export leads to CSV/Excel for easy follow-up.',
  },
  {
    icon: Bot,
    title: 'AI-Powered Calling Agent',
    description: 'Automate cold calls with your cloned voice or professional voices, with multilingual support and conversation analysis.',
  },
  {
    icon: Users,
    title: 'Vendor Management App',
    description: 'Empower vendors with a mobile app to accept orders, upload images, and update statuses in real time.',
  },
  {
    icon: FileText,
    title: 'Custom Billing',
    description: 'Create professional invoices with your branding, including images and payment QR codes, shareable instantly.',
  },
  {
    icon: BarChart,
    title: 'Analytics Dashboard',
    description: 'Monitor call performance, order progress, and revenue with insightful, exportable reports.',
  },
  {
    icon: CheckCircle,
    title: 'Seamless Integration',
    description: 'Connect with your favorite tools like Google Sheets, Twilio, and more for a streamlined workflow.',
  }
];

const testimonials = [
    {
        quote: "This platform transformed our AC repair business! Lead generation is a breeze, and the AI calling agent feels like me talking to customers.",
        name: "Sarah",
        business: "CoolTech Repairs",
        avatar: "https://placehold.co/100x100.png",
        avatarHint: "woman portrait"
    },
    {
        quote: "The vendor app keeps everything organized, and branded invoices make us look professional. Highly recommend!",
        name: "Mike",
        business: "CleanSweep Services",
        avatar: "https://placehold.co/100x100.png",
        avatarHint: "man portrait"
    },
    {
        quote: "The analytics dashboard showed us where to focus our efforts. We doubled our bookings in a month!",
        name: "Priya",
        business: "HomeFix Electricians",
        avatar: "https://placehold.co/100x100.png",
        avatarHint: "woman portrait professional"
    }
]

const pricingPlans = [
  {
    title: 'Starter Trial',
    price: '$0',
    period: 'for 7 days',
    icon: BriefcaseBusiness,
    features: [
      'Data Scraper (100 leads)',
      'AI Calling Agent (20 calls)',
      'Vendor Management (3 vendors)',
      'Basic Analytics',
      'Email Support'
    ],
    cta: 'Start Free Trial',
    variant: 'outline'
  },
  {
    title: 'Pro',
    price: '$15',
    period: 'per month',
    icon: Zap,
    features: [
      'Unlimited Data Scraping',
      'AI Calling Agent (500 calls/mo)',
      'Unlimited Vendor Management',
      'Advanced Analytics & Reports',
      'Voice Cloning Feature',
      'Priority Support'
    ],
    cta: 'Get Started',
    variant: 'default',
    featured: true
  },
  {
    title: 'Enterprise',
    price: 'Custom',
    period: 'for large teams',
    icon: Building,
    features: [
      'Everything in Pro, plus:',
      'Unlimited AI Calls',
      'Dedicated Account Manager',
      'API & Webhook Access',
      'Custom Integrations',
      'Onboarding & Training'
    ],
    cta: 'Contact Sales',
    variant: 'outline'
  }
]

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 sm:py-32">
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="text-center md:text-left">
                    <h1 
                        className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline tracking-tight animated-gradient-text"
                    >
                        The End-to-End Solution through AI Agents
                    </h1>
                    <p className="mt-6 text-lg text-muted-foreground">
                        Effortlessly find leads, automate customer calls, manage vendors, and generate professional bills—all in one platform.
                    </p>
                    <div className="mt-10 flex justify-center md:justify-start gap-4">
                        <Button asChild size="lg">
                            <Link href="/signup">Start Free Trial</Link>
                        </Button>
                    </div>
                </div>
                <div className="w-full h-80 rounded-lg border bg-card/50 shadow-2xl shadow-primary/10 p-4">
                    <AnimatedGraph />
                </div>
            </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 bg-secondary/30">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <h3 className="text-4xl font-bold text-primary">10x</h3>
                        <p className="text-muted-foreground">Lead Generation Speed</p>
                    </div>
                    <div>
                        <h3 className="text-4xl font-bold text-primary">80%</h3>
                        <p className="text-muted-foreground">Reduction in Manual Calls</p>
                    </div>
                    <div>
                        <h3 className="text-4xl font-bold text-primary">95%</h3>
                        <p className="text-muted-foreground">Vendor Task Acceptance</p>
                    </div>
                     <div>
                        <h3 className="text-4xl font-bold text-primary">2x</h3>
                        <p className="text-muted-foreground">Faster Invoicing</p>
                    </div>
                </div>
            </div>
        </section>

        {/* About Section */}
        <section id="about" className="container mx-auto px-4 py-24">
             <div className="grid md:grid-cols-2 gap-12 items-center">
                 <div className="w-full h-80 rounded-lg border bg-card/50 shadow-2xl shadow-accent/10 p-4">
                    <AnimatedGraph />
                </div>
                <div className="space-y-4">
                    <h2 className="text-3xl sm:text-4xl font-bold font-headline">About LeadFlow Central</h2>
                    <p className="text-lg text-muted-foreground">
                        LeadFlow Central was born from a simple idea: local service businesses deserve the same powerful automation tools as large corporations. We are a team of engineers and business strategists dedicated to creating an all-in-one platform that handles your most repetitive tasks, so you can focus on what you do best—delivering excellent service.
                    </p>
                     <p className="text-lg text-muted-foreground">
                        Our mission is to empower you to scale your operations, increase efficiency, and boost your revenue without the complexity and high cost of traditional enterprise software.
                    </p>
                </div>
            </div>
        </section>


        {/* Pain Points and Solutions Section */}
        <section className="py-24 bg-secondary/30">
            <div className="container mx-auto px-4 space-y-24">
                <div className="text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold font-headline">Solve Your Biggest Challenges with Ease</h2>
                </div>
                {painPoints.map((item, index) => (
                    <div key={index} className="grid md:grid-cols-2 gap-12 items-center">
                        <div className={index % 2 === 0 ? 'md:order-last' : ''}>
                           <Image src={item.image} alt={item.title} width={600} height={400} className="rounded-lg shadow-xl" data-ai-hint={item.imageHint} />
                        </div>
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-3">
                                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-r from-primary to-accent">
                                    <item.icon className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <h3 className="text-2xl font-bold font-headline">{item.title}</h3>
                            </div>
                            <p className="text-lg text-muted-foreground">{item.description}</p>
                            <p className="text-lg font-semibold">{item.solution}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Key Features Section */}
        <section id="features" className="container mx-auto px-4 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold font-headline">Everything You Need to Succeed</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
                <div key={index} className="p-6 bg-card rounded-lg border shadow-md hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-r from-primary to-accent mb-4">
                        <feature.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-bold font-headline mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                </div>
            ))}
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="py-24 bg-secondary/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold font-headline">Trusted by Local Businesses</h2>
                </div>
                 <Carousel className="w-full max-w-4xl mx-auto">
                    <CarouselContent>
                        {testimonials.map((testimonial, index) => (
                            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                <div className="p-1 h-full">
                                <Card className="flex flex-col justify-between h-full">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar>
                                                <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.avatarHint}/>
                                                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{testimonial.name}</p>
                                                <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                                        <div className="flex text-yellow-400">
                                            <Star className="h-5 w-5 fill-current" />
                                            <Star className="h-5 w-5 fill-current" />
                                            <Star className="h-5 w-5 fill-current" />
                                            <Star className="h-5 w-5 fill-current" />
                                            <Star className="h-5 w-5 fill-current" />
                                        </div>
                                    </CardContent>
                                </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-4 py-24">
             <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold font-headline">Affordable Plans for Every Business</h2>
                <p className="mt-4 text-muted-foreground">
                    Start with a free plan or upgrade for advanced features like higher call quotas and premium support.
                </p>
            </div>
             <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {pricingPlans.map((plan) => (
                  <Card key={plan.title} className={cn("flex flex-col", plan.featured && "border-primary shadow-lg shadow-primary/20")}>
                    <CardHeader className="items-center">
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-primary to-accent mb-4">
                          <plan.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <CardTitle className="font-headline text-2xl">{plan.title}</CardTitle>
                      <p className="text-4xl font-bold">{plan.price}</p>
                      <p className="text-muted-foreground">{plan.period}</p>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-accent" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full" variant={plan.variant as any}>
                        <Link href="/signup">{plan.cta}</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
        </section>

         {/* Final CTA */}
        <section className="bg-secondary/30">
            <div className="container mx-auto px-4 py-24 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold font-headline mb-4">Ready to Transform Your Business?</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                    Join thousands of local service providers automating their workflows and growing revenue. Sign up today and see the difference in just a few clicks.
                </p>
                <Button asChild size="lg">
                    <Link href="/signup">Get Started for Free</Link>
                </Button>
            </div>
        </section>
      </main>
    </div>
  );
}
