
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Globe, HelpCircle, Bot, Send, Loader2 as SpinnerIcon } from "lucide-react";

const chatSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL." }),
  question: z.string().min(5, { message: "Question must be at least 5 characters." }),
  llm: z.enum(["Gemini", "Ollama", "Deepseek"], {
    errorMap: () => ({ message: "Please select an LLM." }),
  }),
});

type ChatFormValues = z.infer<typeof chatSchema>;

const FLASK_BACKEND_URL = process.env.NEXT_PUBLIC_FLASK_BACKEND_URL || 'http://192.168.0.100:5000';

export function ChatInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ChatFormValues>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
      url: "",
      question: "",
      llm: "Gemini",
    },
  });

  const onSubmit = async (data: ChatFormValues) => {
    setIsLoading(true);
    setAiResponse(null);

    const payload = {
      url: data.url,
      question: data.question,
      model: data.llm.toLowerCase(),
    };

    try {
      console.log(`Attempting to fetch from: ${FLASK_BACKEND_URL}/ask`);
      const response = await fetch(`${FLASK_BACKEND_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response from server." }));
        throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setAiResponse(result.answer);
      toast({
        title: "AI Responded",
        description: "Your question has been answered.",
      });
    } catch (error: any) {
      console.error("Full error object from fetch:", error);
      
      let detailedErrorMessage = "An unexpected error occurred while processing your request.";
      if (error instanceof Error) {
        detailedErrorMessage = error.message; // This would likely be "Failed to fetch"
      } else if (typeof error === 'string') {
        detailedErrorMessage = error;
      } else if (error && typeof error.toString === 'function') {
        detailedErrorMessage = error.toString();
      }
      
      let userFriendlyMessage = detailedErrorMessage;
      if (detailedErrorMessage.toLowerCase().includes('failed to fetch')) {
        userFriendlyMessage = `Failed to connect to the AI backend at ${FLASK_BACKEND_URL}. Please ensure the backend server is running and accessible. Check network connectivity, firewalls, and the server logs. Raw error: ${error.message || detailedErrorMessage}`;
      }

      setAiResponse(`An error occurred: ${userFriendlyMessage}`);
      toast({
        title: "Processing Error",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full flex-grow">
      <Card className="flex-grow flex flex-col bg-card shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Web Scraper & AI Query</CardTitle>
              <CardDescription>
                Provide a URL, ask a question, and select an LLM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-grow overflow-y-auto pr-2 md:pr-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm">
                      <Globe className="mr-2 h-4 w-4 text-accent" /> URL to Scrape
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm">
                      <HelpCircle className="mr-2 h-4 w-4 text-accent" /> Your Question
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., What is the main purpose of this webpage?"
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="llm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center text-sm">
                      <Bot className="mr-2 h-4 w-4 text-accent" /> Select LLM
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an AI model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Gemini">Gemini (Google via OpenRouter)</SelectItem>
                        <SelectItem value="Ollama">Ollama (Llama via OpenRouter)</SelectItem>
                        <SelectItem value="Deepseek">Deepseek (via OpenRouter)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t border-border pt-6">
              <Button type="submit" disabled={isLoading} className="w-full font-headline text-base py-3">
                {isLoading ? (
                  <SpinnerIcon className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Send className="mr-2 h-5 w-5" />
                )}
                {isLoading ? "Processing..." : "Scrape & Ask AI"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      { (isLoading || aiResponse) && (
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex items-center">
              <Bot className="mr-2 h-5 w-5 text-primary neon-icon" /> AI Response
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-[100px] max-h-[400px] overflow-y-auto">
            {isLoading && !aiResponse && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <SpinnerIcon className="h-8 w-8 animate-spin text-primary mr-3" />
                AI is analyzing the content and formulating a response...
              </div>
            )}
            {aiResponse && (
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap p-1 rounded-md bg-background/30">
                <p>{aiResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
