"use client";

/* Multi-series performance chart for owner insights (Premium). Plots the three
   REAL series owner_roi_daily returns — impressions, profile views, customer
   actions. recharts stays off the public bundle via next/dynamic (same pattern
   as event-manage-charts). */

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

export interface InsightsDay { day: string; impressions: number; listing_views: number; lead_actions: number }

const fmtDay = (d: string) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-SG", { day: "numeric", month: "short" });
};

export default function InsightsChart({ data }: { data: InsightsDay[] }) {
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip labelFormatter={(v) => fmtDay(String(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="impressions" name="Times shown" stroke="var(--emerald-300)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="listing_views" name="Profile views" stroke="var(--emerald)" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="lead_actions" name="Customer actions" stroke="var(--gold)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
