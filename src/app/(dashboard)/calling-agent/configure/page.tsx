
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { configureAgentAction } from '../actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UploadCloud } from 'lucide-react';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  voiceOption: z.enum(['clone', 'prebuilt']).default('prebuilt'),
  voiceSample: z.any().optional(),
  conversationLanguage: z.string().min(1, 'Language is required.'),
  welcomeMessage: z.string().min(1, 'Welcome message is required.'),
  knowledgeBase: z.string().optional(),
  enableRag: z.boolean().default(true),
  agentPersona: z.string().min(1, 'Agent persona is required.'),
  googleSheetId: z.string().min(1, 'Google Sheet ID is required.'),
});

type AgentFormValues = z.infer<typeof formSchema>;

export default function ConfigureAgentPage() {
  const { toast } = useToast();
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      voiceOption: 'prebuilt',
      conversationLanguage: 'en-US',
      welcomeMessage: 'Hello! How can I assist you today?',
      knowledgeBase: '',
      enableRag: true,
      agentPersona: 'female-1',
      googleSheetId: '',
    },
  });

  const voiceOption = form.watch('voiceOption');

  async function onSubmit(values: AgentFormValues) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
        if (key === 'voiceSample') {
            if (value instanceof FileList && value.length > 0) {
                formData.append(key, value[0]);
            }
        } else {
            formData.append(key, String(value));
        }
    });

    // This is a placeholder for the server action that will handle form data with file uploads.
    // The actual file handling logic will be in `actions.ts`.
    console.log("Form submitted. FormData ready to be sent.");

    toast({
      title: 'Configuration Saved (Simulated)',
      description: 'Your AI calling agent settings have been updated.',
    });
  }

  return (
     <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Configure AI Agent</h1>
        <p className="text-muted-foreground">Set up and manage the settings for your automated calling agent.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Voice Configuration</CardTitle>
                    <CardDescription>Choose a voice for your agent and select the language.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="voiceOption"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Voice Option</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid md:grid-cols-2 gap-4"
                                >
                                <FormItem>
                                    <RadioGroupItem value="prebuilt" id="prebuilt" className="peer sr-only" />
                                    <Label htmlFor="prebuilt" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <h3 className="font-semibold">Use a Pre-built Voice</h3>
                                        <p className="text-sm text-muted-foreground">Select from a list of high-quality voices.</p>
                                    </Label>
                                </FormItem>
                                <FormItem>
                                    <RadioGroupItem value="clone" id="clone" className="peer sr-only" />
                                     <Label htmlFor="clone" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <h3 className="font-semibold">Clone Your Voice</h3>
                                        <p className="text-sm text-muted-foreground">Upload a sample to create a digital twin of your voice.</p>
                                    </Label>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {voiceOption === 'clone' && (
                         <FormField
                            control={form.control}
                            name="voiceSample"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Upload Voice Sample</FormLabel>
                                <FormControl>
                                    <div className="flex items-center justify-center w-full">
                                        <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-muted-foreground">MP3 or WAV (MIN. 30s, MAX. 5MB)</p>
                                            </div>
                                            <Input id="dropzone-file" type="file" className="hidden" accept=".mp3,.wav" onChange={(e) => field.onChange(e.target.files)} />
                                        </Label>
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {voiceOption === 'prebuilt' && (
                        <FormField
                            control={form.control}
                            name="agentPersona"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Pre-built Voice</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a voice" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="female-1">Female 1</SelectItem>
                                    <SelectItem value="male-1">Male 1</SelectItem>
                                    <SelectItem value="female-2">Female 2</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <FormField
                        control={form.control}
                        name="conversationLanguage"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Conversation Language</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a language" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="en-US">English (US)</SelectItem>
                                <SelectItem value="es-ES">Spanish</SelectItem>
                                <SelectItem value="fr-FR">French</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Agent Behavior</CardTitle>
                    <CardDescription>Define how the agent interacts and what knowledge it uses.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="welcomeMessage"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Welcome Message / Call Title</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="e.g., 'Hi, this is a call from [Your Company]. How can I help you?'"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="knowledgeBase"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Knowledge Base</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter URLs or upload text files" {...field} />
                            </FormControl>
                            <FormDescription>
                            Provide data for the RAG system to use. Separate URLs with commas.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="enableRag"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                            <FormLabel>Enable RAG</FormLabel>
                            <FormDescription>
                                Allow the agent to use the knowledge base for context.
                            </FormDescription>
                            </div>
                            <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="googleSheetId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Google Sheet ID for Conversation Sync</FormLabel>
                            <FormControl>
                            <Input placeholder="Enter your Google Sheet ID for data syncing" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                 <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>

        </form>
      </Form>
    </div>
  );
}
