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

export function LeadsOverTimeChart({ byDay }: { byDay: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={byDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.15)" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(d) => String(d).slice(5)} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {Object.keys(LEAD_LABELS).map((k) => (
          <Line key={k} type="monotone" dataKey={k} name={LEAD_LABELS[k]}
            stroke={ACTION_COLOR[k]} strokeWidth={k === "enquiry_form" ? 2.5 : 1.5} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EnquiriesByVendorChart({ topVendors }: { topVendors: VendorPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={topVendors} layout="vertical" margin={{ left: 8, right: 16 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={{ fill: "rgba(128,128,128,.08)" }} />
        <Bar dataKey="enquiries" name="Enquiries" fill="#0F6E56" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
