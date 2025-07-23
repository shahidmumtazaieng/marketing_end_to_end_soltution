
'use server';
/**
 * @fileOverview An AI-powered calling agent configuration flow.
 *
 * - configureAiCallingAgent - A function that handles the configuration of the AI calling agent.
 * - ConfigureAiCallingAgentInput - The input type for the configureAiCallingAgent function.
 * - ConfigureAiCallingAgentOutput - The return type for the configureAiCallingAgent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConfigureAiCallingAgentInputSchema = z.object({
  conversationLanguage: z
    .string()
    .describe('The language to be used in the conversation (e.g., English, Spanish).'),
  welcomeMessage: z.string().describe('The welcome message or call title.'),
  knowledgeBase: z
    .string()
    .describe('The knowledge base (text files or URLs) for the RAG system.'),
  enableRag: z.boolean().describe('Whether to enable RAG for conversation context.'),
  agentPersona: z
    .string()
    .describe('The agent persona (e.g., male/female voice via ElevenLabs API).'),
  googleSheetId: z.string().describe('The Google Sheet ID to sync call data to.'),
});
export type ConfigureAiCallingAgentInput = z.infer<
  typeof ConfigureAiCallingAgentInputSchema
>;

const ConfigureAiCallingAgentOutputSchema = z.object({
  success: z.boolean().describe('Indicates if the configuration was successful.'),
  message: z.string().describe('A message indicating the result of the configuration.'),
});
export type ConfigureAiCallingAgentOutput = z.infer<
  typeof ConfigureAiCallingAgentOutputSchema
>;

export async function configureAiCallingAgent(
  input: ConfigureAiCallingAgentInput
): Promise<ConfigureAiCallingAgentOutput> {
  return configureAiCallingAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'configureAiCallingAgentPrompt',
  input: {schema: ConfigureAiCallingAgentInputSchema},
  output: {schema: ConfigureAiCallingAgentOutputSchema},
  prompt: `You are an AI assistant helping to configure an AI-powered calling agent.

  The following information is provided to configure the agent:

  Conversation Language: {{{conversationLanguage}}}
  Welcome Message: {{{welcomeMessage}}}
  Knowledge Base: {{{knowledgeBase}}}
  Enable RAG: {{{enableRag}}}
  Agent Persona: {{{agentPersona}}}
  Google Sheet ID: {{{googleSheetId}}}

  Based on this information, confirm that the calling agent is configured correctly and provide a confirmation message.
  Return a JSON object that follows this schema:
  {
    "success": true or false,
    "message": "Configuration message"
  }`,
});

const configureAiCallingAgentFlow = ai.defineFlow(
  {
    name: 'configureAiCallingAgentFlow',
    inputSchema: ConfigureAiCallingAgentInputSchema,
    outputSchema: ConfigureAiCallingAgentOutputSchema,
  },
  async input => {
    try {
      // For now, we simulate success without calling the prompt, as the real logic is pending.
      // const {output} = await prompt(input);
      // TODO: Implement actual configuration logic here, e.g., setting up Twilio, ElevenLabs, LLM, and Google Sheets API.
      // This is a placeholder for the actual integration with the different APIs.
      console.log('Simulating AI Calling Agent configuration with input:', input);
      return {
        success: true,
        message: `AI Calling Agent configured successfully (simulation). Settings received.`,
      };
    } catch (error: any) {
      console.error('Error configuring AI Calling Agent:', error);
      return {
        success: false,
        message: `Failed to configure AI Calling Agent: ${error.message || error}`,
      };
    }
  }
);
