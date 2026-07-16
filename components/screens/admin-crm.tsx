"use client";

import { Component, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient, useMutation, useQuery } from "convex/react";
import { makeFunctionReference, type FunctionReference } from "convex/server";
import { Icon } from "@/components/ui";

type CrmHealth = {
  configured: boolean;
  migrationReady: boolean;
  outbox: { pending: number; failed: number; delivered: number; lastDeliveredAt: string | null };
};

type Opportunity = {
  _id: string;
  sourceId: string;
  title: string;
  stage: string;
  area?: string;
  budget?: string;
  eventDate?: string;
  consentContact: boolean;
};

type Task = {
  _id: string;
  title: string;
  status: string;
  priority: string;
  dueAt?: number;
};

type Activity = {
  _id: string;
  summary: string;
  occurredAt: string;
};

type Note = {
  _id: string;
  body: string;
  opportunitySourceId?: string;
  authorUserId: string;
  createdAt: number;
};

type Dashboard = {
  opportunities: Opportunity[];
  accounts: Array<{ _id: string }>;
  assignments: Array<{ _id: string }>;
  tasks: Task[];
  notes: Note[];
  activities: Activity[];
  stages: Record<string, number>;
};

const dashboardRef = makeFunctionReference<"query", Record<string, never>, Dashboard>("crm:dashboard");
const createTaskRef = makeFunctionReference<"mutation", {
  title: string;
  priority: "low" | "normal" | "high";
  dueAt?: number;
  opportunitySourceId?: string;
}, string>("crm:createTask");
const setTaskStatusRef = makeFunctionReference<"mutation", { taskId: string; status: "open" | "done" | "cancelled" }, null>("crm:setTaskStatus") as FunctionReference<"mutation">;
const addNoteRef = makeFunctionReference<"mutation", { body: string; opportunitySourceId?: string }, string>("crm:addNote");

const convexUrl = (process.env.NEXT_PUBLIC_CONVEX_URL || "").trim();
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

function ago(value: string | null): string {
  if (!value) return "Never";
  const elapsed = Math.max(0, Date.now() - Date.parse(value));
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function CrmHealthPanel({ health, refresh }: { health: CrmHealth | null; refresh: () => void }) {
  const [working, setWorking] = useState<string | null>(null);
  async function act(action: "sync" | "bootstrap") {
    setWorking(action);
    try {
      await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      refresh();
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="card" style={{ padding: 18, marginBottom: 18 }}>
      <div className="flex between center wrap g12">
        <div>
          <div className="flex center g8 wrap">
            <h3 style={{ fontSize: "1rem" }}>Supabase → Convex sync</h3>
            <span className="tag" style={{ background: health?.configured ? "var(--emerald-50)" : "var(--cream-200)", color: health?.configured ? "var(--emerald)" : "var(--ink-soft)" }}>
              {health?.configured ? "Connected" : "Setup needed"}
            </span>
          </div>
          <p className="muted" style={{ fontSize: ".84rem", marginTop: 4 }}>
            {health?.migrationReady === false
              ? "Apply migration 0071 before the first sync."
              : `${health?.outbox.pending ?? 0} pending · ${health?.outbox.failed ?? 0} retrying · last delivered ${ago(health?.outbox.lastDeliveredAt ?? null)}`}
          </p>
        </div>
        <div className="flex g8 wrap">
          <button className="btn btn-ghost btn-sm" disabled={working !== null || !health?.migrationReady} onClick={() => act("bootstrap")}>
            Queue snapshot
          </button>
          <button className="btn btn-primary btn-sm" disabled={working !== null || !health?.configured} onClick={() => act("sync")}>
            <Icon name="refresh" size={14} /> {working === "sync" ? "Syncing…" : "Sync now"}
          </button>
        </div>
      </div>
    </div>
  );
}

class CrmErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("[crm-dashboard]", error.message, info.componentStack); }
  render() {
    if (this.state.error) return (
      <div className="card" style={{ padding: 24 }}>
        <h3>Convex authorization needs attention</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Confirm the Clerk <code>convex</code> JWT template includes an admin role, or add this administrator to <code>CRM_ADMIN_USER_IDS</code> in Convex.
        </p>
      </div>
    );
    return this.props.children;
  }
}

