'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Copy, CheckCircle, XCircle, ShieldOff, ShieldCheck, ShieldAlert, TrendingUp, TrendingDown, Hourglass, Search, ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { VendorOrderHistoryModal } from '@/components/vendor-order-history-modal';

type VendorStatus = 'Verified' | 'Pending' | 'Blocked';

export type Vendor = {
  id: string;
  name: string;
  contact: string;
  phone?: string;
  status: VendorStatus;
  avatar: string;
  memberSince: string;
  orders: {
    total: number;
    completed: number;
    pending: number;
    canceled: number;
  };
  services: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  activeOrders: number;
  uniqueVendorId?: string;
  registeredViaApp?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  verifiedAt?: string;
  verifiedBy?: string;
};

// Real-time vendors data from database
const [vendors, setVendors] = useState<Vendor[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [uniqueVendorIds, setUniqueVendorIds] = useState<any[]>([]);

// Mock user ID - in real app, get from auth context
const userId = 'user-123';

// Fetch vendors and unique IDs on component mount
useEffect(() => {
  fetchVendors();
  fetchUniqueVendorIds();
}, []);

// Fetch vendors from database
const fetchVendors = async () => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/vendors?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      setVendors(result.data);
      console.log(`✅ Loaded ${result.data.length} vendors from database`);
    } else {
      throw new Error(result.message || 'Failed to fetch vendors');
    }
  } catch (error) {
    console.error('Error fetching vendors:', error);
    setError(error instanceof Error ? error.message : 'Failed to fetch vendors');
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Failed to load vendors. Please try again.',
    });
  } finally {
    setLoading(false);
  }
};

// Fetch unique vendor IDs
const fetchUniqueVendorIds = async () => {
  try {
    const response = await fetch(`/api/vendors/validate-id?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        setUniqueVendorIds(result.data);
      }
    }
  } catch (error) {
    console.error('Error fetching unique vendor IDs:', error);
  }
};

// Generate unique vendor ID
const generateUniqueVendorId = async () => {
  try {
    const response = await fetch('/api/vendors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      toast({
        title: 'Success',
        description: `Unique vendor ID generated: ${result.data.unique_id}`,
      });

      // Refresh unique vendor IDs list
      fetchUniqueVendorIds();

      return result.data.unique_id;
    } else {
      throw new Error(result.message || 'Failed to generate unique vendor ID');
    }
  } catch (error) {
    console.error('Error generating unique vendor ID:', error);
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Failed to generate unique vendor ID. Please try again.',
    });
  }
};

// Update vendor status
const updateVendorStatus = async (vendorId: string, status: 'pending' | 'verified' | 'blocked') => {
  try {
    const response = await fetch(`/api/vendors/${vendorId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: status,
        verified_by: status === 'verified' ? userId : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      toast({
        title: 'Success',
        description: `Vendor status updated to ${status}`,
      });

      // Refresh vendors list
      fetchVendors();
    } else {
      throw new Error(result.message || 'Failed to update vendor status');
    }
  } catch (error) {
    console.error('Error updating vendor status:', error);
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Failed to update vendor status. Please try again.',
    });
  }
};

