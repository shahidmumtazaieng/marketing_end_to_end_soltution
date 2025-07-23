
'use client'
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Hourglass, DollarSign } from 'lucide-react';
import { Vendor } from '@/app/(dashboard)/vendors/page';

// Mock data - in a real app, this would be fetched from your database
const allVendors: Vendor[] = [
  {
    id: 'VEND001',
    name: 'John Doe',
    contact: 'john.d@example.com',
    status: 'Verified',
    avatar: 'https://placehold.co/100x100.png',
    memberSince: '2023-01-15',
    orders: { total: 120, completed: 115, pending: 2, canceled: 3 },
    services: ['AC Repair', 'Plumbing'],
    location: { latitude: 40.7128, longitude: -74.0060 },
    activeOrders: 1,
  },
  {
    id: 'VEND002',
    name: 'Jane Smith',
    contact: 'jane.s@example.com',
    status: 'Pending',
    avatar: 'https://placehold.co/100x100.png',
    memberSince: '2024-06-20',
    orders: { total: 50, completed: 45, pending: 5, canceled: 0 },
    services: ['Electrician Services'],
    location: { latitude: 34.0522, longitude: -118.2437 },
    activeOrders: 3,
  },
   {
    id: 'VEND003',
    name: 'CleanCo',
    contact: 'contact@cleanco.com',
    status: 'Verified',
    avatar: 'https://placehold.co/100x100.png',
    memberSince: '2022-08-10',
    orders: { total: 250, completed: 240, pending: 1, canceled: 9 },
    services: ['Home Cleaning'],
    location: { latitude: 41.8781, longitude: -87.6298 }, // Chicago
    activeOrders: 0,
  },
  {
    id: 'VEND004',
    name: 'Mike Rowe',
    contact: 'mike.r@example.com',
    status: 'Blocked',
    avatar: 'https://placehold.co/100x100.png',
    memberSince: '2023-11-05',
    orders: { total: 30, completed: 20, pending: 0, canceled: 10 },
    services: ['Plumbing', 'Handyman'],
    location: { latitude: 29.7604, longitude: -95.3698 }, // Houston
    activeOrders: 0,
  },
   {
    id: 'VEND005',
    name: 'Alpha Services',
    contact: 'support@alphaservices.com',
    status: 'Verified',
    avatar: 'https://placehold.co/100x100.png',
    memberSince: '2021-03-12',
    orders: { total: 500, completed: 490, pending: 5, canceled: 5 },
    services: ['Pest Control', 'Landscaping', 'AC Repair'],
    location: { latitude: 40.7500, longitude: -73.9900 }, // Near NYC
    activeOrders: 2,
  },
  {
    id: 'VEND006',
    name: 'Beta Repairs',
    contact: 'help@betarepairs.net',
    status: 'Pending',
    avatar: 'https://placehold.co/100x100.png',
    memberSince: '2024-07-01',
    orders: { total: 10, completed: 2, pending: 8, canceled: 0 },
    services: ['Appliance Repair', 'Electrician Services'],
    location: { latitude: 34.0122, longitude: -118.2937 }, // Near LA
    activeOrders: 5,
  },
];


const allOrders = [
    { id: 'ORD001', vendorId: 'VEND001', amount: 150.00, status: 'Completed', date: '2024-07-25' },
    { id: 'ORD006', vendorId: 'VEND001', amount: 1200.00, status: 'Completed', date: '2024-07-28' },
    // Add more mock orders for other vendors to make the modal dynamic
    { id: 'ORD002', vendorId: 'VEND002', amount: 275.50, status: 'Pending', date: '2024-07-26' },
    { id: 'ORD007', vendorId: 'VEND002', amount: 95.00, status: 'Pending', date: '2024-07-28' },
    { id: 'ORD012', vendorId: 'VEND002', amount: 300.00, status: 'Completed', date: '2024-07-30' },
    { id: 'ORD003', vendorId: 'VEND003', amount: 300.00, status: 'Completed', date: '2024-07-26' },
];

const PIE_CHART_COLORS = {
    Completed: 'hsl(var(--primary))',
    Pending: 'hsl(var(--accent))',
    Canceled: 'hsl(var(--destructive))'
};

interface VendorOrderHistoryModalProps {
  vendorId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorOrderHistoryModal({ vendorId, isOpen, onOpenChange }: VendorOrderHistoryModalProps) {
  const [vendorData, setVendorData] = useState<any>(null);

  useEffect(() => {
    if (vendorId) {
      const vendor = allVendors.find(v => v.id === vendorId);
      if (vendor) {
        const ordersForVendor = allOrders.filter(o => o.vendorId === vendorId);
        const totalWorth = ordersForVendor
          .filter(o => o.status === 'Completed')
          .reduce((sum, order) => sum + order.amount, 0);

        const chartData = [
            { name: 'Completed', value: vendor.orders.completed, fill: PIE_CHART_COLORS.Completed },
            { name: 'Pending', value: vendor.orders.pending, fill: PIE_CHART_COLORS.Pending },
            { name: 'Canceled', value: vendor.orders.canceled, fill: PIE_CHART_COLORS.Canceled },
        ].filter(item => item.value > 0);

        setVendorData({
          ...vendor,
          stats: {
            ...vendor.orders,
            totalWorth: totalWorth,
          },
          chartData
        });
      }
    } else {
      setVendorData(null);
    }
  }, [vendorId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        {vendorData ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Vendor History: {vendorData.name}</DialogTitle>
              <DialogDescription>
                Complete performance and order history for {vendorData.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-5 gap-6 py-4 max-h-[80vh] overflow-y-auto">
              <div className="md:col-span-2 space-y-6">
                 <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={vendorData.avatar} alt={vendorData.name} data-ai-hint="person avatar" />
                        <AvatarFallback>{vendorData.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-lg font-bold">{vendorData.name}</p>
                        <p className="text-sm text-muted-foreground">{vendorData.contact}</p>
                        <Badge variant={vendorData.status === 'Verified' ? 'default' : 'secondary'}>{vendorData.status}</Badge>
                    </div>
                </div>
                <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Lifetime Performance</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <StatCard icon={TrendingUp} title="Completed" value={vendorData.stats.completed} />
                        <StatCard icon={Hourglass} title="Pending" value={vendorData.stats.pending} />
                        <StatCard icon={TrendingDown} title="Canceled" value={vendorData.stats.canceled} />
                        <StatCard icon={DollarSign} title="Total Worth" value={`$${vendorData.stats.totalWorth.toFixed(2)}`} />
                    </div>
                </div>
              </div>
              <div className="md:col-span-3">
                <h4 className="font-semibold text-lg mb-4 text-center">Order Status Distribution</h4>
                <div className="w-full h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                             <Tooltip
                                cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                }}
                             />
                             <Legend
                                verticalAlign="bottom"
                                wrapperStyle={{ paddingBottom: '1.5rem', outline: 'none' }}
                                iconType="circle"
                             />
                            <Pie
                                data={vendorData.chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={120}
                                dataKey="value"
                            >
                                {vendorData.chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div>Loading vendor data...</div>
        )}
      </DialogContent>
    </Dialog>
  );
}


function StatCard({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) {
    return (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <Icon className="h-6 w-6 text-accent" />
            <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-xl font-bold">{value}</p>
            </div>
        </div>
    )
}
