import { useResource } from '../../../hooks/useResource.js';
import { Modal } from '../../../components/common/Modal.jsx';
import { ErrorBox } from '../../../components/common/ErrorBox.jsx';
import { Loading } from '../../../components/common/Loader.jsx';
import { formatTime } from '../../../utils/formatters.js';
import './AuditTrail.css';
export function AuditTrail({ onClose }) {
  const { data, error, loading } = useResource('/admin/audit');
  return (
    <Modal title="Recent audit activity" onClose={onClose}>
      <ErrorBox>{error}</ErrorBox>
      {loading ? (
        <Loading />
      ) : (
        <div className="audit-list">
          {data?.map((a) => (
            <div key={a.id}>
              <strong>{a.action}</strong>
              <small>
                {a.staff_name || 'Website customer'} · {formatTime(a.created_at)}
              </small>
              <code>{a.entity_id}</code>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
