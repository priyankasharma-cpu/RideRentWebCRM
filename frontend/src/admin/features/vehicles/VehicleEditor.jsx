import { useState } from 'react';
import { useAdminAction } from '../../hooks/useAdminAction.js';
import { api } from '../../../services/apiClient.js';
import { Modal } from '../../../components/common/Modal.jsx';
import { Upload } from 'lucide-react';
import { ErrorBox } from '../../../components/common/ErrorBox.jsx';
import './VehicleEditor.css';
export function VehicleEditor({ vehicle: v, onClose, onChanged }) {
  const [image, setImage] = useState(v.image || '/images/scooter.png');
  const { error, busy, execute } = useAdminAction(onChanged);
  const submit = async (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const result = await execute(() =>
      api('/admin/vehicles' + (v.id ? '/' + v.id : ''), {
        method: v.id ? 'PUT' : 'POST',
        body: {
          ...values,
          image,
          rate: Math.round(Number(values.rate) * 100),
          deposit: Math.round(Number(values.deposit) * 100),
          seats: Number(values.seats),
          odometer: Number(values.odometer),
        },
      }),
    );
    if (result) onClose();
  };
  return (
    <Modal title={v.id ? 'Edit your fleet' : 'Add a new ride'} onClose={onClose}>
      <form className="editor-form" onSubmit={submit}>
        <div className="form-grid">
          {[
            ['Model name', 'name', v.name, 'text'],
            ['Brand', 'brand', v.brand, 'text'],
            ['Registration', 'registration', v.registration, 'text'],
            ['Engine / battery', 'engine', v.engine || '', 'text'],
            ['Hourly rate (₹)', 'rate', (v.rate || 10000) / 100, 'number'],
            ['Deposit (₹)', 'deposit', (v.deposit || 0) / 100, 'number'],
            ['Seats', 'seats', v.seats || 2, 'number'],
            ['Odometer (km)', 'odometer', v.odometer || 0, 'number'],
          ].map(([title, name, value, type]) => (
            <label key={name}>
              {title}
              <input
                name={name}
                type={type}
                defaultValue={value}
                required={name !== 'engine'}
                min={name === 'rate' ? 1 : name === 'seats' ? 1 : 0}
                max={name === 'seats' ? 20 : undefined}
                step={type === 'number' && ['rate', 'deposit'].includes(name) ? '0.01' : undefined}
              />
            </label>
          ))}
          <label>
            Category
            <select name="category" defaultValue={v.category || 'Bike'}>
              {['Bike', 'Scooter', 'Car'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Fuel
            <select name="fuel" defaultValue={v.fuel || 'Petrol'}>
              {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Transmission
            <select name="transmission" defaultValue={v.transmission || 'Manual'}>
              <option>Manual</option>
              <option>Automatic</option>
            </select>
          </label>
          <label>
            Physical status
            <select name="status" defaultValue={v.status || 'Available'}>
              {['Available', 'Maintenance', 'Inactive'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="span-2">
            Description
            <textarea name="description" defaultValue={v.description || ''} maxLength="3000" />
          </label>
          <label className="span-2">
            Image URL
            <input value={image} onChange={(e) => setImage(e.target.value)} required />
          </label>
          <label className="upload-field span-2">
            <Upload size={16} /> Or upload a JPEG, PNG or WebP (max 4 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const form = new FormData();
                form.append('image', file);
                const result = await execute(
                  () =>
                    api('/admin/uploads', {
                      method: 'POST',
                      body: form,
                    }),
                  'Image uploaded.',
                );
                if (result) setImage(result.url);
              }}
            />
          </label>
        </div>
        <ErrorBox>{error}</ErrorBox>
        <button className="rr-button" disabled={busy}>
          Save Vehicle
        </button>
        <p className="form-note">Open bookings must be resolved before changing physical status.</p>
      </form>
    </Modal>
  );
}
