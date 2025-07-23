'use client'
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Clock, CheckCircle, XCircle, Truck, Hourglass, Search, ChevronLeft, ChevronRight, HardHat, Image as ImageIcon, RefreshCw, Sheet as SheetIcon, Loader2, UserX, Wand2 } from 'lucide-react';
import OrderStatusUpdater from '@/components/order-status-updater';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange } from '@/components/date-range-picker';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { subDays, addDays } from 'date-fns';
import { OrderDetailsModal } from '@/components/order-details-modal';
import { syncOrdersAction, assignVendorToAction } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VendorOrderHistoryModal } from '@/components/vendor-order-history-modal';
import Link from 'next/link';


type OrderStatus = 'Pending' | 'Accepted' | 'On the Way' | 'Processing' | 'Completed' | 'Canceled';
export type Order = {
    id: string;
    task: string;
    vendorId: string | null;
    customer: { name: string, phone: string, address: string, location?: {latitude: number, longitude: number} };
    vendor: { name: string, avatar: string } | null;
    amount: number;
    status: OrderStatus;
    date: string;
    images: { before: string[], after: string[] };
    conversation: { speaker: string, text: string }[];
}

const initialOrders: Order[] = [
    { id: 'ORD001', task: 'AC Repair', vendorId: 'VEND001', customer: { name: 'Alice Johnson', phone: '111-222-3333', address: '123 Maple St, Springfield' }, vendor: { name: 'John Doe', avatar: 'https://placehold.co/100x100.png' }, amount: 150.00, status: 'Completed', date: '2024-07-25', images: { before: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'], after: ['https://placehold.co/600x400.png', 'https://placehold.co/600x400.png'] }, conversation: [{ speaker: 'Agent', text: 'Confirmed AC repair for tomorrow.' }, { speaker: 'Alice', text: 'Great, thank you!'}] },
    { id: 'ORD002', task: 'Electrician Service', vendorId: 'VEND002', customer: { name: 'Bob Williams', phone: '444-555-6666', address: '456 Oak Ave, Shelbyville' }, vendor: { name: 'Jane Smith', avatar: 'https://placehold.co/100x100.png' }, amount: 275.50, status: 'Pending', date: '2024-07-26', images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD003', task: 'Home Cleaning', vendorId: 'VEND003', customer: { name: 'Charlie Brown', phone: '777-888-9999', address: '789 Pine Rd, Capital City' }, vendor: { name: 'CleanCo', avatar: 'https://placehold.co/100x100.png' }, amount: 300.00, status: 'On the Way', date: '2024-07-26', images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD004', task: 'Plumbing Fix', vendorId: 'VEND004', customer: { name: 'Diana Prince', phone: '123-456-7890', address: '101 Justice Way, Themyscira' }, vendor: { name: 'Mike Rowe', avatar: 'https://placehold.co/100x100.png' }, amount: 85.25, status: 'Accepted', date: '2024-07-27', images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD005', task: 'Pest Control', vendorId: 'VEND005', customer: { name: 'Eve Adams', phone: '098-765-4321', address: '221B Baker St, London' }, vendor: { name: 'Alpha Services', avatar: 'https://placehold.co/100x100.png' }, amount: 210.00, status: 'Canceled', date: '2024-07-24', images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD006', task: 'Painting Job', vendorId: 'VEND001', customer: { name: 'Frank Miller', phone: '555-123-4567', address: '404 Gotham Lane, Gotham' }, vendor: { name: 'John Doe', avatar: 'https://placehold.co/100x100.png' }, amount: 1200.00, status: 'Completed', date: '2024-07-28', images: { before: ['https://placehold.co/600x400.png'], after: ['https://placehold.co/600x400.png'] }, conversation: [] },
    { id: 'ORD007', task: 'Gardening Service', vendorId: 'VEND002', customer: { name: 'Grace Lee', phone: '555-987-6543', address: '808 Aloha Rd, Honolulu' }, vendor: { name: 'Jane Smith', avatar: 'https://placehold.co/100x100.png' }, amount: 95.00, status: 'Pending', date: '2024-07-28', images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD008', task: 'Appliance Repair', vendorId: 'VEND004', customer: { name: 'Heidi Turner', phone: '555-456-1234', address: '123 South Park Ave, South Park' }, vendor: { name: 'Mike Rowe', avatar: 'https://placehold.co/100x100.png' }, amount: 130.00, status: 'Accepted', date: '2024-07-29', images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD009', task: 'Roofing Inspection', vendorId: 'VEND003', customer: { name: 'Ivan Rodriguez', phone: '555-789-4561', address: '1000 Ranger Way, Arlington' }, vendor: { name: 'CleanCo', avatar: 'https://placehold.co/100x100.png' }, amount: 450.00, status: 'On the Way', date: '2024-07-29', images: { before: ['https://placehold.co/600x400.png'], after: [] }, conversation: [] },
    { id: 'ORD010', task: 'Moving Service', vendorId: 'VEND006', customer: { name: 'Judy Alvarez', phone: '555-654-7890', address: 'Lizzie\'s Bar, Night City' }, vendor: { name: 'Beta Repairs', avatar: 'https://placehold.co/100x100.png' }, amount: 650.00, status: 'Canceled', date: '2024-07-27', images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD011', task: 'AC Repair', vendorId: 'VEND001', customer: { name: 'Ken Adams', phone: '111-333-4444', address: '742 Evergreen Terrace, Springfield' }, vendor: { name: 'John Doe', avatar: 'https://placehold.co/100x100.png' }, amount: 155.00, status: 'Completed', date: '2024-07-30', images: { before: ['https://placehold.co/600x400.png'], after: ['https://placehold.co/600x400.png'] }, conversation: [] },
    { id: 'ORD012', task: 'Electrician Service', vendorId: 'VEND002', customer: { name: 'Laura Croft', phone: '444-666-7777', address: 'Croft Manor, Surrey' }, vendor: { name: 'Jane Smith', avatar: 'https://placehold.co/100x100.png' }, amount: 300.00, status: 'Processing', date: '2024-07-30', images: { before: ['https://placehold.co/600x400.png'], after: [] }, conversation: [{speaker: 'Jane', text: 'I have arrived at the location and started the work.'}] },
    { id: 'ORD013', task: 'Home Cleaning', vendorId: 'VEND003', customer: { name: 'Morgan Blackhand', phone: '777-999-0000', address: 'Arasaka Tower, Night City' }, vendor: { name: 'CleanCo', avatar: 'https://placehold.co/100x100.png' }, amount: 320.00, status: 'On the Way', date: '2024-07-31', images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD014', task: 'Plumbing Fix', vendorId: 'VEND004', customer: { name: 'Nancy Drew', phone: '123-789-1234', address: '321 River Heights, River Heights' }, vendor: { name: 'Mike Rowe', avatar: 'https://placehold.co/100x100.png' }, amount: 95.50, status: 'Accepted', date: '2024-07-31', images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD015', task: 'Pest Control', vendorId: 'VEND005', customer: { name: 'Oscar Wilde', phone: '098-123-7654', address: '1 Tite Street, Chelsea' }, vendor: { name: 'Alpha Services', avatar: 'https://placehold.co/100x100.png' }, amount: 220.00, status: 'Canceled', date: '2024-07-29', images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD016', task: 'Landscaping', vendorId: 'VEND001', customer: { name: 'Peter Pan', phone: '222-333-5555', address: 'Neverland Ranch, Neverland' }, vendor: { name: 'John Doe', avatar: 'https://placehold.co/100x100.png' }, amount: 450.00, status: 'Processing', date: subDays(new Date(), 1).toISOString().split('T')[0], images: { before: ['https://placehold.co/600x400.png'], after: [] }, conversation: [] },
    { id: 'ORD017', task: 'Security System Install', vendorId: 'VEND002', customer: { name: 'Quinn Fabray', phone: '666-777-8888', address: '121 Spooner Street, Quahog' }, vendor: { name: 'Jane Smith', avatar: 'https://placehold.co/100x100.png' }, amount: 850.00, status: 'Pending', date: new Date().toISOString().split('T')[0], images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD018', task: 'Window Cleaning', vendorId: 'VEND003', customer: { name: 'Rachel Berry', phone: '999-000-1111', address: '410 West 42nd Street, New York' }, vendor: { name: 'CleanCo', avatar: 'https://placehold.co/100x100.png' }, amount: 180.00, status: 'On the Way', date: new Date().toISOString().split('T')[0], images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD019', task: 'Handyman Service', vendorId: 'VEND004', customer: { name: 'Sam Evans', phone: '321-654-9870', address: '123 Main Street, Lima' }, vendor: { name: 'Mike Rowe', avatar: 'https://placehold.co/100x100.png' }, amount: 120.00, status: 'Accepted', date: addDays(new Date(), 1).toISOString().split('T')[0], images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD020', task: 'Carpet Cleaning', vendorId: 'VEND006', customer: { name: 'Tina Cohen-Chang', phone: '111-222-3333', address: '1 William McKinley High, Lima' }, vendor: { name: 'Beta Repairs', avatar: 'https://placehold.co/100x100.png' }, amount: 250.00, status: 'Completed', date: subDays(new Date(), 5).toISOString().split('T')[0], images: { before: ['https://placehold.co/600x400.png'], after: ['https://placehold.co/600x400.png'] }, conversation: [] },
    { id: 'ORD021', task: 'AC Repair', vendorId: 'VEND001', customer: { name: 'Walter White', phone: '505-123-4567', address: '308 Negra Arroyo Lane, Albuquerque' }, vendor: { name: 'John Doe', avatar: 'https://placehold.co/100x100.png' }, amount: 175.00, status: 'Completed', date: subDays(new Date(), 10).toISOString().split('T')[0], images: { before: ['https://placehold.co/600x400.png'], after: ['https://placehold.co/600x400.png'] }, conversation: [] },
    { id: 'ORD022', task: 'Electrician Service', vendorId: 'VEND002', customer: { name: 'Jesse Pinkman', phone: '505-765-4321', address: '9809 Margo Street, Albuquerque' }, vendor: { name: 'Jane Smith', avatar: 'https://placehold.co/100x100.png' }, amount: 320.00, status: 'Pending', date: subDays(new Date(), 2).toISOString().split('T')[0], images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD023', task: 'Home Cleaning', vendorId: 'VEND003', customer: { name: 'Saul Goodman', phone: '505-842-4205', address: '9800 Montgomery Blvd NE, Albuquerque' }, vendor: { name: 'CleanCo', avatar: 'https://placehold.co/100x100.png' }, amount: 400.00, status: 'On the Way', date: new Date().toISOString().split('T')[0], images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD024', task: 'Plumbing Fix', vendorId: 'VEND004', customer: { name: 'Gus Fring', phone: '505-242-7800', address: '12000 Candelaria Rd NE, Albuquerque' }, vendor: { name: 'Mike Rowe', avatar: 'https://placehold.co/100x100.png' }, amount: 95.00, status: 'Accepted', date: addDays(new Date(), 2).toISOString().split('T')[0], images: { before: [], after: [] }, conversation: [] },
    { id: 'ORD025', task: 'Pest Control', vendorId: 'VEND005', customer: { name: 'Hank Schrader', phone: '505-346-2800', address: '4901 Cumbre Del Sur Ct NE, Albuquerque' }, vendor: { name: 'Alpha Services', avatar: 'https://placehold.co/100x100.png' }, amount: 250.00, status: 'Canceled', date: subDays(new Date(), 8).toISOString().split('T')[0], images: { before: [], after: [] }, conversation: [] },
];


const statusConfig: { [key in OrderStatus]: { icon: React.ElementType, color: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
  Pending: { icon: Hourglass, color: 'text-yellow-400', variant: 'secondary' },
  Accepted: { icon: CheckCircle, color: 'text-blue-400', variant: 'outline' },
  'On the Way': { icon: Truck, color: 'text-indigo-400', variant: 'default' },
  Processing: { icon: HardHat, color: 'text-orange-400', variant: 'outline' },
  Completed: { icon: CheckCircle, color: 'text-green-400', variant: 'default' },
  Canceled: { icon: XCircle, color: 'text-red-400', variant: 'destructive' },
};

const priceHiddenStatuses: OrderStatus[] = ['Pending', 'Accepted', 'On the Way'];

const ITEMS_PER_PAGE = 7;

const defaultDateRange = {
    from: subDays(new Date(), 30),
    to: addDays(new Date(), 30),
};

export default function OrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [dateRangeInput, setDateRangeInput] = useState<DateRange | undefined>(defaultDateRange);

  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange | undefined>(defaultDateRange);
  
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const router = useRouter();


  const handleSync = async () => {
    setIsSyncing(true);
    toast({
        title: 'Syncing...',
        description: 'Fetching new leads from Google Sheets.',
    });
    
    const result = await syncOrdersAction();

    if (result.success && result.data) {
        toast({
            title: 'Sync Successful',
            description: result.message,
        });

        const newOrders = result.data.map(lead => ({
            id: lead.id,
            task: lead.task,
            customer: lead.customer,
            vendorId: null,
            vendor: null,
            amount: 0,
            status: 'Pending' as OrderStatus,
            date: new Date().toISOString().split('T')[0],
            images: { before: [], after: [] },
            conversation: [{ speaker: 'Summary', text: lead.conversationSummary }],
        }));

        setOrders(prev => [...newOrders, ...prev]);

    } else {
        toast({
            variant: 'destructive',
            title: 'Sync Failed',
            description: result.message,
        });
    }
    setIsSyncing(false);
  };


  const handleFilter = () => {
    setAppliedSearchQuery(searchInput);
    setAppliedDateRange(dateRangeInput);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchInput('');
    setDateRangeInput(defaultDateRange);
    setAppliedSearchQuery('');
    setAppliedDateRange(defaultDateRange);
    setCurrentPage(1);
  };

  const handleVendorClick = (vendorId: string | null) => {
    if (vendorId) {
      setSelectedVendorId(vendorId);
      setIsVendorModalOpen(true);
    }
  };


  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchMatch = 
        !appliedSearchQuery ||
        order.id.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
        (order.customer.name && order.customer.name.toLowerCase().includes(appliedSearchQuery.toLowerCase())) ||
        (order.customer.phone && order.customer.phone.includes(appliedSearchQuery));

      const orderDate = new Date(order.date);
      const dateMatch = 
        !appliedDateRange || 
        (!appliedDateRange.from || orderDate >= appliedDateRange.from) && 
        (!appliedDateRange.to || orderDate <= new Date(appliedDateRange.to.setHours(23, 59, 59, 999)));

      return searchMatch && dateMatch;
    });
  }, [orders, appliedSearchQuery, appliedDateRange]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-8">
      <OrderDetailsModal orders={orders} orderId={selectedOrderId} onOpenChange={() => setSelectedOrderId(null)} />
      <VendorOrderHistoryModal vendorId={selectedVendorId} isOpen={isVendorModalOpen} onOpenChange={setIsVendorModalOpen} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">Track, manage, and analyze all customer orders.</p>
        </div>
        <Button onClick={() => router.push('/calling-agent')} className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold hover:opacity-90 transition-opacity">
            <SheetIcon className="mr-2 h-4 w-4" />
            Configure & Sync
        </Button>
      </div>

      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="font-headline">All Orders</CardTitle>
                    <CardDescription>A list of all recent orders in the system.</CardDescription>
                </div>
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input 
                        type="search" 
                        placeholder="Search by ID, name..." 
                        className="w-full sm:w-auto bg-background/50"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <DatePickerWithRange date={dateRangeInput} setDate={setDateRangeInput} />
                    <Button onClick={handleFilter}>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleReset}>
                        <RefreshCw className="h-4 w-4" />
                        <span className="sr-only">Reset Filters</span>
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length > 0 ? paginatedOrders.map((order) => {
                const config = statusConfig[order.status] || { icon: Clock, color: 'text-gray-400', variant: 'secondary' };
                const showPrice = !priceHiddenStatuses.includes(order.status) && order.amount > 0;
                
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium font-code">{order.id}</TableCell>
                    <TableCell>
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{order.customer.phone}</div>
                    </TableCell>
                    <TableCell>{order.task}</TableCell>
                    <TableCell>
                        {order.vendor ? (
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleVendorClick(order.vendorId)}>
                                <Avatar className="hidden h-9 w-9 sm:flex">
                                    <AvatarImage src={order.vendor.avatar} alt={order.vendor.name} data-ai-hint="person avatar" />
                                    <AvatarFallback>{order.vendor.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5">
                                    <p className="font-medium hover:underline">{order.vendor.name}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <UserX className="h-4 w-4" />
                                <span>Unassigned</span>
                            </div>
                        )}
                    </TableCell>
                    <TableCell>
                        {showPrice ? `$${order.amount.toFixed(2)}` : <span className="text-muted-foreground italic">Processing...</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant} className="gap-1.5 items-center">
                        <config.icon className={cn("h-3.5 w-3.5", config.color)} />
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onSelect={() => setSelectedOrderId(order.id)}
                            className="flex items-center"
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                            Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              }) : (
                 <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                        No orders found.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="flex items-center justify-between w-full">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{paginatedOrders.length}</strong> of <strong>{filteredOrders.length}</strong> orders
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                     <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
