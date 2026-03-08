"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onLogin: (password: string) => Promise<boolean>;
}

export default function AdminLogin({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError("");
    const ok = await onLogin(password);
    if (!ok) {
      setError("Incorrect password. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-violet-100 dark:bg-violet-900/50 p-4 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
            Enter your admin password to manage settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
              className={cn(
                "w-full px-4 py-3 pr-12 rounded-xl border text-sm",
                "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
                "placeholder-gray-400 dark:placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow",
                error
                  ? "border-red-400 dark:border-red-600"
                  : "border-gray-200 dark:border-gray-700"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-sm transition-all",
              "bg-violet-600 hover:bg-violet-700 text-white shadow-sm",
              (loading || !password) && "opacity-60 cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying…
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-xs text-gray-400 dark:text-gray-600 text-center mt-6">
          Default password: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">admin123</code>
          <br />
          Change it in Settings after signing in
        </p>
      </div>
    </div>
  );
}
