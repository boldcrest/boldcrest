"use client";

import { MobileNav, Sidebar, Topbar } from "@/components/shell";
import { Skeleton } from "@/components/ui";
import { useDemo } from "@/lib/demo/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useDemo();

  return (
    <div className="flex min-h-[100dvh]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <MobileNav />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
          {ready ? children : <LoadingShell />}
        </main>
      </div>
    </div>
  );
}

/** Matches the dashboard's real shape so the first paint does not jump. */
function LoadingShell() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-8 w-52" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
