import React from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { Header } from "@/components/shared/header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar navigation */}
      <Sidebar />

      {/* Right Column Layout */}
      <div className="flex flex-col flex-1 h-full overflow-hidden md:ml-64">
        {/* Dynamic Screen Header */}
        <Header />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-6">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation tab bar */}
      <BottomNav />
    </div>
  );
}
