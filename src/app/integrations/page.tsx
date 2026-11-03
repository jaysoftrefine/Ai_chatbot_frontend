"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { MicrosoftStatus } from "@/lib/types";

export default function IntegrationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<MicrosoftStatus | null>(null);
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
      const res = await api.getMicrosoftStatus();
      setStatus(res);
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
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Microsoft MCP Integration</h1>
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
        <div className="text-xs text-zinc-400">Querying Microsoft MCP capability status...</div>
      ) : status ? (
        <div className="space-y-6">
          {/* Main Status Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">MCP Server Connection</span>
              <div className="mt-2 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${status.connected ? "bg-emerald-400" : "bg-zinc-500"}`} />
                <span className="text-sm font-semibold text-zinc-100">
                  {status.connected ? "Connected" : "Unconnected / Disabled"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Transport: <span className="font-mono text-zinc-400">{status.transport}</span>
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Authentication Mode</span>
              <div className="mt-2 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${status.authenticated ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span className="text-sm font-semibold text-zinc-100">
                  {status.authenticated ? "Authenticated" : "Local / Unauthenticated"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Tenant: {status.authenticated ? "Configured" : "None configured"}
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Functional Fallback</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">Active & Functional</span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Local openpyxl, python-docx, python-pptx
              </p>
            </div>
          </div>

          {/* Capability Matrix */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Discovered Format Capabilities
            </h3>
            <p className="text-xs text-zinc-400">
              Each Office format capability is determined separately through runtime tool discovery rather than assumed:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                { name: "Excel (.xlsx)", key: "excel", active: status.format_support.excel },
                { name: "Word (.docx)", key: "word", active: status.format_support.word },
                { name: "PowerPoint (.pptx)", key: "powerpoint", active: status.format_support.powerpoint },
              ].map((fmt) => (
                <div
                  key={fmt.key}
                  className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-zinc-200">{fmt.name}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      fmt.active
                        ? "bg-emerald-950/70 border-emerald-800 text-emerald-400"
                        : "bg-zinc-900 border-zinc-700 text-zinc-400"
                    }`}
                  >
                    {fmt.active ? "MCP Tool Available" : "Local Engine (Fallback)"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Discovered Tools List */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Discovered Tools ({status.discovered_tools.length})
            </h3>
            {status.discovered_tools.length === 0 ? (
              <div className="p-4 rounded-xl border border-zinc-850 bg-zinc-950/60 text-xs text-zinc-400">
                <p className="font-semibold text-zinc-300 mb-1">No MCP tools currently registered</p>
                <p className="text-zinc-500">
                  {status.error || "Microsoft MCP server is not enabled. Document generation continues to work via trusted local Python generators."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {status.discovered_tools.map((tool) => (
                  <div key={tool.name} className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/70">
                    <div className="font-mono text-xs font-semibold text-indigo-300">{tool.name}</div>
                    <p className="mt-1 text-xs text-zinc-400">{tool.description}</p>
                    {tool.input_schema && Object.keys(tool.input_schema).length > 0 && (
                      <details className="mt-2 text-[11px] text-zinc-500 font-mono">
                        <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300">View Input Schema</summary>
                        <pre className="mt-1 p-2 rounded bg-zinc-900 overflow-x-auto text-[10px] text-zinc-300">
                          {JSON.stringify(tool.input_schema, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

