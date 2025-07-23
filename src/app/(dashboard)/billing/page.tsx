import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';

export default function BillingPage() {
  const features = [
    'Vendor Management',
    'Order Management',
    'AI Calling Agent',
    'Data Scraper',
    'Analytics Dashboard',
    'API & Webhook Access',
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Billing &amp; Subscription</h1>
        <p className="text-muted-foreground">Manage your plan and payment details.</p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="font-headline">Current Plan</CardTitle>
          <CardDescription>You are currently on the Pro Plan.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Plan Details</h3>
            <p className="mb-2 text-muted-foreground">Your 7-day free trial is active.</p>
            <div className="space-y-2 mb-6">
              <Progress value={40} className="w-full" />
              <p className="text-sm text-muted-foreground">4 days left in your trial</p>
            </div>
            <p className="text-4xl font-bold">$15<span className="text-lg font-normal text-muted-foreground">/month</span></p>
            <p className="text-muted-foreground">Your trial will end on July 30, 2024. After that, you'll be charged monthly.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Features included:</h3>
            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
          <p className="text-sm text-muted-foreground">
            For more details, see our <a href="#" className="underline text-primary">pricing page</a>.
          </p>
          <div className="flex gap-2">
            <Button variant="outline">Cancel Subscription</Button>
            <Button>Manage Subscription</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
