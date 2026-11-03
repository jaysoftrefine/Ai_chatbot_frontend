import {
  ChatResponse,
  Conversation,
  ConversationDetail,
  GeneratedFile,
  MicrosoftStatus,
  PersonaGrouped,
  PersonaPreference,
  User,
} from "./types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
      credentials: "include",
    });

    if (res.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      let errDetail = `${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        if (body.detail) {
          errDetail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
        }
      } catch {
        // ignore json parse error
      }
      throw new Error(errDetail);
    }

    if (res.status === 204) {
      return null as unknown as T;
    }

    return res.json();
  }

  // Auth
  async register(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const data = await this.request<{ access_token: string; user: User }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (typeof window !== "undefined" && data.access_token) {
      localStorage.setItem("token", data.access_token);
    }
    return data;
  }

  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const data = await this.request<{ access_token: string; user: User }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (typeof window !== "undefined" && data.access_token) {
      localStorage.setItem("token", data.access_token);
    }
    return data;
  }

  async logout(): Promise<void> {
    try {
      await this.request("/api/v1/auth/logout", { method: "POST" });
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    }
  }

  async getMe(): Promise<User> {
    return this.request<User>("/api/v1/auth/me");
  }

  // Chat
  async sendMessage(message: string, conversationId?: string): Promise<ChatResponse> {
    return this.request<ChatResponse>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        conversation_id: conversationId || null,
      }),
    });
  }

  async listConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>("/api/v1/conversations");
  }

  async getConversation(id: string): Promise<ConversationDetail> {
    return this.request<ConversationDetail>(`/api/v1/conversations/${id}`);
  }

  async deleteConversation(id: string): Promise<void> {
    return this.request<void>(`/api/v1/conversations/${id}`, {
      method: "DELETE",
    });
  }

  // Persona
  async getPersona(): Promise<PersonaGrouped> {
    return this.request<PersonaGrouped>("/api/v1/persona");
  }

  async createPreference(
    category: string,
    key: string,
    value: unknown,
    confidence = 1.0
  ): Promise<PersonaPreference> {
    return this.request<PersonaPreference>("/api/v1/persona/preferences", {
      method: "POST",
      body: JSON.stringify({ category, key, value, confidence }),
    });
  }

  async updatePreference(id: string, value: unknown): Promise<PersonaPreference> {
    return this.request<PersonaPreference>(`/api/v1/persona/preferences/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ value }),
    });
  }

  async deletePreference(id: string): Promise<void> {
    return this.request<void>(`/api/v1/persona/preferences/${id}`, {
      method: "DELETE",
    });
  }

  // Files
  async listFiles(): Promise<GeneratedFile[]> {
    return this.request<GeneratedFile[]>("/api/v1/files");
  }

  getFileDownloadUrl(fileId: string): string {
    return `${API_BASE_URL}/api/v1/files/${fileId}/download`;
  }

  async downloadFileBlob(fileId: string, filename: string): Promise<void> {
    const url = this.getFileDownloadUrl(fileId);
    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    const res = await fetch(url, {
      credentials: "include",
      headers,
    });
    if (!res.ok) {
      throw new Error(`Download failed: ${res.statusText}`);
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  }

  // Microsoft Status
  async getMicrosoftStatus(): Promise<MicrosoftStatus> {
    return this.request<MicrosoftStatus>("/api/v1/integrations/microsoft/status");
  }
}

export const api = new ApiClient();

