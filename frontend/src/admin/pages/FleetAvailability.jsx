import { useResource } from '../../hooks/useResource.js';
import { useState } from 'react';
import { defaultPeriod, toUTC } from '../../utils/rentalTime.js';
import { useAdminAction } from '../hooks/useAdminAction.js';
import { api } from '../../services/apiClient.js';
import { PageTitle } from '../components/PageTitle.jsx';
import { PeriodFields } from '../../components/booking/PeriodFields.jsx';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { Loading } from '../../components/common/Loader.jsx';
import { Status } from '../../components/common/StatusBadge.jsx';
import { money } from '../../utils/formatters.js';
export function Availability() {
  const { data, loading, error } = useResource('/admin/vehicles', 15000),
    [period, setPeriod] = useState(defaultPeriod),
    [results, setResults] = useState(null);
  const action = useAdminAction();
  const check = async (e) => {
    e.preventDefault();
    const result = await action.execute(
      () =>
        api(
          '/vehicles?' +
            new URLSearchParams({
              startsAt: toUTC(period.startsAt),
              endsAt: toUTC(period.endsAt),
            }),
        ),
      'Availability refreshed.',
    );
    if (result) setResults(result);
  };
  return (
    <>
      <PageTitle
        title="The right ride. At the right time."
        subtitle="Physical status and reservation availability are shown separately."
      />
      <form className="rr-panel availability-search" onSubmit={check}>
        <PeriodFields value={period} onChange={setPeriod} />
        <button className="rr-button" disabled={action.busy}>
          Check Availability
        </button>
      </form>
      <ErrorBox>{error || action.error}</ErrorBox>
      {loading ? (
        <Loading />
      ) : (
        <section className="rr-panel table-panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Registration</th>
                  <th>Physical status now</th>
                  <th>Selected window</th>
                  <th>Rate / hour</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((v) => {
                  const a = results?.find((a) => a.id === v.id);
                  return (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.name}</strong>
                        <small>{v.category}</small>
                      </td>
                      <td>{v.registration}</td>
                      <td>
                        <Status value={v.physicalStatus} />
                      </td>
                      <td>
                        {results ? (
                          <>
                            <Status value={a?.available ? 'Available' : 'Unavailable'} />
                            <small>{a?.reason || 'Inactive vehicle'}</small>
                          </>
                        ) : (
                          <span className="subtle-note">Choose dates above</span>
                        )}
                      </td>
                      <td>{money(v.rate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
