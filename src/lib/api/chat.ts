import { apiFetch } from "./client";
import type { Paginated } from "@/types/admin";

/**
 * Support chat (`/chat` + `/admin/chats`, bearer). Polling-based on purpose
 * — the API is transport-agnostic, so a future socket upgrade only replaces
 * how updates arrive, not these shapes. Fetching a thread marks the other
 * side's messages as read server-side.
 */

export interface ChatMessage {
  id: string;
  body: string;
  isStaff: boolean;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string };
}

export type ConversationStatus = "OPEN" | "CLOSED";

// ---- customer -------------------------------------------------------------

export interface MyThread {
  conversationId: string | null;
  status: ConversationStatus | null;
  messages: ChatMessage[];
}

/** `after` = createdAt of the newest message already shown (poll cursor). */
export async function getMyThread(after?: string): Promise<MyThread> {
  const qs = after ? `?after=${encodeURIComponent(after)}` : "";
  return apiFetch<MyThread>(`/chat${qs}`);
}

export async function getChatUnreadCount(): Promise<number> {
  const { count } = await apiFetch<{ count: number }>("/chat/unread-count");
  return count;
}

export async function sendChatMessage(body: string): Promise<ChatMessage> {
  return apiFetch<ChatMessage>("/chat/messages", {
    method: "POST",
    body: { body },
  });
}

// ---- admin ----------------------------------------------------------------

export interface AdminConversation {
  id: string;
  status: ConversationStatus;
  lastMessageAt: string;
  customer: { id: string; name: string; email: string; avatar: string | null };
  lastMessage: { body: string; isStaff: boolean; createdAt: string } | null;
  unreadCount: number;
}

export interface AdminThread {
  id: string;
  status: ConversationStatus;
  customer: { id: string; name: string; email: string; avatar: string | null };
  messages: ChatMessage[];
}

export async function listConversations(): Promise<
  Paginated<AdminConversation>
> {
  return apiFetch<Paginated<AdminConversation>>("/admin/chats?limit=50");
}

export async function getAdminThread(
  id: string,
  after?: string,
): Promise<AdminThread> {
  const qs = after ? `?after=${encodeURIComponent(after)}` : "";
  return apiFetch<AdminThread>(`/admin/chats/${id}${qs}`);
}

export async function sendAdminChatMessage(
  id: string,
  body: string,
): Promise<ChatMessage> {
  return apiFetch<ChatMessage>(`/admin/chats/${id}/messages`, {
    method: "POST",
    body: { body },
  });
}

export async function closeConversation(id: string): Promise<void> {
  await apiFetch(`/admin/chats/${id}/close`, { method: "PATCH" });
}
