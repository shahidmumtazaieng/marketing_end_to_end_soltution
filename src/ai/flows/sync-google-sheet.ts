
'use server';

/**
 * @fileOverview This file defines a Genkit flow for syncing new leads from a Google Sheet.
 *
 * - syncGoogleSheet - A function that initiates the sync process.
 * - SyncGoogleSheetInput - The input type for the syncGoogleSheet function.
 * - SyncGoogleSheetOutput - The return type for the syncGoogleSheet function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SyncGoogleSheetInputSchema = z.object({
  sheetId: z.string().describe('The ID of the Google Sheet to sync from.'),
});
export type SyncGoogleSheetInput = z.infer<typeof SyncGoogleSheetInputSchema>;

// This schema now represents a "Lead" or an "Unassigned Order"
const LeadSchema = z.object({
  id: z.string(),
  task: z.string().describe("The service requested by the customer."),
  customer: z.object({
    name: z.string(),
    phone: z.string(),
    address: z.string(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
  conversationSummary: z.string().describe("The summary of the conversation with the AI calling agent."),
});


const SyncGoogleSheetOutputSchema = z.object({
  leads: z.array(LeadSchema).describe('An array of new leads synced from the Google Sheet.'),
});
export type SyncGoogleSheetOutput = z.infer<typeof SyncGoogleSheetOutputSchema>;

export async function syncGoogleSheet(input: SyncGoogleSheetInput): Promise<SyncGoogleSheetOutput> {
  return syncGoogleSheetFlow(input);
}

// This tool simulates reading raw lead data from the Google Sheets API.
const readGoogleSheetTool = ai.defineTool({
  name: 'readGoogleSheetData',
  description: 'Reads all new lead data from the specified Google Sheet.',
  inputSchema: z.object({
    sheetId: z.string().describe('The ID of the Google Sheet.'),
  }),
  outputSchema: z.array(LeadSchema),
  async handler({ sheetId }) {
    console.log(`Simulating read from Google Sheet ID: ${sheetId}`);
    // In a real application, you would use the Google Sheets API here.
    // This is mock data representing what the AI calling agent would log.
    return [
      {
        id: 'LEAD-201',
        task: 'Emergency Plumbing',
        customer: { name: 'Gary Smith', phone: '222-333-4444', address: '101 First Ave, Metroburg', location: { latitude: 40.7128, longitude: -74.0060 } },
        conversationSummary: 'Customer reported a burst pipe under the kitchen sink. Needs immediate assistance. Quoted standard emergency fee for plumbing work.',
      },
      {
        id: 'LEAD-202',
        task: 'New Build Wiring',
        customer: { name: 'Helen Troy', phone: '333-444-5555', address: '202 Second St, Gotham', location: { latitude: 41.8781, longitude: -87.6298 } },
        conversationSummary: 'Client is building a new home and requires a full electrical wiring consultation. Scheduled a call back for tomorrow at 10 AM with a senior electrician.',
      },
      {
        id: 'LEAD-203',
        task: 'Office Deep Clean',
        customer: { name: 'Ian Fleming', phone: '444-555-6666', address: '303 Third Blvd, London', location: { latitude: 34.0522, longitude: -118.2437 } },
        conversationSummary: 'Customer wants a deep clean for a 5,000 sq ft office space. Mentioned they need it done over the weekend. A detailed quote has been emailed. Service type is Home Cleaning.',
      },
    ];
  },
});

const syncPrompt = ai.definePrompt({
  name: 'syncGoogleSheetPrompt',
  tools: [readGoogleSheetTool],
  input: { schema: SyncGoogleSheetInputSchema },
  output: { schema: SyncGoogleSheetOutputSchema },
  prompt: `Use the readGoogleSheetData tool to get all new lead data from the provided sheet ID. Return the data as a structured JSON object.

Sheet ID: {{{sheetId}}}`,
});

const syncGoogleSheetFlow = ai.defineFlow(
  {
    name: 'syncGoogleSheetFlow',
    inputSchema: SyncGoogleSheetInputSchema,
    outputSchema: SyncGoogleSheetOutputSchema,
  },
  async (input) => {
    // For this simulation, we directly call the tool.
    // In a more complex scenario, the LLM could decide which tool to call.
    const leads = await readGoogleSheetTool({ sheetId: input.sheetId });
    return { leads };
  }
);
