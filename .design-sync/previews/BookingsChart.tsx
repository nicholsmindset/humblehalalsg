import { BookingsChart } from "humblehalalsg";

// ResponsiveContainer (width/height 100%) needs an explicitly sized parent.
const series = [
  { day: "2026-07-14", bookings: 8 },
  { day: "2026-07-15", bookings: 14 },
  { day: "2026-07-16", bookings: 11 },
  { day: "2026-07-17", bookings: 22 },
  { day: "2026-07-18", bookings: 31 },
  { day: "2026-07-19", bookings: 27 },
  { day: "2026-07-20", bookings: 35 },
];

export const WeeklyBookings = () => (
  <div style={{ width: 460, height: 240 }}>
    <BookingsChart series={series} />
  </div>
);