function LiveCrm() {
  const data = useQuery(dashboardRef, {});
  const createTask = useMutation(createTaskRef);
  const setTaskStatus = useMutation(setTaskStatusRef);
  const addNote = useMutation(addNoteRef);
  const [taskTitle, setTaskTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [busy, setBusy] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState("");
  const columns = useMemo(() => ["new", "reviewing", "routed", "contacted", "closed", "spam"], []);

  if (!data) return <div className="card" style={{ padding: 28 }}><p className="muted">Loading live CRM…</p></div>;

  async function addTask() {
    const title = taskTitle.trim();
    if (!title) return;
    setBusy(true);
    try {
      await createTask({ title, priority });
      setTaskTitle("");
      setPriority("normal");
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    const body = noteBody.trim();
    if (!body || !selectedOpportunity) return;
    setBusy(true);
    try {
      await addNote({ body, opportunitySourceId: selectedOpportunity });
      setNoteBody("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="grid-3" style={{ marginBottom: 18 }}>
        {[
          ["Opportunities", data.opportunities.length],
          ["Business accounts", data.accounts.length],
          ["Vendor assignments", data.assignments.length],
        ].map(([label, value]) => (
          <div className="card" style={{ padding: 18 }} key={String(label)}>
            <p className="muted" style={{ fontSize: ".8rem" }}>{label}</p>
            <strong style={{ display: "block", fontSize: "1.8rem", marginTop: 4 }}>{value}</strong>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 18, overflowX: "auto" }}>
        <div className="flex between center wrap g8" style={{ marginBottom: 14 }}>
          <div><h3>Lead pipeline</h3><p className="muted" style={{ fontSize: ".82rem" }}>Stages mirror authoritative Supabase lead status.</p></div>
          <span className="tag" style={{ background: "var(--emerald-50)", color: "var(--emerald)" }}>Live</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(180px, 1fr))", gap: 10, minWidth: 1120 }}>
          {columns.map((stage) => (
            <section key={stage} style={{ background: "var(--cream-100)", borderRadius: 12, padding: 10, minHeight: 190 }}>
              <div className="flex between center" style={{ marginBottom: 10 }}>
                <strong style={{ textTransform: "capitalize", fontSize: ".86rem" }}>{stage}</strong>
                <span className="tag">{data.stages[stage] ?? 0}</span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {data.opportunities.filter((item) => item.stage === stage).slice(0, 12).map((item) => (
                  <button className="card" key={item._id} style={{ padding: 10, textAlign: "left", width: "100%", border: selectedOpportunity === item.sourceId ? "1px solid var(--emerald)" : undefined }} onClick={() => setSelectedOpportunity(item.sourceId)}>
                    <strong style={{ fontSize: ".82rem", lineHeight: 1.35, display: "block" }}>{item.title}</strong>
                    <p className="muted" style={{ fontSize: ".72rem", marginTop: 5 }}>{[item.area, item.budget].filter(Boolean).join(" · ") || "Details pending"}</p>
                    {!item.consentContact && <span className="tag" style={{ marginTop: 7, fontSize: ".65rem" }}>No contact consent</span>}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div className="flex between center wrap g8">
          <div>
            <h3>Opportunity notes</h3>
            <p className="muted" style={{ fontSize: ".82rem", marginTop: 3 }}>
              {selectedOpportunity
                ? data.opportunities.find((item) => item.sourceId === selectedOpportunity)?.title
                : "Select an opportunity card to add context."}
            </p>
          </div>
        </div>
        {selectedOpportunity && (
          <>
            <div className="flex g8 wrap" style={{ marginTop: 12 }}>
              <textarea className="input" rows={2} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Add a private team note…" style={{ flex: "1 1 360px", resize: "vertical" }} />
              <button className="btn btn-primary btn-sm" disabled={busy || !noteBody.trim()} onClick={saveNote}>Save note</button>
            </div>
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {data.notes.filter((note) => note.opportunitySourceId === selectedOpportunity).map((note) => (
                <div key={note._id} style={{ padding: 10, borderLeft: "3px solid var(--cream-300)" }}>
                  <p style={{ fontSize: ".86rem", whiteSpace: "pre-wrap" }}>{note.body}</p>
                  <p className="muted" style={{ fontSize: ".7rem", marginTop: 4 }}>{ago(new Date(note.createdAt).toISOString())}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(280px, .9fr)", gap: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3>Team tasks</h3>
          <div className="flex g8 wrap" style={{ marginTop: 12 }}>
            <input className="input" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add a follow-up task…" style={{ flex: "1 1 220px" }} onKeyDown={(event) => { if (event.key === "Enter") addTask(); }} />
            <select className="input" value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)} style={{ width: 120 }}>
              <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
            </select>
            <button className="btn btn-primary btn-sm" disabled={busy || !taskTitle.trim()} onClick={addTask}>Add task</button>
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
            {data.tasks.filter((task) => task.status === "open").map((task) => (
              <label className="card" key={task._id} style={{ padding: 11, display: "flex", gap: 10, alignItems: "center" }}>
                <input type="checkbox" onChange={() => setTaskStatus({ taskId: task._id, status: "done" })} />
                <span style={{ flex: 1, fontSize: ".86rem" }}>{task.title}</span>
                <span className="tag" style={{ textTransform: "capitalize" }}>{task.priority}</span>
              </label>
            ))}
            {!data.tasks.some((task) => task.status === "open") && <p className="muted" style={{ padding: 10 }}>No open tasks.</p>}
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3>Recent activity</h3>
          <div style={{ display: "grid", gap: 11, marginTop: 14 }}>
            {data.activities.map((activity) => (
              <div key={activity._id} style={{ borderBottom: "1px solid var(--cream-200)", paddingBottom: 10 }}>
                <p style={{ fontSize: ".84rem" }}>{activity.summary.replace(/ upsertd in Supabase$/, " synced from Supabase")}</p>
                <p className="muted" style={{ fontSize: ".7rem", marginTop: 3 }}>{ago(activity.occurredAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminCrm() {
  const [health, setHealth] = useState<CrmHealth | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    fetch("/api/admin/crm")
      .then((response) => response.json())
      .then((value) => { if (active && value.ok) setHealth(value as CrmHealth); })
      .catch(() => {});
    return () => { active = false; };
  }, [refreshKey]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <p className="faint" style={{ fontSize: ".78rem", textTransform: "uppercase", letterSpacing: ".08em" }}>Customer operations</p>
        <h2 style={{ marginTop: 3 }}>CRM workspace</h2>
        <p className="muted" style={{ marginTop: 6 }}>Live opportunities and follow-ups, with Supabase retained as the source of truth.</p>
      </div>
      <CrmHealthPanel health={health} refresh={() => setRefreshKey((key) => key + 1)} />
      {!convexClient ? (
        <div className="card" style={{ padding: 24 }}>
          <h3>Connect the Convex deployment</h3>
          <p className="muted" style={{ marginTop: 8, maxWidth: 720 }}>
            The production-safe sync and schema are installed in the codebase. Set <code>NEXT_PUBLIC_CONVEX_URL</code>, <code>CONVEX_CRM_INGEST_URL</code>, and <code>CRM_SYNC_SECRET</code>, then deploy the Convex functions to turn on the live board.
          </p>
        </div>
      ) : (
        <CrmErrorBoundary>
          <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
            <LiveCrm />
          </ConvexProviderWithClerk>
        </CrmErrorBoundary>
      )}
    </div>
  );
}
