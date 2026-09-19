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
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-[420px] lg:col-span-7" />
        <div className="grid gap-4 lg:col-span-5 lg:grid-rows-[1fr_auto]">
          <Skeleton className="h-[236px]" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-[168px]" />
            <Skeleton className="h-[168px]" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        <Skeleton className="h-96 lg:col-span-7" />
        <Skeleton className="h-96 lg:col-span-5" />
      </div>
    </div>
  );
}
