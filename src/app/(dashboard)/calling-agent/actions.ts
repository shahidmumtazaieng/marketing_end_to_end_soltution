
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { configureAiCallingAgent, ConfigureAiCallingAgentInput } from "@/ai/flows/ai-powered-calling-agent";


const formSchema = z.object({
  voiceOption: z.enum(['clone', 'prebuilt']),
  voiceSample: z.any().optional(),
  conversationLanguage: z.string().min(1, 'Language is required.'),
  welcomeMessage: z.string().min(1, 'Welcome message is required.'),
  knowledgeBase: z.string().optional(),
  enableRag: z.preprocess((val) => val === 'true', z.boolean()),
  agentPersona: z.string().min(1, 'Agent persona is required.'),
  googleSheetId: z.string().min(1, 'Google Sheet ID is required.'),
});


export async function configureAgentAction(values: FormData) {
  try {
    const rawData = Object.fromEntries(values.entries());
    const validatedData = formSchema.parse(rawData);

    // TODO: Implement file upload to Firebase Storage for voice sample.
    // TODO: Implement logic to call voice cloning API (e.g., ElevenLabs).

    // For now, we'll log the received values as a placeholder.
    console.log("Received configuration:", validatedData);
    
    // We can now call the AI flow with the validated data (excluding files for now)
    const result = await configureAiCallingAgent({
      conversationLanguage: validatedData.conversationLanguage,
      welcomeMessage: validatedData.welcomeMessage,
      knowledgeBase: validatedData.knowledgeBase || '',
      enableRag: validatedData.enableRag,
      agentPersona: validatedData.agentPersona,
      googleSheetId: validatedData.googleSheetId,
    });
    
    revalidatePath("/calling-agent/configure");

    return {
      success: result.success,
      message: result.message,
    };
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation failed: " + error.errors.map(e => e.message).join(', '),
      }
    }
    return {
      success: false,
      message: "An error occurred while configuring the agent.",
    };
  }
}
