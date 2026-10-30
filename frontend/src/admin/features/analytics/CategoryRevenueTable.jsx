import { money } from '../../../utils/formatters.js';
import './CategoryRevenueTable.css';
export function CategoryRevenueTable({ data }) {
  return (
    <section className="rr-panel table-panel category-revenue">
      <div className="panel-title">
        <div>
          <h3>Rental receipts by category</h3>
          <p>All-time net rental payments · deposits excluded</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Fleet size</th>
              <th>Net rental receipts</th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((c) => (
              <tr key={c.name}>
                <td>
                  <strong>{c.name}</strong>
                </td>
                <td>{c.value}</td>
                <td>{money(c.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
