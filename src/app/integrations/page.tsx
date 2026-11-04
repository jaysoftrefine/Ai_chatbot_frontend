"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { GoogleDocsStatus, MicrosoftStatus } from "@/lib/types";

export default function IntegrationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [googleDocsStatus, setGoogleDocsStatus] = useState<GoogleDocsStatus | null>(null);
  const [msStatus, setMsStatus] = useState<MicrosoftStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      setError(null);
      const [gDocs, ms] = await Promise.all([
        api.getGoogleDocsStatus().catch((e) => {
          console.warn("Failed to load Google Docs status", e);
          return null;
        }),
        api.getMicrosoftStatus().catch((e) => {
          console.warn("Failed to load Microsoft status", e);
          return null;
        }),
      ]);
      setGoogleDocsStatus(gDocs);
      setMsStatus(ms);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load integration status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadStatus();
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">External Integrations & MCP</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Runtime discovery, capability reporting, and Office format support status.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-zinc-400">Querying MCP capability status...</div>
      ) : (
        <div className="space-y-8">
          {/* Google Docs MCP Section */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Google Docs MCP Server</h2>
                  <p className="text-xs text-zinc-400 font-mono">
                    {googleDocsStatus?.server_url || "https://docsmcp.googleapis.com/mcp/v1"}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  googleDocsStatus?.enabled
                    ? "bg-emerald-950/70 border-emerald-800 text-emerald-400"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400"
                }`}
              >
                {googleDocsStatus?.enabled ? "Enabled" : "Disabled (Default)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Transport & Protocol</span>
                <p className="mt-1 font-mono text-xs text-indigo-300">
                  {googleDocsStatus?.transport || "streamable_http"} (JSON-RPC 2.0)
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Authentication Status</span>
                <p className="mt-1 text-xs">
                  {googleDocsStatus?.authenticated ? (
                    <span className="text-emerald-400 font-semibold">● OAuth 2.0 Configured</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">○ OAuth Not Configured</span>
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Developer Preview</span>
                <p className="mt-1 text-xs text-zinc-300 font-medium">
                  Workspace Developer Preview Required
                </p>
              </div>
            </div>

            {googleDocsStatus?.error && (
              <div className="rounded-lg bg-zinc-950/80 border border-zinc-800 p-3 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Notice: </span>
                {googleDocsStatus.error}
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Discovered Tools ({googleDocsStatus?.discovered_tools.length || 0})
              </h3>
              {googleDocsStatus?.discovered_tools && googleDocsStatus.discovered_tools.length > 0 ? (
                <div className="space-y-2">
                  {googleDocsStatus.discovered_tools.map((t) => (
                    <div key={t.name} className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/60">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-indigo-300">{t.name}</span>
                        {t.read_only && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">Read-only</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">{t.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">
                  Enable GOOGLE_DOCS_MCP_ENABLED=true in .env to discover runtime tools. Local Word (.docx) generation remains fully operational.
                </p>
              )}
            </div>
          </section>

          {/* Microsoft MCP Section */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">Microsoft MCP Integration</h2>
                  <p className="text-xs text-zinc-400 font-mono">
                    {msStatus?.server_url || "Not configured"}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  msStatus?.enabled
                    ? "bg-emerald-950/70 border-emerald-800 text-emerald-400"
                    : "bg-zinc-900 border-zinc-700 text-zinc-400"
                }`}
              >
                {msStatus?.enabled ? "Enabled" : "Disabled (Default)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Connection</span>
                <p className="mt-1 text-xs">
                  {msStatus?.connected ? (
                    <span className="text-emerald-400 font-semibold">● Connected</span>
                  ) : (
                    <span className="text-zinc-500">○ Disconnected</span>
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Functional Fallback</span>
                <p className="mt-1 text-xs text-emerald-400 font-semibold">
                  ● Active (openpyxl, python-docx, python-pptx)
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Tenant Auth</span>
                <p className="mt-1 text-xs text-zinc-400">
                  {msStatus?.authenticated ? "Configured" : "None configured"}
                </p>
              </div>
            </div>

            {msStatus?.error && (
              <div className="rounded-lg bg-zinc-950/80 border border-zinc-800 p-3 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Notice: </span>
                {msStatus.error}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
