import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
} from 'recharts';
import './RevenueChart.css';
export function RevenueChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart
        data={data}
        margin={{
          left: 0,
          right: 10,
          top: 10,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#087bff" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#087bff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 5" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => v.slice(5)}
          tick={{
            fontSize: 10,
            fill: 'var(--color-muted)',
          }}
          axisLine={false}
          tickLine={false}
          minTickGap={20}
        />
        <YAxis
          tick={{
            fontSize: 10,
            fill: 'var(--color-muted)',
          }}
          tickFormatter={(v) => '₹' + v}
          axisLine={false}
          tickLine={false}
          width={55}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 12,
            color: 'var(--color-text)',
            fontSize: 12,
          }}
          formatter={(v) => ['₹' + Number(v).toLocaleString('en-IN'), 'Rental receipts']}
        />
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey="revenue"
          stroke="#087bff"
          strokeWidth={3}
          fill="url(#revenueFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
