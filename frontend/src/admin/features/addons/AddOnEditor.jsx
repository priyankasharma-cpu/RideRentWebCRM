import { useState } from 'react';
import { Modal } from '../../../components/common/Modal.jsx';
import { ErrorBox } from '../../../components/common/ErrorBox.jsx';
import { useAdminAction } from '../../hooks/useAdminAction.js';
import { addOnService } from '../../../services/addOnService.js';
import './AddOnEditor.css';

export function AddOnEditor({ value, helmet, onClose, onChanged }) {
  const action = useAdminAction(onChanged);
  const [categories, setCategories] = useState(() => value.categories || []);
  const [validation, setValidation] = useState('');
  const toggle = (category, enabled) =>
    setCategories((current) =>
      enabled
        ? [...current, { category, includedQuantity: 0 }]
        : current.filter((rule) => rule.category !== category),
    );
  const submit = async (event) => {
    event.preventDefault();
    setValidation('');
    if (!categories.length) {
      setValidation('Select at least one eligible vehicle category.');
      return;
    }
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const rateText = fields.rate;
    const [rupees, paise = ''] = rateText.split('.');
    const rate = Number(rupees) * 100 + Number(paise.padEnd(2, '0'));
    const body = {
      ...fields,
      id: value.id,
      version: value.version,
      code: value.code || (helmet ? 'helmet' : fields.code),
      rate,
      stock: Number(fields.stock),
      unserviceable: Number(fields.unserviceable),
      maxQuantity: Number(fields.maxQuantity),
      enabled: fields.enabled === 'on',
      categories,
    };
    const result = await action.execute(
      () => addOnService.save(body),
      'Add-on settings saved. New quotes will use these settings.',
    );
    if (result) onClose();
  };
  return (
    <Modal
      title={value.id ? `Edit ${value.name}` : helmet ? 'Configure helmets' : 'Create add-on'}
      onClose={() => {
        if (!action.busy) onClose();
      }}
    >
      <form className="addon-editor" onSubmit={submit}>
        <fieldset disabled={action.busy}>
          <div className="addon-editor__grid">
            <label>
              Name
              <input
                name="name"
                aria-label="Name"
                defaultValue={value.name || (helmet ? 'Extra helmets' : '')}
                minLength={2}
                maxLength={100}
                required
              />
              <small>Display name shown to customers.</small>
            </label>
            <label>
              Unique code
              <input
                name="code"
                defaultValue={value.code || (helmet ? 'helmet' : '')}
                readOnly={Boolean(value.id || helmet)}
                pattern="[a-z][a-z0-9\-]{1,49}"
                maxLength={50}
                placeholder="e.g. phone-holder"
                required
              />
              <small>Permanent identifier. Use “helmet” for helmet settings.</small>
            </label>
            <label>
              Rental price (₹)
              <input
                name="rate"
                aria-label="Rental price (₹)"
                type="text"
                inputMode="decimal"
                pattern="[0-9]+([.][0-9]{1,2})?"
                defaultValue={value.id ? (value.rate / 100).toFixed(2) : ''}
                placeholder="Enter shop-approved price"
                required
              />
              <small>Price for one paid extra item. Included items are free.</small>
            </label>
            <label>
              Billing type
              <select
                name="billing"
                aria-label="Billing type"
                defaultValue={value.billing || ''}
                required
              >
                <option value="" disabled>
                  Select billing type
                </option>
                <option value="booking">Per booking</option>
                <option value="hour">Per hour</option>
              </select>
              <small>Charge once per booking, or for each billable rental hour.</small>
            </label>
            <label>
              Total stock
              <input
                name="stock"
                aria-label="Total stock"
                type="number"
                min={0}
                max={10000}
                step={1}
                defaultValue={value.stock ?? ''}
                required
              />
              <small>Total items owned by the shop. Reservations are deducted automatically.</small>
            </label>
            <label>
              Damaged / unavailable stock
              <input
                name="unserviceable"
                aria-label="Damaged / unavailable stock"
                type="number"
                min={0}
                max={10000}
                step={1}
                defaultValue={value.unserviceable ?? ''}
                required
              />
              <small>Items within total stock that cannot currently be rented.</small>
            </label>
            <label className="addon-editor__wide">
              Maximum units per checkout
              <input
                name="maxQuantity"
                type="number"
                min={1}
                max={10000}
                step={1}
                defaultValue={value.maxQuantity ?? ''}
                required
              />
              <small>
                Includes both free/included and paid units across all selected vehicles.
              </small>
            </label>
            <label className="addon-editor__wide">
              Description
              <textarea
                name="description"
                defaultValue={value.description || ''}
                maxLength={1000}
                rows={2}
              />
            </label>
            <label className="addon-editor__wide">
              Image URL (optional)
              <input
                name="image"
                defaultValue={value.image || ''}
                maxLength={500}
                placeholder="/images/... or https://..."
              />
            </label>
          </div>
          <div className="addon-editor__categories">
            <h3>Eligible vehicles & included units</h3>
            <p>Included units are free but still reserve actual stock.</p>
            {['Bike', 'Scooter', 'Car'].map((category) => {
              const rule = categories.find((row) => row.category === category);
              return (
                <div className="addon-editor__category" key={category}>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(rule)}
                      onChange={(event) => toggle(category, event.target.checked)}
                    />
                    {category}
                  </label>
                  {rule && (
                    <label>
                      Included per vehicle
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        step={1}
                        value={rule.includedQuantity}
                        required
                        onChange={(event) =>
                          setCategories((current) =>
                            current.map((row) =>
                              row.category === category
                                ? {
                                    ...row,
                                    includedQuantity:
                                      event.target.value === '' ? '' : Number(event.target.value),
                                  }
                                : row,
                            ),
                          )
                        }
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
          <label className="addon-editor__enabled">
            <input name="enabled" type="checkbox" defaultChecked={Boolean(value.enabled)} />
            Enable new rentals
          </label>
        </fieldset>
        <ErrorBox>{validation || action.error}</ErrorBox>
        <p className="addon-editor__note">
          Confirmed bookings retain their saved prices. A conflicting edit or stock reduction will
          be rejected by the server.
        </p>
        <div className="addon-editor__actions">
          <button
            type="button"
            className="rr-button--outline"
            disabled={action.busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="rr-button" disabled={action.busy}>
            {action.busy ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