// Delete vendor
const deleteVendor = async (vendorId: string) => {
  try {
    const response = await fetch(`/api/vendors/${vendorId}/status?user_id=${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Vendor deleted successfully',
      });

      // Refresh vendors list
      fetchVendors();
    } else {
      throw new Error(result.message || 'Failed to delete vendor');
    }
  } catch (error) {
    console.error('Error deleting vendor:', error);
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Failed to delete vendor. Please try again.',
    });
  }
};


const statusConfig: Record<VendorStatus, { icon: React.ElementType, color: string, variant: 'outline' | 'secondary' | 'destructive' }> = {
    Verified: { icon: ShieldCheck, color: 'text-green-500', variant: 'outline' },
    Pending: { icon: ShieldAlert, color: 'text-yellow-500', variant: 'secondary' },
    Blocked: { icon: ShieldOff, color: 'text-red-500', variant: 'destructive' },
}

const ITEMS_PER_PAGE = 5;

export default function VendorsPage() {
  const { toast } = useToast();
  const [selectedVendorForPanel, setSelectedVendorForPanel] = useState<Vendor | null>(vendors[0]);
  const [selectedVendorForModal, setSelectedVendorForModal] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const referralId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'All'>('All');
  const [currentPage, setCurrentPage] = useState(1);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralId);
    toast({
      title: 'Copied!',
      description: 'Referral ID copied to clipboard.',
    });
  };

  const filteredVendors = useMemo(() => {
    return vendors
      .filter(vendor => 
        statusFilter === 'All' || vendor.status === statusFilter
      )
      .filter(vendor => 
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.contact.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredVendors.length / ITEMS_PER_PAGE);
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handleSelectVendorForPanel = (vendor: Vendor) => {
    setSelectedVendorForPanel(vendor);
  }

  const handleOpenModal = (vendorId: string) => {
    setSelectedVendorForModal(vendorId);
    setIsModalOpen(true);
  }

  const completionRate = selectedVendorForPanel ? (selectedVendorForPanel.orders.total > 0 ? Math.round((selectedVendorForPanel.orders.completed / selectedVendorForPanel.orders.total) * 100) : 0) : 0;
  
  return (
    <>
    <VendorOrderHistoryModal vendorId={selectedVendorForModal} isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Vendors</h1>
            <p className="text-muted-foreground">Manage your vendors and their performance.</p>
            </div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="font-headline">Vendor List</CardTitle>
                    <CardDescription>A list of all vendors in your network. Click a row to see details.</CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-auto">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="search" 
                            placeholder="Search by name or email..." 
                            className="pl-8 w-full"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 gap-1">
                            <ListFilter className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Filter
                            </span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem checked={statusFilter === 'All'} onCheckedChange={() => { setStatusFilter('All'); setCurrentPage(1); }}>
                            All
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={statusFilter === 'Verified'} onCheckedChange={() => { setStatusFilter('Verified'); setCurrentPage(1); }}>
                            Verified
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={statusFilter === 'Pending'} onCheckedChange={() => { setStatusFilter('Pending'); setCurrentPage(1); }}>
                            Pending
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem checked={statusFilter === 'Blocked'} onCheckedChange={() => { setStatusFilter('Blocked'); setCurrentPage(1); }}>
                            Blocked
                        </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">Canceled</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVendors.length > 0 ? paginatedVendors.map((vendor) => (
                    <TableRow 
                      key={vendor.id} 
                      onClick={() => handleSelectVendorForPanel(vendor)}
                      className={`cursor-pointer ${selectedVendorForPanel?.id === vendor.id ? 'bg-muted' : ''}`}
                    >
                      <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                              <Avatar className="hidden h-9 w-9 sm:flex">
                                  <AvatarImage src={vendor.avatar} alt={vendor.name} data-ai-hint="person avatar" />
                                  <AvatarFallback>{vendor.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="grid gap-0.5">
                                  <p className="font-medium">{vendor.name}</p>
                                  <p className="text-xs text-muted-foreground">{vendor.contact}</p>
                              </div>
                          </div>
                      </TableCell>
                      <TableCell>{vendor.services.join(', ')}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[vendor.status as VendorStatus].variant}>
                          <div className="flex items-center gap-2">
                               {React.createElement(statusConfig[vendor.status as VendorStatus].icon, { className: `h-4 w-4 ${statusConfig[vendor.status as VendorStatus].color}` })}
                              <span>{vendor.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{vendor.orders.completed}</TableCell>
                      <TableCell className="text-center">{vendor.orders.pending}</TableCell>
                      <TableCell className="text-center">{vendor.orders.canceled}</TableCell>
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
                             <DropdownMenuItem onSelect={() => handleOpenModal(vendor.id)}>View History</DropdownMenuItem>
                            {vendor.status === 'Pending' && <DropdownMenuItem><CheckCircle className="mr-2 h-4 w-4" />Verify</DropdownMenuItem>}
                            {vendor.status === 'Blocked' 
                              ? <DropdownMenuItem><ShieldCheck className="mr-2 h-4 w-4" />Unblock</DropdownMenuItem>
                              : <DropdownMenuItem><ShieldOff className="mr-2 h-4 w-4" />Block</DropdownMenuItem>
                            }
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                               <XCircle className="mr-2 h-4 w-4" />Ban Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No vendors found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
           <CardFooter>
            <div className="flex items-center justify-between w-full">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{paginatedVendors.length}</strong> of <strong>{filteredVendors.length}</strong> vendors
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
                        disabled={currentPage === totalPages}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="lg:col-span-1 space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Referral ID</CardTitle>
                <CardDescription>Share this ID for vendors to register via the app.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2">
                    <p className="text-lg font-mono p-2 bg-muted rounded-md flex-grow overflow-x-auto">{referralId}</p>
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        {selectedVendorForPanel && (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Vendor Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={selectedVendorForPanel.avatar} alt={selectedVendorForPanel.name} data-ai-hint="person avatar" />
                            <AvatarFallback>{selectedVendorForPanel.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-lg font-bold">{selectedVendorForPanel.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedVendorForPanel.contact}</p>
                            <p className="text-xs text-muted-foreground">Member since {selectedVendorForPanel.memberSince}</p>
                        </div>
                   </div>

                   <div>
                    <h4 className="text-sm font-medium mb-2">Performance</h4>
                     <div className='space-y-4'>
                        <div className='flex justify-between items-center'>
                            <span className='text-muted-foreground'>Completion Rate</span>
                            <span className='font-bold'>{completionRate}%</span>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                <TrendingUp className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="text-muted-foreground">Completed</p>
                                    <p className="font-semibold">{selectedVendorForPanel.orders.completed}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                <Hourglass className="h-5 w-5 text-yellow-500" />
                                <div>
                                    <p className="text-muted-foreground">Pending</p>
                                    <p className="font-semibold">{selectedVendorForPanel.orders.pending}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                <TrendingDown className="h-5 w-5 text-red-500" />
                                <div>
                                    <p className="text-muted-foreground">Canceled</p>
                                    <p className="font-semibold">{selectedVendorForPanel.orders.canceled}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                <div className='font-bold text-xl'>{selectedVendorForPanel.orders.total}</div>
                                <div>
                                    <p className="text-muted-foreground">Total Orders</p>
                                </div>
                            </div>
                        </div>
                     </div>
                   </div>
                </CardContent>
                 <CardFooter>
                    <Button className="w-full" onClick={() => handleOpenModal(selectedVendorForPanel.id)}>View Full History</Button>
                </CardFooter>
            </Card>
        )}
      </div>
    </div>
    </>
  );
}
