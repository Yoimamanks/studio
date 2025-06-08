import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History as HistoryIcon } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="mb-6">
        <h1 className="font-headline text-3xl flex items-center">
          <HistoryIcon className="mr-3 h-8 w-8 text-primary neon-icon" />
          Scraping History
        </h1>
        <p className="text-muted-foreground mt-1">
          Review your past web scraping and AI query sessions.
        </p>
      </header>
      <Card className="flex-grow bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <HistoryIcon className="h-24 w-24 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">No History Yet</h3>
            <p className="text-muted-foreground">Your past scraping sessions will appear here.</p>
            <p className="text-sm text-muted-foreground mt-2">(This feature is under development)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
