'use server';
/**
 * @fileOverview Extracts booking or visit details from call summaries to update order status.
 *
 * - conversationSummaryToOrderStatus - A function that handles the extraction and order status update.
 * - ConversationSummaryToOrderStatusInput - The input type for the conversationSummaryToOrderStatus function.
 * - ConversationSummaryToOrderStatusOutput - The return type for the conversationSummaryToOrderStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationSummaryToOrderStatusInputSchema = z.object({
  conversationSummary: z
    .string()
    .describe('The summary of the conversation from which to extract order details.'),
  currentOrderStatus: z.string().describe('The current status of the order.'),
});
export type ConversationSummaryToOrderStatusInput = z.infer<
  typeof ConversationSummaryToOrderStatusInputSchema
>;

const ConversationSummaryToOrderStatusOutputSchema = z.object({
  extractedOrderDetails: z
    .string()
    .describe('The extracted order details from the conversation summary.'),
  updatedOrderStatus: z
    .string()
    .describe('The updated status of the order based on the conversation summary.'),
});
export type ConversationSummaryToOrderStatusOutput = z.infer<
  typeof ConversationSummaryToOrderStatusOutputSchema
>;

export async function conversationSummaryToOrderStatus(
  input: ConversationSummaryToOrderStatusInput
): Promise<ConversationSummaryToOrderStatusOutput> {
  return conversationSummaryToOrderStatusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conversationSummaryToOrderStatusPrompt',
  input: {schema: ConversationSummaryToOrderStatusInputSchema},
  output: {schema: ConversationSummaryToOrderStatusOutputSchema},
  prompt: `You are an AI assistant specializing in extracting order details and updating order statuses based on conversation summaries.

  Given the following conversation summary and the current order status, extract any relevant booking or visit details (e.g., type of service, date, time, specific requests) and determine if the order status needs to be updated.

  Conversation Summary: {{{conversationSummary}}}
  Current Order Status: {{{currentOrderStatus}}}

  Provide the extracted order details and the updated order status in the output.
  If no booking or visit details are found, then the extractedOrderDetails field should be empty string.
  If order status does not need to be updated, then the updatedOrderStatus field should be same as currentOrderStatus.
  `,
});

const conversationSummaryToOrderStatusFlow = ai.defineFlow(
  {
    name: 'conversationSummaryToOrderStatusFlow',
    inputSchema: ConversationSummaryToOrderStatusInputSchema,
    outputSchema: ConversationSummaryToOrderStatusOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
