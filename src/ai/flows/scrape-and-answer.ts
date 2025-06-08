'use server';

/**
 * @fileOverview This file defines a Genkit flow for scraping content from a URL and answering questions about it using an LLM.
 * THIS FLOW IS CURRENTLY NOT USED BY ChatInterface.tsx as it has been updated to use a Python Flask backend.
 *
 * - scrapeAndAnswer - The main function to initiate the scraping and question answering process.
 * - ScrapeAndAnswerInput - The input type for the scrapeAndAnswer function.
 * - ScrapeAndAnswerOutput - The output type for the scrapeAndAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScrapeAndAnswerInputSchema = z.object({
  url: z.string().url().describe('The URL to scrape content from.'),
  question: z.string().describe('The question to ask about the scraped content.'),
  llm: z.enum(['Ollama', 'Deepseek', 'Gemini']).describe('The LLM to use for answering the question.'),
});
export type ScrapeAndAnswerInput = z.infer<typeof ScrapeAndAnswerInputSchema>;

const ScrapeAndAnswerOutputSchema = z.object({
  answer: z.string().describe('The answer to the question based on the scraped content.'),
});
export type ScrapeAndAnswerOutput = z.infer<typeof ScrapeAndAnswerOutputSchema>;

export async function scrapeAndAnswer(input: ScrapeAndAnswerInput): Promise<ScrapeAndAnswerOutput> {
  return scrapeAndAnswerFlow(input);
}

const scrapeWebpageTool = ai.defineTool({
  name: 'scrapeWebpage',
  description: 'Scrapes the content of a webpage from a given URL.',
  inputSchema: z.object({
    url: z.string().url().describe('The URL of the webpage to scrape.')
  }),
  outputSchema: z.string(),
}, async (input) => {
  try {
    const response = await fetch(input.url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const text = await response.text();
    // Basic text extraction - can be improved with a library like 'cheerio'
    const content = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return content;
  } catch (error) {
    console.error('Error scraping webpage:', error);
    return `Error scraping webpage: ${error}`;
  }
});

const answerQuestionPrompt = ai.definePrompt({
  name: 'answerQuestionPrompt',
  input: {schema: ScrapeAndAnswerInputSchema},
  output: {schema: ScrapeAndAnswerOutputSchema},
  tools: [scrapeWebpageTool],
  prompt: `You are an expert AI assistant that answers question about content from a webpage.

  First scrape the content from the given url using the scrapeWebpage tool.
  Then answer the question using the scraped content as context.
  If the question can not be answered using the scraped content, respond that you can not answer the question.

  Question: {{{question}}}
`,
});

const scrapeAndAnswerFlow = ai.defineFlow({
  name: 'scrapeAndAnswerFlow',
  inputSchema: ScrapeAndAnswerInputSchema,
  outputSchema: ScrapeAndAnswerOutputSchema,
}, async (input) => {
  // Note: The 'llm' parameter from input is not directly used here to select a model for Genkit.
  // Genkit's 'ai.generate' or prompt definition would determine the model.
  // This flow would need to be more dynamic if model selection within Genkit was required.
  const {output} = await answerQuestionPrompt(input);
  return output!;
});
