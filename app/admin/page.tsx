"use client";

import { useState } from "react";
import AdminLogin from "@/components/admin/AdminLogin";
import SettingsPanel from "@/components/admin/SettingsPanel";

export default function AdminPage() {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);

  const handleLogin = async (password: string): Promise<boolean> => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      setAdminPassword(password);
      return true;
    }
    return false;
  };

  if (!adminPassword) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <SettingsPanel
          adminPassword={adminPassword}
          onLogout={() => setAdminPassword(null)}
        />
      </div>
    </div>
  );
}
