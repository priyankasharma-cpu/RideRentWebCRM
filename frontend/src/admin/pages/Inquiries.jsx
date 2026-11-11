import { useState } from 'react';
import { Mail, Phone, CheckCheck, Inbox } from 'lucide-react';
import { useResource } from '../../hooks/useResource.js';
import { useAdminAction } from '../hooks/useAdminAction.js';
import { api } from '../../services/apiClient.js';
import { formatTime } from '../../utils/formatters.js';
import { PageTitle } from '../components/PageTitle.jsx';
import { ErrorBox } from '../../components/common/ErrorBox.jsx';
import { Loading } from '../../components/common/Loader.jsx';
import './Inquiries.css';
const inquiryLabels = {
  vehicle: 'Vehicle enquiry',
  booking: 'Existing booking',
  pickup: 'Pickup & return',
  other: 'Other question',
};
export default function Inquiries() {
  const [status, setStatus] = useState('all');
  const [offset, setOffset] = useState(0);
  const { data, error, loading, reload } = useResource(
    `/admin/inquiries?status=${status}&offset=${offset}`,
    15000,
  );
  const action = useAdminAction(reload);
  return (
    <>
      <PageTitle
        title="Customer inquiries"
        subtitle="Messages received from the website contact form."
      />
      <div className="admin-inquiries__toolbar">
        <label>
          Show messages
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setOffset(0);
            }}
          >
            <option value="all">All messages</option>
            <option value="new">New messages</option>
            <option value="read">Read messages</option>
          </select>
        </label>
        <span>{data?.total ?? 0} messages</span>
      </div>
      <ErrorBox>{error || action.error}</ErrorBox>
      {loading ? (
        <Loading />
      ) : (
        <div className="admin-inquiries__list">
          {data?.items.map((inquiry) => (
            <article className="admin-inquiry" key={inquiry.id}>
              <div className="admin-inquiry__header">
                <div>
                  <span className="admin-inquiry__type">{inquiryLabels[inquiry.inquiry_type]}</span>
                  <h2>{inquiry.name}</h2>
                  <small>{formatTime(inquiry.created_at)}</small>
                </div>
                <span className={`admin-inquiry__status admin-inquiry__status--${inquiry.status}`}>
                  {inquiry.status === 'new' ? 'New' : 'Read'}
                </span>
              </div>
              <div className="admin-inquiry__contact">
                <a href={`mailto:${inquiry.email}`}>
                  <Mail size={15} aria-hidden="true" />
                  {inquiry.email}
                </a>
                {inquiry.phone && (
                  <a href={`tel:${inquiry.phone}`}>
                    <Phone size={15} aria-hidden="true" />
                    {inquiry.phone}
                  </a>
                )}
              </div>
              <p className="admin-inquiry__message">{inquiry.message}</p>
              <div className="admin-inquiry__footer">
                <small>Reference: {inquiry.id}</small>
                <button
                  type="button"
                  disabled={action.busy}
                  onClick={() =>
                    action.execute(
                      () =>
                        api(`/admin/inquiries/${inquiry.id}`, {
                          method: 'PATCH',
                          body: { status: inquiry.status === 'new' ? 'read' : 'new' },
                        }),
                      'Inquiry updated.',
                    )
                  }
                >
                  <CheckCheck size={16} aria-hidden="true" />
                  Mark as {inquiry.status === 'new' ? 'read' : 'new'}
                </button>
              </div>
            </article>
          ))}
          {data && !data.items.length && (
            <div className="empty-state">
              <Inbox size={30} aria-hidden="true" />
              <h3>No messages in this view.</h3>
              <p>Contact form submissions will appear here.</p>
            </div>
          )}
        </div>
      )}
      {data && data.total > 50 && (
        <div className="admin-inquiries__pagination">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - 50))}
          >
            Previous
          </button>
          <span>
            {offset + 1}–{Math.min(offset + 50, data.total)} of {data.total}
          </span>
          <button
            type="button"
            disabled={offset + 50 >= data.total}
            onClick={() => setOffset(offset + 50)}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}
