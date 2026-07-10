"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { useUsage } from "@/hooks/useUsage";

export default function AdminPage() {
  const { usage } = useUsage();
  const isAuthenticated = usage?.authenticated ?? false;
  const isAdmin = usage?.tier === "admin";

  return (
    <AppShell usage={usage}>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs text-gray-500 transition-colors hover:text-zen-cyan"
          >
            ← Back to Zenerating
          </Link>
        </div>

        <AdminDashboard
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
        />
      </main>
    </AppShell>
  );
}