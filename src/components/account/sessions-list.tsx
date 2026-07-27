"use client";

import * as React from "react";
import {
  MonitorIcon,
  SmartphoneIcon,
} from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessions, logoutAll, revokeSession } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { formatRelativeTime } from "@/lib/format";
import type { SessionInfo } from "@/types/auth";

function describeAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("OPR/")
      ? "Opera"
      : ua.includes("Chrome/")
        ? "Chrome"
        : ua.includes("Firefox/")
          ? "Firefox"
          : ua.includes("Safari/")
            ? "Safari"
            : "Browser";
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Android")
      ? "Android"
      : ua.includes("iPhone") || ua.includes("iPad")
        ? "iOS"
        : ua.includes("Mac OS")
          ? "macOS"
          : ua.includes("Linux")
            ? "Linux"
            : "";
  return os ? `${browser} · ${os}` : browser;
}

function isMobile(ua: string | null): boolean {
  return !!ua && /Android|iPhone|iPad|Mobile/.test(ua);
}

export function SessionsList() {
  const [sessions, setSessions] = React.useState<SessionInfo[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getSessions()
      .then((list) => {
        if (!cancelled) setSessions(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load your sessions. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function revoke(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await revokeSession(id);
      setSessions((list) => list?.filter((s) => s.id !== id) ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not sign that device out. Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function signOutEverywhere() {
    setLoggingOutAll(true);
    setError(null);
    try {
      // Revokes every refresh token and clears this tab's session — the
      // account guard then routes back to login.
      await logoutAll();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not sign out everywhere. Please try again.",
      );
      setLoggingOutAll(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signed-in devices</CardTitle>
        <CardDescription>
          Every device with an active session on your account. Not you? Sign
          it out.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <FormAlert className="mb-4">{error}</FormAlert>}

        {sessions === null && !error && (
          <div className="flex min-h-24 items-center justify-center">
            <div
              aria-label="Loading"
              className="size-5 animate-spin rounded-full border-2 border-brand border-t-transparent"
            />
          </div>
        )}

        {sessions !== null && (
          <ul className="divide-y divide-border">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  {isMobile(session.userAgent) ? (
                    <SmartphoneIcon className="size-4" />
                  ) : (
                    <MonitorIcon className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {describeAgent(session.userAgent)}
                    {session.isCurrent && <Badge>This device</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.ipAddress ?? "Unknown IP"} · signed in{" "}
                    {formatRelativeTime(session.createdAt)}
                  </p>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === session.id}
                    onClick={() => void revoke(session.id)}
                  >
                    {busyId === session.id ? "Signing out…" : "Sign out"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {sessions !== null && sessions.length > 1 && (
          <Button
            variant="outline"
            className="mt-4 w-full text-destructive hover:text-destructive"
            disabled={loggingOutAll}
            onClick={() => void signOutEverywhere()}
          >
            {loggingOutAll ? "Signing out…" : "Sign out of every device"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
