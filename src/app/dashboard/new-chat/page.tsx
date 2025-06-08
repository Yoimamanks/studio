import { ChatInterface } from "@/components/dashboard/ChatInterface";
import { MessageSquarePlus } from "lucide-react";

export default function NewChatPage() {
  return (
    <div className="flex flex-col h-full">
       <header className="mb-6">
        <h1 className="font-headline text-3xl flex items-center">
          <MessageSquarePlus className="mr-3 h-8 w-8 text-primary neon-icon" />
          New Chat
        </h1>
        <p className="text-muted-foreground mt-1">
          Enter a URL to scrape, ask a question, and get AI-powered answers.
        </p>
      </header>
      <ChatInterface />
    </div>
  );
}
