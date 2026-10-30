import { ResponsiveContainer } from 'recharts';
import { BarChart } from 'recharts';
import { CartesianGrid } from 'recharts';
import { XAxis } from 'recharts';
import { YAxis } from 'recharts';
import { Tooltip } from 'recharts';
import { Bar } from 'recharts';
import './BookingTrendChart.css';
export function BookingTrendChart({ daily }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={daily}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => v.slice(5)}
          tick={{
            fontSize: 10,
            fill: 'var(--color-muted)',
          }}
        />
        <YAxis
          allowDecimals={false}
          tick={{
            fontSize: 10,
            fill: 'var(--color-muted)',
          }}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
        <Bar isAnimationActive={false} dataKey="bookings" fill="#8b5cf6" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
