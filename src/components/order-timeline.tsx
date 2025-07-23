
'use client';

import { CheckCircle, Circle, HardHat, Hourglass, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

type OrderStatus = 'Pending' | 'Accepted' | 'On the Way' | 'Processing' | 'Completed' | 'Canceled';

const timelineSteps: { status: OrderStatus; icon: React.ElementType; label: string }[] = [
  { status: 'Pending', icon: Hourglass, label: 'Order Pending' },
  { status: 'Accepted', icon: CheckCircle, label: 'Order Accepted' },
  { status: 'On the Way', icon: Truck, label: 'Vendor On The Way' },
  { status: 'Processing', icon: HardHat, label: 'Work In Progress' },
  { status: 'Completed', icon: CheckCircle, label: 'Order Completed' },
];

interface OrderTimelineProps {
  currentStatus: OrderStatus;
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const currentIndex = timelineSteps.findIndex(step => step.status === currentStatus);

  if (currentStatus === 'Canceled') {
    return (
        <div className="p-4 bg-destructive/20 border border-destructive rounded-lg">
            <h4 className="font-bold text-destructive">Order Canceled</h4>
            <p className="text-sm text-destructive/80">This order has been canceled.</p>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      {timelineSteps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;

        return (
          <div key={step.status} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
                  isCompleted ? 'bg-primary text-primary-foreground' : '',
                  isCurrent ? 'bg-accent text-accent-foreground animate-pulse' : '',
                  isFuture ? 'bg-secondary text-secondary-foreground' : ''
                )}
              >
                <step.icon className="h-5 w-5" />
              </div>
              {index < timelineSteps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8 mt-1 transition-colors',
                    isCompleted || isCurrent ? 'bg-primary' : 'bg-secondary'
                  )}
                />
              )}
            </div>
            <div>
              <p
                className={cn(
                  'font-semibold transition-colors',
                  isFuture ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {isCurrent && 'Current status'}
                {isCompleted && 'Completed'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
