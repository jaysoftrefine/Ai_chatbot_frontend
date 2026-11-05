export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

export interface GeneratedFile {
  id: string;
  file_name: string;
  format: "excel" | "word" | "powerpoint" | string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  download_url: string;
  status: string;
  created_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  intent?: string;
  created_at: string;
  metadata?: {
    file_id?: string;
    format?: string;
    [key: string]: unknown;
  };
  file?: GeneratedFile;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
  summary?: string;
}

export interface ChatResponse {
  conversation_id: string;
  assistant_message: string;
  intent: string;
  clarification_required: boolean;
  file?: GeneratedFile;
}

export interface PersonaPreference {
  id: string;
  category: "general" | "word" | "excel" | "powerpoint" | string;
  key: string;
  value: unknown;
  source: string;
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface PersonaGrouped {
  general: Record<string, unknown>;
  word: Record<string, unknown>;
  excel: Record<string, unknown>;
  powerpoint: Record<string, unknown>;
  items: PersonaPreference[];
}

export interface DiscoveredTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  read_only?: boolean;
}

export interface MicrosoftStatus {
  enabled: boolean;
  transport: string;
  server_url?: string;
  authenticated: boolean;
  connected: boolean;
  discovered_tools: DiscoveredTool[];
  format_support: {
    excel: boolean;
    word: boolean;
    powerpoint: boolean;
  };
  error?: string;
  fallback_active: boolean;
}

export interface GoogleDocsStatus {
  enabled: boolean;
  server_url: string;
  transport: string;
  connected: boolean;
  authenticated: boolean;
  discovered_tools: DiscoveredTool[];
  capabilities: {
    read_doc: boolean;
    update_doc: boolean;
  };
  preview_program_required: boolean;
  error?: string;
}
