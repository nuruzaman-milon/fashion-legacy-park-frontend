"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircleIcon, SendIcon, XIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getChatUnreadCount,
  getMyThread,
  sendChatMessage,
  type ChatMessage,
} from "@/lib/api/chat";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const OPEN_POLL_MS = 4_000;
const CLOSED_POLL_MS = 30_000;

/** A bubble that exists locally before (or instead of) the server's copy. */
type LocalMessage = ChatMessage & { pending?: boolean };

/**
 * The storefront's floating support chat. Polling by design: a fast tick
 * while the panel is open, a slow unread-count tick while it is closed —
 * the shapes stay transport-agnostic for a future socket upgrade.
 */
export function ChatWidget() {
  const { status } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<LocalMessage[] | null>(null);
  const [unread, setUnread] = React.useState(0);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const lastAtRef = React.useRef<string | undefined>(undefined);

  const authenticated = status === "authenticated";

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

  // Open panel: initial full fetch, then the fast poll for new messages.
  React.useEffect(() => {
    if (!open || !authenticated) return;
    let cancelled = false;

    getMyThread()
      .then((thread) => {
        if (cancelled) return;
        setMessages(thread.messages);
        lastAtRef.current =
          thread.messages[thread.messages.length - 1]?.createdAt;
        setUnread(0);
        scrollToEnd();
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });

    const handle = setInterval(() => {
      getMyThread(lastAtRef.current)
        .then((thread) => {
          if (!cancelled) {
            appendNew(thread.messages);
            setUnread(0);
          }
        })
        .catch(() => {
          // A missed poll self-heals on the next tick.
        });
    }, OPEN_POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [open, authenticated, appendNew, scrollToEnd]);

  // Closed panel: slow badge poll.
  React.useEffect(() => {
    if (open || !authenticated) return;
    let cancelled = false;
    const tick = () => {
      getChatUnreadCount()
        .then((count) => {
          if (!cancelled) setUnread(count);
        })
        .catch(() => {});
    };
    tick();
    const handle = setInterval(tick, CLOSED_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [open, authenticated]);

  function send() {
    const body = draft.trim();
    if (!body) return;

    // Optimistic: the bubble lands the instant they hit send; the API call
    // trails behind. The poll cursor is NOT advanced here — the temp
    // timestamp is client clock and could skip real server messages.
    const temp: LocalMessage = {
      id: `temp-${crypto.randomUUID()}`,
      body,
      isStaff: false,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: { id: "me", name: "You" },
      pending: true,
    };
    setDraft("");
    setError(null);
    setMessages((prev) => [...(prev ?? []), temp]);
    scrollToEnd();

    sendChatMessage(body)
      .then((real) => {
        setMessages((prev) => {
          if (!prev) return prev;
          const withoutTemp = prev.filter((m) => m.id !== temp.id);
          // A poll may have delivered the server copy already.
          if (withoutTemp.some((m) => m.id === real.id)) return withoutTemp;
          return [...withoutTemp, real];
        });
        if (!lastAtRef.current || real.createdAt > lastAtRef.current) {
          lastAtRef.current = real.createdAt;
        }
      })
      .catch((err) => {
        // Take the bubble back and hand them their words — never lose input.
        setMessages((prev) => prev?.filter((m) => m.id !== temp.id) ?? prev);
        setDraft(body);
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not send — please try again.",
        );
      });
  }

  // The admin panel has its own inbox; a second widget there is noise.
  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <div className="flex h-[26rem] w-[calc(100vw-2rem)] max-w-80 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center gap-2.5 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <MessageCircleIcon className="size-4" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Fashion Legacy Support</p>
              <p className="text-[11px] opacity-80">
                We usually reply within a few hours
              </p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 transition-opacity hover:opacity-70"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          {!authenticated ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <MessageCircleIcon className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Sign in to chat with us about your orders.
              </p>
              <Button
                size="sm"
                render={
                  <Link
                    href={`/login?next=${encodeURIComponent(pathname)}`}
                    // The panel must not sit on top of the login form it
                    // just sent the user to.
                    onClick={() => setOpen(false)}
                  />
                }
              >
                Sign in
              </Button>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3"
              >
                {messages === null && (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Loading…
                  </p>
                )}
                {messages?.length === 0 && (
                  <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                    Ask us anything — sizes, delivery, your order status.
                  </p>
                )}
                {messages?.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      message.isStaff
                        ? "mr-auto rounded-bl-sm bg-muted"
                        : "ml-auto rounded-br-sm bg-primary text-primary-foreground",
                      message.pending && "opacity-60",
                    )}
                  >
                    {message.body}
                  </div>
                ))}
              </div>

              {error && (
                <p className="border-t border-border px-3 py-1.5 text-xs text-destructive">
                  {error}
                </p>
              )}

              <form
                className="flex items-center gap-2 border-t border-border p-2.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <Input
                  aria-label="Message"
                  placeholder="Write a message…"
                  className="h-9 flex-1"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon-sm"
                  aria-label="Send message"
                  disabled={draft.trim() === ""}
                >
                  <SendIcon className="size-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        aria-label={open ? "Close support chat" : "Open support chat"}
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? (
          <XIcon className="size-5" />
        ) : (
          <MessageCircleIcon className="size-5" />
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-brand-foreground tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
