
import { config } from 'dotenv';
config();

import '@/ai/flows/conversation-summary-to-order-status.ts';
import '@/ai/flows/scrape-business-data.ts';
import '@/ai/flows/ai-powered-calling-agent.ts';
import '@/ai/flows/sync-google-sheet.ts';
import '@/ai/flows/assign-vendor-flow.ts';
