"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { PersonaGrouped, PersonaPreference } from "@/lib/types";

export default function PersonaPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [persona, setPersona] = useState<PersonaGrouped | null>(null);
  const [loadingPersona, setLoadingPersona] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New preference modal/form state
  const [newCategory, setNewCategory] = useState("general");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const loadPersona = async () => {
    setLoadingPersona(true);
    try {
      setError(null);
      const data = await api.getPersona();
      setPersona(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load persona");
    } finally {
      setLoadingPersona(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPersona();
    }
  }, [user]);

  const handleAddPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    setSaving(true);
    setError(null);
    try {
      let parsedValue: unknown = newValue;
      if (newValue.toLowerCase() === "true") parsedValue = true;
      else if (newValue.toLowerCase() === "false") parsedValue = false;
      else if (!isNaN(Number(newValue)) && newValue.trim() !== "") parsedValue = Number(newValue);

      await api.createPreference(newCategory, newKey.trim(), parsedValue);
      setNewKey("");
      setNewValue("");
      loadPersona();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save preference");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deletePreference(id);
      loadPersona();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete preference");
    }
  };

  const handleStartEdit = (p: PersonaPreference) => {
    setEditingId(p.id);
    setEditValue(typeof p.value === "object" ? JSON.stringify(p.value) : String(p.value));
  };

  const handleSaveEdit = async (id: string) => {
    try {
      let parsed: unknown = editValue;
      if (editValue.toLowerCase() === "true") parsed = true;
      else if (editValue.toLowerCase() === "false") parsed = false;
      else if (!isNaN(Number(editValue)) && editValue.trim() !== "") parsed = Number(editValue);

      await api.updatePreference(id, parsed);
      setEditingId(null);
      loadPersona();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update preference");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading session...</div>
      </div>
    );
  }

  const categoryIcons: Record<string, string> = {
    general: "⚙️",
    word: "📄",
    excel: "📊",
    powerpoint: "📑",
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Persona Settings & Preferences</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure persistent personal defaults used across all conversations.
        </p>
      </div>

      {/* Precedence Notice Alert */}
      <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/30 p-4 text-xs text-indigo-200">
        <div className="font-semibold text-indigo-300 mb-1">💡 Precedence & Memory Rule</div>
        Preferences here serve as durable cross-session defaults. When generating a document, any one-time instruction
        given in your prompt (e.g. &ldquo;without charts for this run&rdquo;) takes priority for that output without overwriting your saved settings.
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Add New Preference Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-md backdrop-blur-sm">
        <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-4">
          + Add or Update Preference
        </h2>
        <form onSubmit={handleAddPreference} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Category</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:outline-none"
            >
              <option value="general">General</option>
              <option value="excel">Excel (.xlsx)</option>
              <option value="word">Word (.docx)</option>
              <option value="powerpoint">PowerPoint (.pptx)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Key (e.g. tone, charts)</label>
            <input
              type="text"
              required
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="include_charts"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Value (e.g. true, concise)</label>
            <input
              type="text"
              required
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="true"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preference"}
          </button>
        </form>
      </div>

      {/* Grouped Preferences Display */}
      {loadingPersona ? (
        <div className="text-xs text-zinc-400">Loading persona preferences...</div>
      ) : persona && persona.items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-3">
          <div className="text-3xl">🧩</div>
          <h3 className="text-sm font-semibold text-zinc-300">No Persona Preferences Yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You can either add explicit preferences above, or simply instruct the assistant in chat: &ldquo;Always use concise business documents.&rdquo;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {["general", "excel", "word", "powerpoint"].map((cat) => {
            const items = persona?.items.filter((p) => p.category.toLowerCase() === cat) || [];
            return (
              <div
                key={cat}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span>{categoryIcons[cat]}</span>
                    <h3 className="text-sm font-bold text-zinc-100 capitalize">{cat} Defaults</h3>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{items.length} rules</span>
                </div>

                {items.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 italic">No custom rules configured</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((p) => {
                      const isEditing = editingId === p.id;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-850 text-xs"
                        >
                          <div className="flex-1 pr-3">
                            <span className="font-mono text-indigo-300 font-semibold">{p.key}</span>
                            <div className="mt-1">
                              {isEditing ? (
                                <div className="flex items-center gap-2 mt-1">
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(p.id)}
                                    className="text-xs text-emerald-400 hover:underline"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="text-xs text-zinc-500 hover:underline"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <span className="text-zinc-300 font-mono">
                                  {typeof p.value === "object" ? JSON.stringify(p.value) : String(p.value)}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 inline-block">
                              source: {p.source}
                            </span>
                          </div>

                          {!isEditing && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStartEdit(p)}
                                className="px-2 py-1 rounded text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="px-2 py-1 rounded text-[11px] text-rose-400 hover:bg-rose-950/60"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

