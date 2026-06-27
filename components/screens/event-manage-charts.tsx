"use client";
/* Recharts lives ONLY in this module — EventManageScreen loads it via
   next/dynamic({ssr:false}) so the charting lib stays off the public/event
   bundle (organiser-only, lazy on the Overview tab). */
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";

type DayPoint = { day: string; bookings: number };
type TierPoint = { tier: string; issued: number; checkedIn: number };

export function BookingsChart({ series }: { series: DayPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.15)" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(d) => String(d).slice(5)} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#0F6E56" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TierChart({ tiers }: { tiers: TierPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={tiers} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,.15)" />
        <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={{ fill: "rgba(128,128,128,.08)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="issued" name="Booked" fill="#85B7EB" radius={[4, 4, 0, 0]} />
        <Bar dataKey="checkedIn" name="Checked in" fill="#0F6E56" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
