
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateOrderStatusAction } from '@/app/(dashboard)/orders/actions';
import { Loader2, Wand2 } from 'lucide-react';
import { DropdownMenuItem } from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface OrderStatusUpdaterProps {
  orderId: string;
  currentStatus: string;
}

export default function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ updatedOrderStatus: string; extractedOrderDetails: string } | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!summary) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Conversation summary cannot be empty.',
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);
    try {
      const response = await updateOrderStatusAction({
        conversationSummary: summary,
        currentOrderStatus: currentStatus,
      });

      if (response.success && response.data) {
        toast({
          title: 'Analysis Complete',
          description: response.message,
        });
        setResult(response.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.message,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Wand2 className="mr-2 h-4 w-4" />
          Update Status with AI
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Order Status with AI</DialogTitle>
          <DialogDescription>
            Enter the conversation summary to let AI analyze and update the order status.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="orderId" className="text-right">
              Order ID
            </Label>
            <Input id="orderId" value={orderId} disabled className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="summary" className="text-right">
              Summary
            </Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Paste conversation summary here..."
              className="col-span-3"
            />
          </div>
        </div>

        {result && (
            <div className='p-4 bg-muted rounded-lg space-y-4'>
                <h4 className='font-semibold'>AI Analysis Result</h4>
                <div>
                    <p className='text-sm text-muted-foreground'>Suggested Status</p>
                    <Badge>{result.updatedOrderStatus}</Badge>
                </div>
                <div>
                    <p className='text-sm text-muted-foreground'>Extracted Details</p>
                    <p>{result.extractedOrderDetails || 'None'}</p>
                </div>
            </div>
        )}

        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? 'Analyzing...' : 'Analyze'}
          </Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
