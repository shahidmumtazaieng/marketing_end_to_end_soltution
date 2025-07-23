
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadCloud, PlusCircle } from 'lucide-react';
import { useState } from 'react';

type CallRecipient = {
  name: string;
  phone: string;
  notes: string;
  status: 'Not Called' | 'Completed' | 'Failed';
  lastCalled: string | null;
};

const initialRecipients: CallRecipient[] = [
    { name: 'John Doe', phone: '+15551234567', notes: 'Interested in AC repair', status: 'Not Called', lastCalled: null },
    { name: 'Jane Smith', phone: '+15559876543', notes: 'Follow up on cleaning service', status: 'Not Called', lastCalled: null },
];

export default function NumberManagementPage() {
  const [recipients, setRecipients] = useState<CallRecipient[]>(initialRecipients);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Number Management</h1>
        <p className="text-muted-foreground">Add and manage the phone numbers for the AI calling agent to contact.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Add Single Number</CardTitle>
                    <CardDescription>Manually add a new person to the call list.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="e.g., John Doe" />
                     </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" placeholder="e.g., +15551234567" />
                     </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input id="notes" placeholder="e.g., Follow up on quote" />
                     </div>
                     <Button className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Number
                     </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Upload Number List</CardTitle>
                    <CardDescription>Bulk upload a list of numbers from a CSV file.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center w-full">
                        <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-muted-foreground">CSV file (MAX. 5MB)</p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" accept=".csv" />
                        </Label>
                    </div>
                </CardContent>
            </Card>

        </div>

        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Onboarding Numbers</CardTitle>
                    <CardDescription>This is the list of numbers the agent will call.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Called</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recipients.length > 0 ? recipients.map((recipient, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{recipient.name}</TableCell>
                                    <TableCell>{recipient.phone}</TableCell>
                                    <TableCell>{recipient.status}</TableCell>
                                    <TableCell>{recipient.lastCalled || 'N/A'}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                    No numbers added yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
