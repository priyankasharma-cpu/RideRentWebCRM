import { useMemo, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { count, money, percent, sourceNames } from './financeModel.js';
import './FinanceCharts.css';

ChartJS.register(
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  DoughnutController,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);
const light = ['#1d53aa', '#087b70', '#915c1b', '#6a4da2', '#c04554', '#4d6177'];
const dark = ['#8cb6ff', '#59d1be', '#f0b56b', '#c6adff', '#ff8897', '#a4bbd3'];
const seriesOf = (rows, label, field, extra = {}) => ({
  label,
  values: rows.map((row) => row[field]),
  ...extra,
});

function configurations(data, page) {
  const fields = data.series;
  const labels = fields.map((row) => row.date);
  const website = seriesOf(fields, 'Website', 'website', { color: 0 });
  const walkIn = seriesOf(fields, 'Walk-in', 'walk_in', { color: 1 });
  const unknown = seriesOf(fields, 'Unclassified', 'unknown', { color: 2 });
  const revenue = seriesOf(fields, 'Recognized revenue', 'revenue', { color: 3 });
  const costs = seriesOf(fields, 'Operating expenses', 'expenses', { color: 4 });
  const profit = seriesOf(fields, 'Operating profit', 'profit', { color: 1 });
  const bookings = seriesOf(fields, 'Orders', 'bookings', {
    color: 0,
    type: 'line',
    yAxisID: 'orders',
  });
  const categories = data.categories;
  const vehicles = data.vehicles.slice(0, 10);
  const sources = data.sources.filter((source) => source.amount !== 0);
  const rowChart = (title, rows, type, horizontal = false) => ({
    title,
    labels: rows.map((row) => row.name),
    type,
    horizontal,
    datasets: [seriesOf(rows, title, 'amount', { color: 0 })],
  });
  const expenseChart = {
    title: 'Profit and loss by period',
    labels,
    type: 'bar',
    datasets: [revenue, costs, profit],
  };
  if (page === 'profit-loss')
    return [
      expenseChart,
      { title: 'Revenue and expense trend', labels, type: 'line', datasets: [revenue, costs] },
    ];
  const sourcePage = ['website', 'walk-in'].includes(page);
  const result = [
    {
      title: 'Revenue trend',
      labels,
      type: 'line',
      datasets: sourcePage
        ? [revenue]
        : [revenue, website, walkIn, ...(unknown.values.some(Boolean) ? [unknown] : [])],
    },
  ];
  if (!sourcePage)
    result.push(
      { title: 'Website and walk-in comparison', labels, type: 'bar', datasets: [website, walkIn] },
      rowChart(
        'Revenue by booking source',
        sources.map((row) => ({ ...row, name: sourceNames[row.id] })),
        sources.some((row) => row.amount < 0) ? 'bar' : 'doughnut',
        sources.some((row) => row.amount < 0),
      ),
    );
  result.push(rowChart('Vehicle category revenue', categories, 'bar', true), {
    ...rowChart('Top performing vehicles', vehicles, 'bar', true),
    summary: rowChart('Vehicle revenue', data.vehicles, 'bar', true),
  });
  if (!sourcePage)
    result.push(rowChart('Rental payments by method', data.methods, 'doughnut'), expenseChart);
  result.push({
    title: 'Booking and revenue performance',
    labels,
    type: 'bar',
    mixed: true,
    datasets: [revenue, bookings],
  });
  return result;
}

function DataSummary({ labels, datasets, doughnut }) {
  const [open, setOpen] = useState(false);
  const total = doughnut ? datasets[0].values.reduce((sum, value) => sum + value, 0) : 0;
  return (
    <div className="finance-chart-summary">
      <button className="rr-button--text" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? 'Hide data table' : 'View data table'}
      </button>
      {open && (
        <div className="finance-table-scroll" tabIndex={0}>
          <table>
            <thead>
              <tr>
                <th scope="col">Breakdown</th>
                {datasets.map((set) => (
                  <th scope="col" key={set.label}>
                    {set.label}
                  </th>
                ))}
                {doughnut && <th scope="col">Share</th>}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, index) => (
                <tr key={label + index}>
                  <th scope="row">{label}</th>
                  {datasets.map((set) => (
                    <td key={set.label}>
                      {(set.yAxisID === 'orders' ? count : money)(set.values[index])}
                    </td>
                  ))}
                  {doughnut && (
                    <td>{percent(total ? (datasets[0].values[index] / total) * 100 : null)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FinanceChart({ config, darkMode }) {
  const { title, labels, datasets, type, horizontal, mixed } = config;
  const palette = darkMode ? dark : light;
  const text = darkMode ? '#e1e9f5' : '#253952';
  const grid = darkMode ? '#304152' : '#e1e9f2';
  const doughnut = type === 'doughnut';
  const data = useMemo(
    () => ({
      labels,
      datasets: datasets.map(({ values, color, ...dataset }) => ({
        ...dataset,
        data: values,
        borderColor: doughnut ? (darkMode ? '#172437' : '#fff') : palette[color],
        backgroundColor: doughnut
          ? labels.map((_, index) => palette[index % palette.length])
          : palette[color],
        borderWidth: 2,
        maxBarThickness: horizontal ? 34 : undefined,
        borderRadius: doughnut ? 0 : 3,
        tension: 0.22,
        pointRadius: labels.length < 35 ? 2 : 0,
        pointHitRadius: 14,
      })),
    }),
    [labels, datasets, palette, doughnut, darkMode, horizontal],
  );
  const options = useMemo(() => {
    const category = {
      ticks: { color: text, maxTicksLimit: 12, autoSkip: true },
      grid: { display: false },
    };
    const amount = {
      beginAtZero: true,
      ticks: { color: text, maxTicksLimit: 6, precision: 0, callback: money },
      grid: { color: grid },
    };
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      indexAxis: horizontal ? 'y' : 'x',
      color: text,
      interaction: { mode: horizontal || doughnut ? 'nearest' : 'index', intersect: false },
      plugins: {
        legend: {
          display: doughnut || datasets.length > 1,
          labels: { color: text, usePointStyle: true, boxWidth: 8 },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = doughnut
                ? context.parsed
                : horizontal
                  ? context.parsed.x
                  : context.parsed.y;
              if (doughnut) {
                const total = context.dataset.data.reduce((sum, amount) => sum + amount, 0);
                return (
                  context.label +
                  ' · ' +
                  money(value) +
                  ' (' +
                  percent(total ? (value / total) * 100 : null) +
                  ')'
                );
              }
              return (
                context.dataset.label +
                ' · ' +
                (context.dataset.yAxisID === 'orders' ? count(value) : money(value))
              );
            },
          },
        },
      },
      scales: doughnut
        ? undefined
        : {
            x: horizontal ? amount : category,
            y: horizontal
              ? category
              : mixed
                ? { ...amount, title: { display: true, color: text, text: 'Revenue (INR)' } }
                : amount,
            ...(mixed
              ? {
                  orders: {
                    position: 'right',
                    beginAtZero: true,
                    title: { display: true, color: text, text: 'Orders' },
                    ticks: { color: text, precision: 0 },
                    grid: { drawOnChartArea: false },
                  },
                }
              : {}),
          },
    };
  }, [text, grid, datasets.length, doughnut, horizontal, mixed]);
  const hasValues = datasets.some((set) => set.values.some(Boolean));
  return (
    <article className="finance-card finance-chart">
      <h3>{title}</h3>
      {hasValues ? (
        <>
          <div className="finance-chart-canvas">
            <Chart
              type={type}
              data={data}
              options={options}
              role="img"
              aria-label={title + '. Exact values are available in the data table.'}
            />
          </div>
          <DataSummary
            labels={config.summary?.labels || labels}
            datasets={config.summary?.datasets || datasets}
            doughnut={doughnut}
          />
        </>
      ) : (
        <p className="finance-chart-empty">No activity for these filters.</p>
      )}
    </article>
  );
}

export default function FinanceCharts({ data, page }) {
  const { theme } = useTheme();
  const charts = useMemo(() => configurations(data, page), [data, page]);
  return (
    <div className="finance-chart-grid">
      {charts.map((config) => (
        <FinanceChart key={config.title} config={config} darkMode={theme === 'dark'} />
      ))}
    </div>
  );
}
