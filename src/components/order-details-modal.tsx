
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, HardHat, DollarSign, Phone, MapPin, ImageIcon, MessageSquare, UserX } from 'lucide-react';
import { OrderTimeline } from '@/components/order-timeline';
import Image from 'next/image';
import type { Order } from '@/app/(dashboard)/orders/page';


interface OrderDetailsModalProps {
  orders: Order[];
  orderId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsModal({ orders, orderId, onOpenChange }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orderId) {
      const foundOrder = orders.find(o => o.id === orderId);
      setOrder(foundOrder || null);
    } else {
      setOrder(null);
    }
  }, [orderId, orders]);

  if (!order) {
    return null;
  }
  
  const canShowBefore = ['On the Way', 'Processing', 'Completed'].includes(order.status);
  const canShowAfter = order.status === 'Completed';

  return (
    <Dialog open={!!orderId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
             Order Details - <span className="text-accent">{order.id}</span>
          </DialogTitle>
          <DialogDescription>
            Complete tracking information for order {order.id}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-3 gap-8 py-4 max-h-[80vh] overflow-y-auto">
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Before & After Work</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <ImageSection title="Before Work" imageUrls={order.images.before} isDisabled={!canShowBefore} />
                        <ImageSection title="After Work" imageUrls={order.images.after} isDisabled={!canShowAfter} />
                    </CardContent>
                </Card>
                    <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Conversation Log
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {order.conversation.length > 0 ? (
                            <div className="space-y-4">
                                {order.conversation.map((msg: any, index: number) => (
                                    <div key={index} className={`flex ${msg.speaker === 'Agent' || msg.speaker === 'Admin' || msg.speaker === 'Summary' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`p-3 rounded-lg max-w-xs ${msg.speaker === 'Agent' || msg.speaker === 'Admin' || msg.speaker === 'Summary' ? 'bg-secondary' : 'bg-primary text-primary-foreground'}`}>
                                            <p className="font-bold text-sm">{msg.speaker}</p>
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No conversation summary available for this order.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-1 space-y-8">
                <OrderTimeline currentStatus={order.status} />
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"> <User className="h-5 w-5" /> Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <InfoRow icon={User} text={order.customer.name} />
                        <InfoRow icon={Phone} text={order.customer.phone} />
                        <InfoRow icon={MapPin} text={order.customer.address} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><HardHat className="h-5 w-5" /> Vendor Details</CardTitle>
                    </CardHeader>
                     <CardContent className="flex items-center gap-4">
                        {order.vendor ? (
                            <>
                                <Avatar className="h-12 w-12">
                                <AvatarImage src={order.vendor.avatar} alt={order.vendor.name} data-ai-hint="person avatar" />
                                <AvatarFallback>{order.vendor.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-semibold">{order.vendor.name}</p>
                            </>
                        ) : (
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <UserX className="h-5 w-5" />
                                <span>Unassigned</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Financials</CardTitle>
                    </CardHeader>
                    <CardContent>
                            <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Amount</span>
                            <span className="font-bold text-lg">${order.amount.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


interface ImageSectionProps {
    title: string;
    imageUrls: string[];
    isDisabled: boolean;
}

function ImageSection({ title, imageUrls, isDisabled }: ImageSectionProps) {
    const hasImages = imageUrls && imageUrls.length > 0;

    return (
        <div className="space-y-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <div className={`aspect-video rounded-lg border-2 border-dashed flex items-center justify-center relative overflow-hidden ${isDisabled ? 'bg-muted/50 border-muted-foreground/50' : 'border-primary'}`}>
                {isDisabled ? (
                        <p className="text-muted-foreground text-center p-4">
                        Image not available for current order status.
                    </p>
                ) : (
                    hasImages ? (
                        <Carousel className="w-full h-full">
                            <CarouselContent>
                                {imageUrls.map((url, index) => (
                                    <CarouselItem key={index} className="w-full h-full">
                                            <Image src={url} alt={`${title} image ${index + 1}`} fill style={{ objectFit: 'cover' }} data-ai-hint="work site" />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                                {imageUrls.length > 1 && (
                                <>
                                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                                </>
                            )}
                        </Carousel>
                    ) : (
                        <div className="text-center text-muted-foreground p-4">
                            <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                            <p>No images uploaded yet.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

function InfoRow({ icon: Icon, text }: { icon: React.ElementType, text: string }) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{text}</span>
        </div>
    )
}
