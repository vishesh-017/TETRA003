import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { getStore, subscribeStore, updateStore } from "@/data/store";
import { cn } from "@/lib/utils";

function inboxHref(role?: string) {
  if (role === "patient") return "/patient/notifications";
  if (role === "health_worker") return "/rural/notifications";
  if (role === "caregiver") return "/caregiver/alerts";
  return "/doctor/escalations";
}

export function NotificationsPopover() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeStore(() => setTick((n) => n + 1)), []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = useMemo(() => {
    void tick;
    if (!user?.id) return [];
    return getStore()
      .notifications.filter((n) => n.user_id === user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 8);
  }, [user?.id, tick]);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    if (!user?.id) return;
    updateStore((draft) => {
      for (const n of draft.notifications) {
        if (n.user_id === user.id) n.read = true;
      }
    });
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(360px,92vw)] overflow-hidden rounded-2xl border border-border/80 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              className="text-xs font-medium text-emerald-700 hover:underline"
              onClick={markAllRead}
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto p-3">
            {items.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-xl border px-3 py-2.5",
                    n.read
                      ? "border-border/60 bg-muted/20"
                      : "border-emerald-200/80 bg-emerald-50/80",
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="border-t border-border/70 px-3 py-2 text-center">
            <Link
              to={inboxHref(user?.role)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-emerald-700",
              )}
              onClick={() => setOpen(false)}
            >
              Open inbox
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
