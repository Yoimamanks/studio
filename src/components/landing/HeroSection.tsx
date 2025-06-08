import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="container mx-auto flex flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-headline text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
        <span className="text-primary">Z</span>Scraper
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
        Unlock web data and get AI-powered insights instantly. Scrape any URL, ask questions, and get answers from top LLMs.
      </p>
      <div className="mt-10">
        <Button asChild size="lg" className="font-headline">
          <Link href="/login">
            <Rocket className="mr-2 h-5 w-5" /> Try Now
          </Link>
        </Button>
      </div>
      <div className="mt-12 w-full max-w-2xl rounded-lg bg-card p-2 shadow-2xl">
        <Image
          src="https://placehold.co/800x450.gif/2e2e3e/BE64FF" 
          alt="ZScraper app functionality explainer"
          width={800}
          height={450}
          className="rounded-md"
          data-ai-hint="app explainer animation"
          priority
        />
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Powered by cutting-edge AI.
      </p>
    </div>
  );
}
