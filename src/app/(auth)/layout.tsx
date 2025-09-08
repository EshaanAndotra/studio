import type { ReactNode } from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://picsum.photos/1920/1080"
          alt="Abstract background"
          data-ai-hint="abstract background"
          fill
          style={{ objectFit: 'cover' }}
          className="opacity-20"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>
      <main className="z-10 flex w-full flex-col items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
