'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Users, BrainCircuit, BarChart3, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { MOCK_USERS } from "@/lib/auth";

export default function AdminDashboard() {
  const { user } = useAuth();
  const totalUsers = MOCK_USERS.length;

  return (
    <div className="flex flex-col gap-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome, {user?.name}!</h1>
            <p className="text-muted-foreground">Here&apos;s a quick overview of your M-Health platform.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">All registered users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
              <BrainCircuit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12 PDFs</div>
              <p className="text-xs text-muted-foreground">Documents powering the chatbot</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Logins</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.6</div>
              <p className="text-xs text-muted-foreground">Average logins per user</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Login</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2h ago</div>
              <p className="text-xs text-muted-foreground">From a user in New York</p>
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>A log of recent user activities and system events.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                            <Users className="h-4 w-4 text-green-600 dark:text-green-400"/>
                        </div>
                        <p className="text-sm text-muted-foreground">New user registered: <span className="font-medium text-foreground">sara.day@example.com</span></p>
                        <p className="ml-auto text-xs text-muted-foreground">15m ago</p>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                            <BrainCircuit className="h-4 w-4 text-blue-600 dark:text-blue-400"/>
                        </div>
                        <p className="text-sm text-muted-foreground">Knowledge base updated: <span className="font-medium text-foreground">`mental_health_guide.pdf`</span> was added.</p>
                        <p className="ml-auto text-xs text-muted-foreground">1h ago</p>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                            <BarChart3 className="h-4 w-4 text-yellow-600 dark:text-yellow-400"/>
                        </div>
                        <p className="text-sm text-muted-foreground">User <span className="font-medium text-foreground">John Smith</span> reached 20 logins.</p>
                        <p className="ml-auto text-xs text-muted-foreground">3h ago</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
