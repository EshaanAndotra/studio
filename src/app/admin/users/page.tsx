'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UsersPage() {
  const firebaseConsoleUsersUrl = `https://console.firebase.google.com/project/m-health-jxug7/authentication/users`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          View and manage all users on the M-Health platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-6 rounded-lg border-2 border-dashed border-yellow-400/80 bg-yellow-50/50 p-12 dark:bg-yellow-900/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
            <ShieldAlert className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">Secure User Management</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              For security, user data should be managed directly in the Firebase console.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This prevents unauthorized access and ensures data privacy.
            </p>
          </div>
          <Button asChild>
            <a href={firebaseConsoleUsersUrl} target="_blank" rel="noopener noreferrer">
              Go to Firebase Console
            </a>
          </Button>
      </CardContent>
    </Card>
  );
}
