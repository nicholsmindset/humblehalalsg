"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { Icon, useDialog } from "./ui";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

/* In-app notification bell. Loads the user's recent notifications and subscribes
   to new ones over Supabase Realtime (token-scoped client → RLS-filtered to the
   signed-in user). Written only by Edge Functions; read-only here. */
export function NotificationBell() {
  const { user } = useUser();
  const supabase = useSupabaseBrowser();
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, useCallback(() => setOpen(false), []));

  const unread = items.reduce((n, x) => n + (x.read_at ? 0 : 1), 0);

  useEffect(() => {
    if (!supabase || !user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,type,title,body,link,read_at,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (active && data) setItems(data as Notif[]);
    })();
    const ch = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setItems((prev) => [payload.new as Notif, ...prev].slice(0, 20)),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [supabase, user]);

  const openItem = useCallback(
    async (n: Notif) => {
      setOpen(false);
      if (!n.read_at) {
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
        try { await supabase?.rpc("mark_notification_read", { p_id: n.id }); } catch { /* best-effort */ }
      }
      if (n.link) router.push(n.link);
    },
    [supabase, router],
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="btn btn-ghost btn-sm"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{ position: "relative", padding: 8 }}
      >
        <Icon name="bell" size={20} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, padding: "0 4px",
              borderRadius: 999, background: "var(--danger, #d33)", color: "#fff",
              fontSize: 10, fontWeight: 700, lineHeight: "16px", textAlign: "center",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="card"
          role="menu"
          style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 320, maxHeight: 420, overflowY: "auto", zIndex: 60, padding: 6 }}
        >
          {items.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", color: "var(--ink-faint)", fontSize: ".88rem" }}>No notifications yet</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                role="menuitem"
                onClick={() => openItem(n)}
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "10px 12px",
                  background: n.read_at ? "transparent" : "var(--emerald-50, rgba(16,92,74,.06))",
                  border: "none", borderRadius: 8, cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: n.read_at ? 500 : 700, fontSize: ".9rem" }}>{n.title}</div>
                {n.body && <div className="faint" style={{ fontSize: ".8rem", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
