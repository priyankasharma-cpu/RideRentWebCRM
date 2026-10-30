import { ResponsiveContainer } from 'recharts';
import { PieChart } from 'recharts';
import { Pie } from 'recharts';
import { Cell } from 'recharts';
import { colors } from '../../../config/themeConfig.js';
import { Tooltip } from 'recharts';
import './FleetCategoryChart.css';
export function FleetCategoryChart({ data }) {
  return (
    <section className="rr-panel fleet-chart">
      <div className="panel-title">
        <div>
          <h3>A fleet for every plan</h3>
          <p>Your vehicle categories</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={195}>
        <PieChart>
          <Pie
            isAnimationActive={false}
            data={data.categories}
            dataKey="value"
            innerRadius={57}
            outerRadius={78}
            paddingAngle={5}
            stroke="none"
          >
            {data.categories.map((c, i) => (
              <Cell key={c.name} fill={colors[i]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 10,
              color: 'var(--color-text)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="chart-legend">
        {data.categories.map((c, i) => (
          <span key={c.name}>
            <i
              style={{
                background: colors[i],
              }}
            />
            {c.name}
            <strong>{c.value}</strong>
          </span>
        ))}
      </div>
    </section>
  );
}
