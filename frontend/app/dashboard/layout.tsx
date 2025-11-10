'use client';

import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardTopbar } from '@/components/dashboard-topbar';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require authentication for dashboard
  const { loading } = useAuth(true);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <DashboardSidebar />
      <div className="flex flex-col w-0 flex-1 overflow-hidden md:ml-64">
        <DashboardTopbar />
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}
