'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ChatPage from '@/components/chat-page';
import { Loader2 } from 'lucide-react';

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (user.role === 'admin') {
      router.replace('/admin');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role === 'admin') {
    return <LoadingSpinner />;
  }

  return <ChatPage />;
}
