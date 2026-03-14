"use client";

import SettingsPanel from "@/components/admin/SettingsPanel";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <SettingsPanel />
      </div>
    </div>
  );
}
