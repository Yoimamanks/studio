"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/new-chat');
  }, [router]);

  return (
    <div className="flex min-h-full flex-grow items-center justify-center">
      <Spinner className="h-8 w-8 text-primary" />
      <p className="ml-2">Loading chat...</p>
    </div>
  );
}
