import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Personal Productivity Assistant",
  description: "Personal AI assistant for conversation, persona memory, and Office document generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-dvh flex flex-col bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 min-h-0 flex flex-col overflow-y-auto">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
