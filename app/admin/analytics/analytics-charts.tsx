"use client";
// Recharts lives ONLY in this module so it can be code-split out of the admin
// dashboard's first paint: Dashboard.tsx loads it via next/dynamic({ssr:false}),
// keeping the ~heavy charting lib off the initial dashboard chunk (and it never
// ships to any public route). See Dashboard.tsx <Overview>.
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";
import { LEAD_LABELS } from "@/lib/analytics-dashboard";

const ACTION_COLOR: Record<string, string> = {
  enquiry_form: "#0F6E56", whatsapp: "#1D9E75", call: "#185FA5",
  website: "#378ADD", directions: "#85B7EB", shortlist: "#BA7517",
};

type DayPoint = Record<string, number | string>;
type VendorPoint = { name: string; enquiries: number };

function EmptyChart({ text }: { text: string }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "rgba(128,128,128,.7)", fontSize: 13, textAlign: "center", padding: 12 }}>
      {text}
    </div>
  );
}

export function LeadsOverTimeChart({ byDay }: { byDay: DayPoint[] }) {
  // Only plot series that actually have data — with 4 total leads, six
  // near-flat lines + a 6-item legend read as noise, not signal.
  const activeKeys = Object.keys(LEAD_LABELS).filter((k) =>
    byDay.some((d) => Number(d[k]) > 0),
  );
  if (!byDay.length || !activeKeys.length) {
    return <EmptyChart text="No lead actions in this period yet — they'll chart here as they happen." />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={byDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.15)" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(d) => String(d).slice(5)} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        {activeKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {activeKeys.map((k) => (
          <Line key={k} type="monotone" dataKey={k} name={LEAD_LABELS[k]}
            stroke={ACTION_COLOR[k]} strokeWidth={k === "enquiry_form" ? 2.5 : 1.5} dot={byDay.length <= 3} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EnquiriesByVendorChart({ topVendors }: { topVendors: VendorPoint[] }) {
  const withData = topVendors.filter((v) => v.enquiries > 0);
  if (!withData.length) {
    return <EmptyChart text="No vendor enquiries in this period yet." />;
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={withData} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={{ fill: "rgba(128,128,128,.08)" }} />
        <Bar dataKey="enquiries" name="Enquiries" fill="#0F6E56" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
