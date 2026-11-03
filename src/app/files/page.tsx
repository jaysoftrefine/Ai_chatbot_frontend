"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { GeneratedFile } from "@/lib/types";

export default function FilesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      setError(null);
      const data = await api.listFiles();
      setFiles(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load generated files");
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  const handleDownload = async (file: GeneratedFile) => {
    try {
      await api.downloadFileBlob(file.id, file.file_name);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Download failed");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Generated Files</h1>
          <p className="mt-1 text-sm text-zinc-400">
            All Office documents created during your chat sessions.
          </p>
        </div>
        <button
          onClick={loadFiles}
          className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
          {error}
        </div>
      )}

      {loadingFiles ? (
        <div className="text-xs text-zinc-400">Loading your files...</div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-3">
          <div className="text-3xl">📁</div>
          <h3 className="text-sm font-semibold text-zinc-300">No Generated Files Yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Ask the assistant to generate an Excel sheet, Word document, or PowerPoint deck in your chat!
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-md">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {files.map((file) => {
                const formatColor =
                  file.format === "excel"
                    ? "text-emerald-400 bg-emerald-950/60 border-emerald-800"
                    : file.format === "word"
                    ? "text-blue-400 bg-blue-950/60 border-blue-800"
                    : "text-amber-400 bg-amber-950/60 border-amber-800";

                const formattedSize =
                  file.size_bytes > 1024 * 1024
                    ? `${(file.size_bytes / (1024 * 1024)).toFixed(1)} MB`
                    : `${(file.size_bytes / 1024).toFixed(1)} KB`;

                return (
                  <tr key={file.id} className="hover:bg-zinc-850/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${formatColor}`}>
                        {file.format}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-zinc-100 max-w-xs truncate" title={file.file_name}>
                      {file.file_name}
                      <span className="block text-[10px] text-zinc-500 font-mono mt-0.5">
                        SHA: {file.sha256.substring(0, 12)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">{formattedSize}</td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {new Date(file.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownload(file)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors"
                      >
                        ⬇ Download
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

