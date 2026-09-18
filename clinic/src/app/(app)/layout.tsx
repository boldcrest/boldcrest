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
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-10 pt-4 sm:px-7">
          {ready ? children : <LoadingShell />}
        </main>
      </div>
    </div>
  );
}

/** Matches the dashboard's real shape so the first paint does not jump. */
function LoadingShell() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-56 rounded-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
