"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArchiveIcon,
  ArrowLeftIcon,
  MessageCircleIcon,
  SendIcon,
} from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  closeConversation,
  getAdminThread,
  listConversations,
  sendAdminChatMessage,
  type AdminConversation,
  type ChatMessage,
} from "@/lib/api/chat";
import { ApiError } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const LIST_POLL_MS = 10_000;
const THREAD_POLL_MS = 4_000;

/** A bubble that exists locally before (or instead of) the server's copy. */
type LocalMessage = ChatMessage & { pending?: boolean };

/**
 * Two-pane support inbox: conversations on the left (10s poll), the open
 * thread on the right (4s poll). Opening a thread marks the customer's
 * messages read server-side. On small screens the panes swap with a back
 * button instead of sharing the row.
 */
export function ChatInbox() {
  const [conversations, setConversations] = React.useState<
    AdminConversation[] | null
  >(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const loadList = React.useCallback(() => {
    return listConversations()
      .then(({ items }) => {
        setConversations(items);
        setError(null);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load conversations. Please try again.",
        );
      });
  }, []);

  React.useEffect(() => {
    void loadList();
    const handle = setInterval(() => void loadList(), LIST_POLL_MS);
    return () => clearInterval(handle);
  }, [loadList]);

  const selected = conversations?.find((c) => c.id === selectedId) ?? null;

  if (error && conversations === null) {
    return (
      <div className="space-y-3">
        <FormAlert>{error}</FormAlert>
        <Button variant="outline" size="sm" onClick={() => void loadList()}>
          Try again
        </Button>
      </div>
    );
  }
  if (conversations === null) {
    return <Skeleton className="h-[32rem] w-full rounded-xl" />;
  }

  return (
    <div className="grid min-h-[32rem] items-start gap-4 md:grid-cols-[300px_1fr]">
      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-card",
          selectedId && "hidden md:block",
        )}
      >
        {conversations.length === 0 && (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <MessageCircleIcon className="size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No conversations yet — customer messages land here.
            </p>
          </div>
        )}
        <ul className="divide-y divide-border">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(conversation.id);
                  // The unread badge clears optimistically — opening the
                  // thread marks the rows read server-side.
                  setConversations(
                    (prev) =>
                      prev?.map((c) =>
                        c.id === conversation.id ? { ...c, unreadCount: 0 } : c,
                      ) ?? prev,
                  );
                }}
                className={cn(
                  "flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors hover:bg-accent/50",
                  selectedId === conversation.id && "bg-accent/60",
                )}
              >
                {conversation.customer.avatar ? (
                  <Image
                    src={conversation.customer.avatar}
                    alt=""
                    width={36}
                    height={36}
                    className="size-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                    {conversation.customer.name[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-sm",
                        conversation.unreadCount > 0
                          ? "font-semibold"
                          : "font-medium",
                      )}
                    >
                      {conversation.customer.name}
                    </span>
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(conversation.lastMessageAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {conversation.lastMessage
                        ? `${conversation.lastMessage.isStaff ? "You: " : ""}${conversation.lastMessage.body}`
                        : "—"}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-auto flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground tabular-nums">
                        {conversation.unreadCount}
                      </span>
                    )}
                    {conversation.status === "CLOSED" && (
                      <Badge
                        variant="outline"
                        className="ml-auto shrink-0 text-[10px] text-muted-foreground"
                      >
                        Closed
                      </Badge>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={cn(!selectedId && "hidden md:block")}>
        {selected ? (
          <ChatThread
            key={selected.id}
            conversation={selected}
            onBack={() => setSelectedId(null)}
            onChanged={loadList}
          />
        ) : (
          <div className="flex h-[32rem] flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <MessageCircleIcon className="size-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Pick a conversation to read and reply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatThread({
  conversation,
  onBack,
  onChanged,
}: {
  conversation: AdminConversation;
  onBack: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const [messages, setMessages] = React.useState<LocalMessage[] | null>(null);
  const [status, setStatus] = React.useState(conversation.status);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const lastAtRef = React.useRef<string | undefined>(undefined);

  const scrollToEnd = React.useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }, []);

  const appendNew = React.useCallback(
    (incoming: ChatMessage[]) => {
      if (incoming.length === 0) return;
      setMessages((prev) => {
        const seen = new Set((prev ?? []).map((m) => m.id));
        const fresh = incoming.filter((m) => !seen.has(m.id));
        if (fresh.length === 0) return prev ?? [];
        return [...(prev ?? []), ...fresh];
      });
      lastAtRef.current = incoming[incoming.length - 1].createdAt;
      scrollToEnd();
    },
    [scrollToEnd],
  );

  React.useEffect(() => {
    let cancelled = false;

    getAdminThread(conversation.id)
      .then((thread) => {
        if (cancelled) return;
        setMessages(thread.messages);
        setStatus(thread.status);
        lastAtRef.current =
          thread.messages[thread.messages.length - 1]?.createdAt;
        scrollToEnd();
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });

    const handle = setInterval(() => {
      getAdminThread(conversation.id, lastAtRef.current)
        .then((thread) => {
          if (!cancelled) {
            appendNew(thread.messages);
            setStatus(thread.status);
          }
        })
        .catch(() => {});
    }, THREAD_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [conversation.id, appendNew, scrollToEnd]);

  function send() {
    const body = draft.trim();
    if (!body) return;

    // Optimistic: the bubble shows instantly, the API trails behind. The
    // poll cursor is not advanced from the temp's client-clock timestamp.
    const temp: LocalMessage = {
      id: `temp-${crypto.randomUUID()}`,
      body,
      isStaff: true,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: { id: "me", name: "You" },
      pending: true,
    };
    setDraft("");
    setError(null);
    setMessages((prev) => [...(prev ?? []), temp]);
    scrollToEnd();

    sendAdminChatMessage(conversation.id, body)
      .then(async (real) => {
        setMessages((prev) => {
          if (!prev) return prev;
          const withoutTemp = prev.filter((m) => m.id !== temp.id);
          if (withoutTemp.some((m) => m.id === real.id)) return withoutTemp;
          return [...withoutTemp, real];
        });
        if (!lastAtRef.current || real.createdAt > lastAtRef.current) {
          lastAtRef.current = real.createdAt;
        }
        await onChanged();
      })
      .catch((err) => {
        setMessages((prev) => prev?.filter((m) => m.id !== temp.id) ?? prev);
        setDraft(body);
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not send — please try again.",
        );
      });
  }

  async function close() {
    setError(null);
    try {
      await closeConversation(conversation.id);
      setStatus("CLOSED");
      await onChanged();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not close the chat.",
      );
    }
  }

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to conversations"
          className="md:hidden"
          onClick={onBack}
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {conversation.customer.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {conversation.customer.email}
          </p>
        </div>
        {status === "CLOSED" ? (
          <Badge variant="outline" className="text-muted-foreground">
            Closed
          </Badge>
        ) : (
          <Button variant="outline" size="sm" onClick={() => void close()}>
            <ArchiveIcon data-icon="inline-start" />
            Close chat
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {messages === null && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Loading…
          </p>
        )}
        {messages?.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
              message.isStaff
                ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                : "mr-auto rounded-bl-sm bg-muted",
              message.pending && "opacity-60",
            )}
          >
            {message.body}
            <span
              className={cn(
                "mt-0.5 block text-[10px]",
                message.isStaff
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground",
              )}
            >
              {formatRelativeTime(message.createdAt)}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <p className="border-t border-border px-4 py-1.5 text-xs text-destructive">
          {error}
        </p>
      )}

      <form
        className="flex items-center gap-2 border-t border-border p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <Input
          aria-label="Reply"
          placeholder={
            status === "CLOSED"
              ? "Replying reopens nothing — the customer must write first"
              : "Write a reply…"
          }
          className="h-9 flex-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button
          type="submit"
          size="icon-sm"
          aria-label="Send reply"
          disabled={draft.trim() === ""}
        >
          <SendIcon className="size-4" />
        </Button>
      </form>
    </div>
  );
}
