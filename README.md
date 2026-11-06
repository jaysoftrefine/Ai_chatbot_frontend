# Productivity Assistant — Next.js Web Frontend

Modern web frontend for the AI Personal Productivity Assistant, built with Next.js (App Router), React 19, and Tailwind CSS. It connects to the FastAPI backend to deliver a chat interface, Office document creation workflows, knowledge base file management, persona customization, and integration diagnostics.

---

## Features

- **Interactive AI Chat:**
  - Responsive multi-turn chat interface with Markdown rendering via `react-markdown`.
  - Intent classification display and clarification prompts.
  - Sidebar for conversation management (switching, creating new sessions, and deleting past chats).
- **Generated Document Cards:**
  - Rich visual cards for generated Office files (Excel `.xlsx`, Word `.docx`, PowerPoint `.pptx`).
  - Displays file metadata, MIME type, file size, SHA256 checksum verification, and instant download trigger.
- **Knowledge Base & RAG Management (`/files`):**
  - Upload documents (PDF, TXT, Markdown, Office documents) for user-scoped indexing.
  - View indexed document chunks, file details, and management tools.
- **Persona Customization (`/persona`):**
  - Manage durable AI persona settings across categories: `general`, `word`, `excel`, and `powerpoint`.
  - Configure preferences such as color palettes, font families, document layout, and communication tone.
- **Integrations Dashboard (`/integrations`):**
  - Real-time diagnostic view for Google Docs MCP and Microsoft MCP / Graph API.
  - Displays connection health, active transports, discovered tool catalogs, and fallback indicators.
- **Authentication & Session Handling (`/login`, `/register`):**
  - Secure credential-based login and registration.
  - Automatic silent JWT refresh token rotation with local storage persistence and cookie support.

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Library:** [React 19](https://react.dev)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4
- **Markdown & UI Utilities:** `react-markdown`, SVG/Lucide icons
- **Code Quality:** ESLint 9 (`eslint-config-next`)

---

## Project Structure

```text
frontend/
├── public/                 # Static assets and icons
├── src/
│   ├── app/
│   │   ├── (auth)/         # Unauthenticated route group
│   │   │   ├── login/      # User sign-in page
│   │   │   └── register/   # User registration page
│   │   ├── files/          # Knowledge base document upload & file manager
│   │   ├── integrations/   # MCP & cloud integration status dashboard
│   │   ├── persona/        # User persona preference settings
│   │   ├── globals.css     # Tailwind CSS entry point and theme variables
│   │   ├── layout.tsx      # Root application layout with navigation & auth provider
│   │   └── page.tsx        # Main AI chat interface and conversation history
│   ├── components/
│   │   ├── chat/           # Chat-specific components (e.g., DocumentCard)
│   │   └── layout/         # Shared UI shell (Navbar, header navigation)
│   └── lib/
│       ├── api-client.ts   # Authenticated API client with automatic token refresh
│       ├── api.ts          # Base API utilities and backend health check
│       ├── auth-context.tsx# React context provider for user authentication state
│       └── types.ts        # TypeScript interface definitions (User, Message, File, Persona, etc.)
├── Dockerfile              # Multi-stage production container build
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and run scripts
└── tsconfig.json           # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- Node.js 20 or newer (Node.js 22 recommended)
- npm, pnpm, yarn, or bun
- Running backend service (default: `http://localhost:8000`)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a local environment file from `.env.example`:

```bash
cp .env.example .env.local
```

Configure the backend API URL:

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL pointing to the running FastAPI backend |

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

In the `frontend/` directory, you can run:

- `npm run dev`: Starts the Next.js development server with hot-reloading at `http://localhost:3000`.
- `npm run build`: Compiles and builds the production bundle.
- `npm run start`: Starts the Next.js production server (requires `npm run build` first).
- `npm run lint`: Runs ESLint across all TypeScript and React source files.

---

## Application Routes

- `/` — Main conversation interface, chat composer, and generated document viewer.
- `/login` — Account sign-in.
- `/register` — Account registration.
- `/files` — Knowledge base manager for RAG document ingestion and file downloads.
- `/persona` — Persona and document styling preferences editor.
- `/integrations` — Integrations monitor (Google Docs MCP & Microsoft MCP / Graph).

---

## Docker

Build and run the frontend standalone with Docker:

```bash
docker build -t assistant-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL="http://host.docker.internal:8000" assistant-frontend
```
