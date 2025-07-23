
'use server';
/**
 * @fileOverview This file defines a Genkit flow for assigning a vendor to an order.
 * - assignVendor - The main flow function.
 * - AssignVendorInput - The input type for the flow.
 * - Vendor - The type representing a vendor.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { calculateDistance } from '@/lib/utils';
import { Vendor } from '@/app/(dashboard)/vendors/page';

// Mock vendor data - in a real app, this would be fetched from Firestore
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
    location: { latitude: 40.7128, longitude: -74.0060 }, // New York City
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
    location: { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
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


const AssignVendorInputSchema = z.object({
  orderId: z.string(),
  serviceType: z.string(),
  conversationSummary: z.string(),
  customerLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});
export type AssignVendorInput = z.infer<typeof AssignVendorInputSchema>;

const VendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  contact: z.string(),
  status: z.string(),
  avatar: z.string(),
  memberSince: z.string(),
  orders: z.object({
    total: z.number(),
    completed: z.number(),
    pending: z.number(),
    canceled: z.number(),
  }),
  services: z.array(z.string()),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  activeOrders: z.number(),
});

export async function assignVendor(input: AssignVendorInput): Promise<Vendor> {
  return assignVendorFlow(input);
}

const getAvailableVendorsTool = ai.defineTool(
  {
    name: 'getAvailableVendors',
    description: 'Get a list of available vendors who can perform a specific service type.',
    inputSchema: z.object({
      serviceType: z.string(),
      customerLocation: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    }),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        services: z.array(z.string()),
        activeOrders: z.number(),
        distanceKm: z.number(),
      })
    ),
  },
  async ({ serviceType, customerLocation }) => {
    // Filter vendors by service type and status
    const qualifiedVendors = allVendors.filter(
      (vendor) =>
        vendor.status === 'Verified' &&
        vendor.services.some(s => s.toLowerCase().includes(serviceType.toLowerCase()))
    );

    // Calculate distance for each qualified vendor
    return qualifiedVendors.map((vendor) => ({
      ...vendor,
      distanceKm: calculateDistance(customerLocation, vendor.location),
    }));
  }
);


const assignmentPrompt = ai.definePrompt({
    name: 'assignVendorPrompt',
    tools: [getAvailableVendorsTool],
    input: { schema: AssignVendorInputSchema },
    output: { schema: z.object({ vendorId: z.string().describe("The ID of the best vendor to assign.") }) },
    prompt: `You are an AI dispatcher for a service company. Your job is to assign a new order to the best available vendor.

    Order Details:
    - Service Type: {{{serviceType}}}
    - Conversation Summary: {{{conversationSummary}}}

    Use the 'getAvailableVendors' tool to find qualified vendors for the service type.

    From the list of available vendors, choose the BEST one based on the following criteria, in order of importance:
    1.  **Lowest Distance**: The vendor closest to the customer is strongly preferred.
    2.  **Lowest Active Orders**: The vendor with the fewest active orders is preferred.
    3.  **Specialization**: If the conversation summary mentions specific details, prefer a vendor whose services list is a better match.

    Based on your analysis, return the ID of the single best vendor for this job.`,
});


const assignVendorFlow = ai.defineFlow(
  {
    name: 'assignVendorFlow',
    inputSchema: AssignVendorInputSchema,
    outputSchema: VendorSchema,
  },
  async (input) => {
    const { output } = await assignmentPrompt(input);
    if (!output?.vendorId) {
        throw new Error("AI failed to select a vendor.");
    }

    const assignedVendor = allVendors.find(v => v.id === output.vendorId);
    if (!assignedVendor) {
        throw new Error(`AI selected an invalid vendor ID: ${output.vendorId}`);
    }

    console.log(`Assigned Vendor: ${assignedVendor.name} to order ${input.orderId}`);
    
    // In a real app, you would now update the vendor's activeOrders count in Firestore.
    // e.g., assignedVendor.activeOrders += 1;
    
    return assignedVendor;
  }
);
