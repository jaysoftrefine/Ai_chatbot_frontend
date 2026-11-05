"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Conversation, Message, GeneratedFile } from "@/lib/types";
import DocumentCard from "@/components/chat/DocumentCard";
import ReactMarkdown from "react-markdown";

interface ChatMessage extends Message {
  file?: GeneratedFile;
}

export default function ChatPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Load conversations list
  const loadConversations = async () => {
    try {
      const list = await api.listConversations();
      setConversations(list);
      if (list.length > 0 && !activeConvId) {
        setActiveConvId(list[0].id);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load active conversation messages
  const loadConversationMessages = async (id: string) => {
    try {
      setError(null);
      const detail = await api.getConversation(id);
      setMessages(detail.messages);
      setSummary(detail.summary || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    }
  };

  useEffect(() => {
    if (activeConvId) {
      loadConversationMessages(activeConvId);
    } else {
      setMessages([]);
      setSummary(null);
    }
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (customText?: string) => {
    const fileToUpload = attachedFile;
    let textToSend = customText || input;

    if (!textToSend.trim() && !fileToUpload) return;
    if (isSending) return;

    if (!textToSend.trim() && fileToUpload) {
      textToSend = `I uploaded "${fileToUpload.name}". Please summarize its key contents and let me know how you can help me with it.`;
    }

    setError(null);
    setAttachedFile(null);
    if (!customText) setInput("");
    setIsSending(true);

    try {
      if (fileToUpload) {
        setUploadStatus(`Indexing "${fileToUpload.name}" into RAG memory...`);
        await api.uploadFile(fileToUpload);
        setUploadStatus(null);
      }

      const displayContent = fileToUpload
        ? `📎 Attached & Indexed: **${fileToUpload.name}**\n\n${textToSend}`
        : textToSend;

      const tempUserMsg: ChatMessage = {
        id: "temp-" + Date.now(),
        role: "user",
        content: displayContent,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg]);

      const promptForAssistant = fileToUpload
        ? `[User attached document "${fileToUpload.name}"]\n${textToSend}`
        : textToSend;

      const res = await api.sendMessage(promptForAssistant, activeConvId || undefined);

      const asstMsg: ChatMessage = {
        id: "asst-" + Date.now(),
        role: "assistant",
        content: res.assistant_message,
        intent: res.intent,
        created_at: new Date().toISOString(),
        file: res.file,
      };

      setMessages((prev) => [...prev, asstMsg]);

      // If this was a new conversation, update active and list
      if (!activeConvId || activeConvId !== res.conversation_id) {
        setActiveConvId(res.conversation_id);
        loadConversations();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error sending message");
    } finally {
      setIsSending(false);
      setUploadStatus(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setSummary(null);
    setError(null);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
        setSummary(null);
      }
    } catch {
      // ignore
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading session...</div>
      </div>
    );
  }

  const promptSuggestions = [
    { label: "📊 Expense Tracker (Excel)", prompt: "Create an Excel monthly expense tracker with category totals." },
    { label: "📄 Project Proposal (Word)", prompt: "Prepare a detailed project proposal for an AI chatbot." },
    { label: "📑 AI Agents Deck (PowerPoint)", prompt: "Create a 7-slide presentation about AI agents." },
    { label: "💬 Explain FastAPI vs Django", prompt: "Explain the difference between FastAPI and Django." },
  ];

  return (
    <div className="flex-1 min-h-0 flex h-full overflow-hidden">
      {/* Sidebar: Conversations */}
      <aside className="w-64 sm:w-72 bg-zinc-900/60 border-r border-zinc-800 flex flex-col h-full shrink-0">
        <div className="p-3 border-b border-zinc-800 shrink-0">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <span>+</span> New Conversation
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500">No conversations yet</div>
          ) : (
            conversations.map((c) => {
              const active = c.id === activeConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    active ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
                  }`}
                >
                  <span className="truncate flex-1 pr-2">{c.title || "Untitled"}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(e, c.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-opacity"
                    title="Delete conversation"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 min-h-0 flex flex-col bg-zinc-950 h-full overflow-hidden">
        {summary && (
          <div className="shrink-0 px-6 py-2 bg-zinc-900/50 border-b border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
            <span className="font-semibold text-zinc-300">Session Context:</span>
            <span className="truncate">{summary}</span>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shadow">
                ⚡
              </div>
              <h2 className="text-lg font-bold text-zinc-200">Personal Productivity Assistant</h2>
              <p className="text-xs text-zinc-400">
                Ask questions conversationally, request downloadable Office documents (.xlsx, .docx, .pptx), or configure durable preferences.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-4">
                {promptSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(s.prompt)}
                    className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-left text-xs text-zinc-300 hover:text-white transition-all shadow-sm"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-2xl rounded-2xl p-4 ${
                    isUser
                      ? "bg-indigo-600 text-white shadow-md rounded-br-sm"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-md rounded-bl-sm"
                  }`}>
                    {!isUser && m.intent && m.intent !== "conversation" && (
                      <div className="mb-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          m.intent === "generate_document"
                            ? "bg-emerald-950/70 border-emerald-800 text-emerald-400"
                            : m.intent === "clarification"
                            ? "bg-amber-950/70 border-amber-800 text-amber-400"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400"
                        }`}>
                          Intent: {m.intent}
                        </span>
                      </div>
                    )}
                    {isUser ? (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    ) : (
                      <div className="text-sm leading-relaxed text-zinc-100">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            ol: ({ children }) => <ol className="list-decimal list-outside ml-5 space-y-1 my-2">{children}</ol>,
                            ul: ({ children }) => <ul className="list-disc list-outside ml-5 space-y-1 my-2">{children}</ul>,
                            li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
                            code: ({ className, children, ...props }) => {
                              const isInline = !className?.includes("language-") && typeof children === "string" && !children.includes("\n");
                              return isInline ? (
                                <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-indigo-300" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <code className="block overflow-x-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-200 border border-zinc-800 my-2" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">
                                {children}
                              </a>
                            ),
                            h1: ({ children }) => <h1 className="text-lg font-bold text-white my-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold text-white my-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold text-white my-1.5">{children}</h3>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-indigo-500 pl-3 italic text-zinc-400 my-2">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Attached Generated File */}
                    {m.file && <DocumentCard file={m.file} />}
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-md flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-75"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-150"></span>
                <span className="text-xs text-zinc-400 ml-2">
                  {uploadStatus || "Assistant is thinking..."}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="shrink-0 p-4 border-t border-zinc-800 bg-zinc-900/40">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-xl border border-zinc-700/80 bg-zinc-950 shadow-inner focus-within:border-indigo-500">
              {/* Attached file preview chip */}
              {attachedFile && (
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/90 border-b border-zinc-800 text-xs rounded-t-xl">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="text-indigo-400">📎</span>
                    <span className="font-medium text-zinc-200 truncate">{attachedFile.name}</span>
                    <span className="text-zinc-500 text-[10px]">
                      ({(attachedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-950/80 border border-indigo-800 text-indigo-300">
                      RAG Ready
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="text-zinc-400 hover:text-zinc-100 p-1 rounded text-xs ml-2"
                    title="Remove attachment"
                  >
                    ✕
                  </button>
                </div>
              )}

              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  attachedFile
                    ? `Ask anything about "${attachedFile.name}" or leave empty to summarize...`
                    : "Ask a question or request an Office document (Excel, Word, PowerPoint)..."
                }
                className="w-full resize-none bg-transparent px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-850">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 transition-colors border border-transparent hover:border-zinc-700 disabled:opacity-40"
                    title="Attach document to chat & index into RAG"
                  >
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="font-medium">Attach File</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setAttachedFile(f);
                      e.target.value = "";
                    }}
                    className="hidden"
                    accept=".pdf,.docx,.pptx,.xlsx,.txt,.md,.csv,.json"
                  />
                  <span className="text-[11px] text-zinc-500 hidden sm:inline">
                    <span className="font-mono">Enter</span> to send, <span className="font-mono">Shift+Enter</span> for newline
                  </span>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={(!input.trim() && !attachedFile) || isSending}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
