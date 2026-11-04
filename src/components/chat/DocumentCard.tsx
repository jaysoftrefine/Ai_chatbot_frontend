"use client";

import React, { useState } from "react";
import { api } from "@/lib/api-client";
import { GeneratedFile } from "@/lib/types";

interface DocumentCardProps {
  file: GeneratedFile;
}

export default function DocumentCard({ file }: DocumentCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatBadge = {
    excel: {
      bg: "bg-emerald-950/80 border-emerald-800 text-emerald-300",
      icon: "📊",
      label: "Excel Spreadsheet",
    },
    word: {
      bg: "bg-blue-950/80 border-blue-800 text-blue-300",
      icon: "📄",
      label: "Word Document",
    },
    powerpoint: {
      bg: "bg-amber-950/80 border-amber-800 text-amber-300",
      icon: "📑",
      label: "PowerPoint Deck",
    },
  }[file.format] || {
    bg: "bg-zinc-900 border-zinc-700 text-zinc-300",
    icon: "📁",
    label: file.format.toUpperCase(),
  };

  const formattedSize =
    file.size_bytes > 1024 * 1024
      ? `${(file.size_bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size_bytes / 1024).toFixed(1)} KB`;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      await api.downloadFileBlob(file.id, file.file_name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-zinc-700/80 bg-zinc-900/90 p-4 shadow-lg backdrop-blur-sm max-w-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl p-2 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            {formatBadge.icon}
          </div>
          <div>
            <h4
              className="text-sm font-semibold text-zinc-100 break-words [overflow-wrap:anywhere]"
              title={file.file_name}
            >
              {file.file_name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${formatBadge.bg}`}
              >
                {formatBadge.label}
              </span>
              <span className="text-xs text-zinc-400 font-mono">{formattedSize}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-800">
        <span className="text-[11px] text-zinc-500 font-mono">
          SHA-256: {file.sha256.substring(0, 10)}...
        </span>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
        >
          {downloading ? (
            <>
              <span className="animate-spin text-xs">⏳</span> Downloading...
            </>
          ) : (
            <>
              <span>⬇</span> Download File
            </>
          )}
        </button>
      </div>
    </div>
  );
}

