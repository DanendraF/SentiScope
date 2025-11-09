import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { DashboardTopbar } from '@/components/dashboard-topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
