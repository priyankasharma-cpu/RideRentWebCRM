import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { unlinkSync } from 'node:fs';
import { openDb, get, all, run } from '../../src/config/database.js';
import { now } from '../../src/utils/dateTime.js';
import { uploadDirectory } from '../../src/config/paths.js';
import { seed } from '../../prisma/seed.js';
import { createApp } from '../../src/app.js';
import { settings } from '../../src/modules/settings/settings.service.js';
import { createBooking } from '../../src/modules/bookings/booking.service.js';
import { dashboard } from '../../src/modules/analytics/analytics.service.js';
let db, server, url, admin, guest, vehicles;
const password = 'Test-Admin-Password-2026!';
async function client() {
  const response = await fetch(url + '/api/session');
  const session = await response.json();
  let cookie = response.headers.get('set-cookie').split(';')[0],
    csrf = session.csrf;
  return {
    async request(path, { method = 'GET', body, form, token, origin, csrfOverride } = {}) {
      const r = await fetch(url + '/api' + path, {
        method,
        headers: {
          Cookie: cookie,
          ...(form
            ? {}
            : {
                'Content-Type': 'application/json',
              }),
          ...(method === 'GET'
            ? {}
            : {
                'X-CSRF-Token': csrfOverride ?? csrf,
              }),
          ...(origin
            ? {
                Origin: origin,
              }
            : {}),
          ...(token
            ? {
                'X-Booking-Token': token,
              }
            : {}),
        },
        ...(form
          ? {
              body: form,
            }
          : body
            ? {
                body: JSON.stringify(body),
              }
            : {}),
      });
      const data = await r.json();
      if (data.csrf) {
        csrf = data.csrf;
        cookie = r.headers.get('set-cookie')?.split(';')[0] || cookie;
      }
      return {
        status: r.status,
        data,
        headers: r.headers,
      };
    },
  };
}
const period = (offset = 24, duration = 4) => ({
  startsAt: new Date(Date.now() + offset * 3600000).toISOString(),
  endsAt: new Date(Date.now() + (offset + duration) * 3600000).toISOString(),
});
const details = (v, extra = {}) => ({
  vehicleId: v.id,
  name: 'Test Rider',
  phone: '9888800011',
  email: 'rider@example.com',
  agreement: true,
  ...period(),
  ...extra,
});
before(async () => {
  process.env.ADMIN_PASSWORD = password;
  process.env.ADMIN_EMAIL = 'test@riderent.local';
  db = await openDb(':memory:');
  await seed(db);
  server = createApp(db).listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  url = 'http://127.0.0.1:' + server.address().port;
  admin = await client();
  const login = await admin.request('/login', {
    method: 'POST',
    body: {
      email: 'test@riderent.local',
      password,
    },
  });
  assert.equal(login.status, 200);
  guest = await client();
  vehicles = await all(db, 'SELECT * FROM vehicles ORDER BY rowid');
});
after(async () => {
  await new Promise((r) => server.close(r));
  await db.close();
});
test('seed contains 20 vehicles, 8 bikes, 6 scooters, 6 cars and consistent KPI data', async () => {
  assert.equal(vehicles.length, 20);
  for (const [category, count] of [
    ['Bike', 8],
    ['Scooter', 6],
    ['Car', 6],
  ])
    assert.equal(vehicles.filter((v) => v.category === category).length, count);
  const r = await admin.request('/admin/dashboard');
  assert.equal(r.data.kpis.totalVehicles, 20);
  assert.equal(r.data.kpis.overdue, 1);
  assert.equal(r.data.kpis.completed, 3);
  assert.equal(r.data.kpis.maintenance, 1);
  assert.equal(r.data.kpis.totalBookings, 6);
});
test('admin authorization, CSRF and cross-origin writes are enforced', async () => {
  assert.equal((await guest.request('/admin/bookings')).status, 401);
  assert.equal(
    (
      await guest.request('/bookings', {
        method: 'POST',
        body: details(vehicles[0]),
        csrfOverride: 'invalid',
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await guest.request('/bookings', {
        method: 'POST',
        body: details(vehicles[0]),
        origin: 'https://evil.example',
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await guest.request('/login', {
        method: 'POST',
        body: {
          email: 'test@riderent.local',
          password: 'wrong',
        },
      })
    ).status,
    401,
  );
});
test('server pricing uses integer minor units and rounds up with disclosed policy', async () => {
  const r = await guest.request('/quote', {
    method: 'POST',
    body: {
      vehicleId: vehicles[0].id,
      ...period(40, 1.1),
    },
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.hours, 2);
  assert.equal(r.data.base, 2 * vehicles[0].rate);
  assert.equal(r.data.total, r.data.base + r.data.tax + r.data.deposit);
  assert.equal(r.data.roundingMinutes, 60);
});
test('website booking persists, requires token, and customer lookup is scoped', async () => {
  const r = await guest.request('/bookings', {
    method: 'POST',
    body: details(vehicles[0], {
      ...period(80),
    }),
  });
  assert.equal(r.status, 201);
  assert.equal(r.data.booking.source, 'Website');
  assert.equal(r.data.booking.status, 'confirmed');
  assert.ok(await get(db, 'SELECT id FROM bookings WHERE id=?', r.data.booking.id));
  assert.equal((await guest.request('/bookings/' + r.data.booking.id)).status, 403);
  assert.equal(
    (
      await guest.request('/bookings/' + r.data.booking.id, {
        token: r.data.token,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await guest.request('/bookings/lookup', {
        method: 'POST',
        body: {
          reference: r.data.booking.reference,
          phone: '1111111111',
        },
      })
    ).status,
    404,
  );
  const lookup = await guest.request('/bookings/lookup', {
    method: 'POST',
    body: {
      reference: r.data.booking.reference,
      phone: '9888800011',
    },
  });
  assert.equal(lookup.status, 200);
  assert.equal(lookup.data.booking.id, r.data.booking.id);
});
test('simultaneous website/admin reservations cannot double book the same vehicle', async () => {
  const input = details(vehicles[1], {
    ...period(90),
  });
  const result = await Promise.all([
    guest.request('/bookings', {
      method: 'POST',
      body: input,
    }),
    admin.request('/admin/bookings', {
      method: 'POST',
      body: {
        ...input,
        source: 'Phone',
      },
    }),
  ]);
  assert.deepEqual(result.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    (
      await get(
        db,
        "SELECT COUNT(*) n FROM bookings WHERE vehicle_id=? AND status='confirmed'",
        vehicles[1].id,
      )
    ).n,
    1,
  );
});
test('adjacent reservations are allowed, cancellation releases only its time window', async () => {
  const p = period(100);
  const a = await admin.request('/admin/bookings', {
    method: 'POST',
    body: details(vehicles[3], {
      ...p,
      source: 'Walk-in',
    }),
  });
  assert.equal(a.status, 201);
  const b = await admin.request('/admin/bookings', {
    method: 'POST',
    body: details(vehicles[3], {
      startsAt: p.endsAt,
      endsAt: new Date(new Date(p.endsAt).getTime() + 3600000).toISOString(),
      source: 'Phone',
    }),
  });
  assert.equal(b.status, 201);
  const cancel = await admin.request('/bookings/' + a.data.booking.id + '/cancel', {
    method: 'POST',
  });
  assert.equal(cancel.status, 200);
  const q = await guest.request('/quote', {
    method: 'POST',
    body: {
      vehicleId: vehicles[3].id,
      ...p,
    },
  });
  assert.equal(q.data.available, true);
});
test('maintenance blocks, active and overdue rentals prevent conflicting bookings', async () => {
  const p = period(120);
  const m = await admin.request('/admin/maintenance', {
    method: 'POST',
    body: {
      vehicleId: vehicles[4].id,
      ...p,
      reason: 'Test scheduled service',
    },
  });
  assert.equal(m.status, 201);
  assert.equal(
    (
      await guest.request('/bookings', {
        method: 'POST',
        body: details(vehicles[4], p),
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await guest.request('/bookings', {
        method: 'POST',
        body: details(vehicles[15]),
      })
    ).status,
    409,
  );
});
test('rescheduling preserves historical rates and excludes the current reservation', async () => {
  const created = await admin.request('/admin/bookings', {
    method: 'POST',
    body: details(vehicles[5], {
      ...period(140),
      source: 'Phone',
    }),
  });
  const b = created.data.booking;
  await run(db, 'UPDATE vehicles SET rate=rate+1000 WHERE id=?', b.vehicle_id);
  const r = await admin.request('/bookings/' + b.id + '/reschedule', {
    method: 'POST',
    body: period(141, 6),
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.rate, b.rate);
  assert.equal(r.data.base, b.rate * 6);
  assert.equal(r.data.hours, 6);
});
test('full lifecycle requires license, logs actual times, settles payments, inspects and refunds deposit', async () => {
  const created = await admin.request('/admin/bookings', {
    method: 'POST',
    body: details(vehicles[6], {
      ...period(0.1, 2),
      source: 'Walk-in',
      phone: '9888800022',
    }),
  });
  assert.equal(created.status, 201);
  let b = created.data.booking;
  const pickup = {
    odometer: b.vehicle.odometer,
    fuel: 'Full',
    condition: 'Good',
    notes: 'Test pickup',
  };
  assert.equal(
    (
      await admin.request('/admin/bookings/' + b.id + '/pickup', {
        method: 'POST',
        body: pickup,
      })
    ).status,
    409,
  );
  await admin.request('/admin/customers/' + b.customer.id, {
    method: 'PATCH',
    body: {
      verified: true,
    },
  });
  const picked = await admin.request('/admin/bookings/' + b.id + '/pickup', {
    method: 'POST',
    body: pickup,
  });
  assert.equal(picked.status, 200);
  assert.equal(picked.data.status, 'active');
  assert.ok(picked.data.rental.pickup_at);
  const returned = await admin.request('/admin/bookings/' + b.id + '/return', {
    method: 'POST',
    body: {
      ...pickup,
      odometer: pickup.odometer + 10,
      additional: 5000,
    },
  });
  assert.equal(returned.status, 200);
  b = returned.data;
  assert.equal(b.status, 'inspecting');
  assert.ok(b.rental.return_at);
  assert.equal(
    (
      await guest.request('/quote', {
        method: 'POST',
        body: {
          vehicleId: b.vehicle_id,
          ...period(200),
        },
      })
    ).data.available,
    false,
  );
  assert.equal(
    (
      await admin.request('/admin/bookings/' + b.id + '/complete', {
        method: 'POST',
        body: {
          roadReady: true,
        },
      })
    ).status,
    409,
  );
  for (const [purpose, amount] of [
    ['rental', b.rentalTotal],
    ['deposit', b.deposit],
  ])
    assert.equal(
      (
        await admin.request('/admin/bookings/' + b.id + '/payments', {
          method: 'POST',
          body: {
            purpose,
            amount,
            method: 'Cash',
          },
        })
      ).status,
      200,
    );
  const complete = await admin.request('/admin/bookings/' + b.id + '/complete', {
    method: 'POST',
    body: {
      roadReady: true,
    },
  });
  assert.equal(complete.status, 200);
  assert.equal(complete.data.status, 'completed');
  assert.equal(complete.data.outstanding, 0);
  assert.equal(
    (
      await guest.request('/quote', {
        method: 'POST',
        body: {
          vehicleId: b.vehicle_id,
          ...period(200),
        },
      })
    ).data.available,
    true,
  );
  const p = complete.data.payments.find((p) => p.purpose === 'deposit');
  assert.equal(
    (
      await admin.request('/admin/payments/' + p.id + '/refund', {
        method: 'POST',
        body: {
          amount: p.amount,
          reason: 'Test deposit returned',
        },
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await admin.request('/admin/payments/' + p.id + '/refund', {
        method: 'POST',
        body: {
          amount: 1,
          reason: 'Duplicate refund',
        },
      })
    ).status,
    400,
  );
  const view = await admin.request('/bookings/' + b.id);
  assert.equal(view.data.depositPaid, 0);
  assert.equal(view.data.inspections.length, 2);
});
test('late fees use historical rate after grace and never auto-release overdue rentals', async () => {
  const b = await get(db, "SELECT * FROM bookings WHERE status='active' AND ends_at<?", now());
  const v = await get(db, 'SELECT * FROM vehicles WHERE id=?', b.vehicle_id);
  const r = await admin.request('/admin/bookings/' + b.id + '/return', {
    method: 'POST',
    body: {
      odometer: v.odometer + 20,
      fuel: 'Half',
      condition: 'Good',
      notes: 'Overdue test',
      additional: 0,
    },
  });
  assert.equal(r.status, 200);
  assert.ok(r.data.rental.late_minutes >= 120);
  const minutes = r.data.rental.late_minutes;
  assert.equal(
    r.data.extra,
    Math.ceil((minutes - (await settings(db)).lateGraceMinutes) / 60) * b.rate,
  );
  assert.equal(r.data.status, 'inspecting');
  const list = await admin.request('/admin/vehicles');
  assert.equal(list.data.find((v) => v.id === b.vehicle_id).physicalStatus, 'Inspection');
});
test('staff role cannot change fleet, shop configuration, staff or refund records', async () => {
  const created = await admin.request('/admin/staff', {
    method: 'POST',
    body: {
      name: 'Test Staff',
      email: 'staff@example.com',
      password: 'Staff-Test-Password!',
      role: 'staff',
    },
  });
  assert.equal(created.status, 201);
  const staff = await client();
  await staff.request('/login', {
    method: 'POST',
    body: {
      email: 'staff@example.com',
      password: 'Staff-Test-Password!',
    },
  });
  assert.equal((await staff.request('/admin/dashboard')).status, 200);
  assert.equal((await staff.request('/admin/staff')).status, 403);
  assert.equal(
    (
      await staff.request('/admin/settings', {
        method: 'PUT',
        body: {},
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await staff.request('/admin/vehicles', {
        method: 'POST',
        body: {},
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await staff.request('/admin/payments/unknown/refund', {
        method: 'POST',
        body: {},
      })
    ).status,
    403,
  );
});
test('invalid dates, past rentals, negative payments and invalid uploads are rejected', async () => {
  assert.equal(
    (
      await guest.request('/bookings', {
        method: 'POST',
        body: details(vehicles[7], {
          ...period(-10),
        }),
      })
    ).status,
    400,
  );
  const p = period(300);
  assert.equal(
    (
      await guest.request('/bookings', {
        method: 'POST',
        body: details(vehicles[7], {
          startsAt: p.endsAt,
          endsAt: p.startsAt,
        }),
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await admin.request('/admin/bookings/unknown/payments', {
        method: 'POST',
        body: {
          amount: -100,
          purpose: 'rental',
          method: 'Cash',
        },
      })
    ).status,
    400,
  );
  assert.ok((await all(db, 'SELECT * FROM audit')).length > 10);
});
test('new public booking does not disclose an existing customer profile or reuse license verification', async () => {
  const original = await get(db, 'SELECT * FROM customers WHERE phone=?', '9000000001');
  const result = await guest.request('/bookings', {
    method: 'POST',
    body: details(vehicles[7], {
      ...period(250),
      name: 'Another Demo Rider',
      phone: original.phone,
      email: 'new-demo@example.com',
      verified: true,
    }),
  });
  assert.equal(result.status, 201);
  assert.equal(result.data.booking.customer.name, 'Another Demo Rider');
  assert.equal(result.data.booking.customer.email, 'new-demo@example.com');
  assert.equal(result.data.booking.customer.verified, 0);
  const fetched = await guest.request('/bookings/' + result.data.booking.id, {
    token: result.data.token,
  });
  assert.equal(fetched.data.customer.name, 'Another Demo Rider');
  assert.equal(
    (await get(db, 'SELECT name FROM customers WHERE id=?', original.id)).name,
    original.name,
  );
});
test('administrator can create/edit/deactivate fleet with server validation', async () => {
  const input = {
    name: 'Test Electric Scooter',
    brand: 'Demo',
    category: 'Scooter',
    registration: 'TEST-100',
    rate: 12500,
    deposit: 100000,
    fuel: 'Electric',
    transmission: 'Automatic',
    seats: 2,
    engine: '3 kWh',
    image: '/images/scooter.png',
    description: 'Fictional integration-test vehicle',
    odometer: 50,
    status: 'Available',
  };
  const created = await admin.request('/admin/vehicles', {
    method: 'POST',
    body: input,
  });
  assert.equal(created.status, 201);
  const v = created.data;
  const edited = await admin.request('/admin/vehicles/' + v.id, {
    method: 'PUT',
    body: {
      ...input,
      rate: 15000,
      odometer: 60,
    },
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.rate, 15000);
  assert.equal(
    (
      await admin.request('/admin/vehicles/' + v.id, {
        method: 'PUT',
        body: {
          ...input,
          odometer: 10,
        },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await admin.request('/admin/vehicles', {
        method: 'POST',
        body: input,
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await admin.request('/admin/vehicles/' + v.id, {
        method: 'PUT',
        body: {
          ...input,
          odometer: 60,
          status: 'Inactive',
        },
      })
    ).status,
    200,
  );
  assert.equal((await guest.request('/vehicles/' + v.slug)).status, 404);
});
test('image uploads accept PNG and reject executable SVG/HTML content', async () => {
  const form = new FormData();
  form.append(
    'image',
    new Blob(
      [
        Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH9sAAAAASUVORK5CYII=',
          'base64',
        ),
      ],
      {
        type: 'image/png',
      },
    ),
    'pixel.png',
  );
  const result = await admin.request('/admin/uploads', {
    method: 'POST',
    form,
  });
  assert.equal(result.status, 201);
  assert.ok(result.data.url.startsWith('/images/uploads/'));
  const response = await fetch(url + result.data.url);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  unlinkSync(uploadDirectory + '/' + result.data.url.split('/').at(-1));
  const bad = new FormData();
  bad.append(
    'image',
    new Blob(['<svg onload="alert(1)"></svg>'], {
      type: 'image/svg+xml',
    }),
    'bad.svg',
  );
  assert.equal(
    (
      await admin.request('/admin/uploads', {
        method: 'POST',
        form: bad,
      })
    ).status,
    400,
  );
});
test('configured tax/billing blocks affect new quotes without changing historical bookings', async () => {
  const previous = await settings(db);
  const historical = await get(db, 'SELECT * FROM bookings LIMIT 1');
  const updated = await admin.request('/admin/settings', {
    method: 'PUT',
    body: {
      ...previous,
      taxBps: 1800,
      roundingMinutes: 30,
    },
  });
  assert.equal(updated.status, 200);
  try {
    const q = await guest.request('/quote', {
      method: 'POST',
      body: {
        vehicleId: vehicles[9].id,
        ...period(350, 1.1),
      },
    });
    assert.equal(q.data.hours, 1.5);
    assert.equal(q.data.tax, Math.round(q.data.base * 0.18));
    assert.equal(
      (await get(db, 'SELECT base FROM bookings WHERE id=?', historical.id)).base,
      historical.base,
    );
  } finally {
    await admin.request('/admin/settings', {
      method: 'PUT',
      body: previous,
    });
  }
});
test('disabling staff invalidates their existing session', async () => {
  const staff = await client();
  await staff.request('/login', {
    method: 'POST',
    body: {
      email: 'staff@example.com',
      password: 'Staff-Test-Password!',
    },
  });
  assert.equal((await staff.request('/admin/dashboard')).status, 200);
  const u = await get(db, 'SELECT id FROM users WHERE email=?', 'staff@example.com');
  assert.equal(
    (
      await admin.request('/admin/staff/' + u.id, {
        method: 'PATCH',
        body: {
          active: false,
        },
      })
    ).status,
    200,
  );
  assert.equal((await staff.request('/admin/dashboard')).status, 401);
  assert.equal(
    (
      await admin.request(
        '/admin/staff/' +
          (await get(db, 'SELECT id FROM users WHERE email=?', 'test@riderent.local')).id,
        {
          method: 'PATCH',
          body: {
            active: false,
          },
        },
      )
    ).status,
    400,
  );
});
test('started maintenance stays unavailable until an explicit service completion', async () => {
  const v = vehicles[12];
  const result = await admin.request('/admin/maintenance', {
    method: 'POST',
    body: {
      vehicleId: v.id,
      ...period(-6, 2),
      reason: 'Unresolved past service test',
    },
  });
  assert.equal(result.status, 201);
  let list = await admin.request('/admin/vehicles');
  assert.equal(list.data.find((x) => x.id === v.id).physicalStatus, 'Maintenance');
  const quote = await guest.request('/quote', {
    method: 'POST',
    body: {
      vehicleId: v.id,
      ...period(400),
    },
  });
  assert.equal(quote.data.available, false);
  const record = await get(
    db,
    'SELECT id FROM maintenance WHERE reason=?',
    'Unresolved past service test',
  );
  assert.equal(
    (
      await admin.request('/admin/maintenance/' + record.id + '/resolve', {
        method: 'POST',
      })
    ).status,
    200,
  );
  list = await admin.request('/admin/vehicles');
  assert.equal(list.data.find((x) => x.id === v.id).physicalStatus, 'Available');
});
test('failed road-readiness inspection creates a maintenance task before vehicle release', async () => {
  const b = await get(db, "SELECT * FROM bookings WHERE status='inspecting' LIMIT 1");
  assert.ok(b);
  let view = (await admin.request('/bookings/' + b.id)).data;
  await admin.request('/admin/bookings/' + b.id + '/payments', {
    method: 'POST',
    body: {
      amount: view.outstanding,
      purpose: 'rental',
      method: 'Cash',
    },
  });
  const closed = await admin.request('/admin/bookings/' + b.id + '/complete', {
    method: 'POST',
    body: {
      roadReady: false,
    },
  });
  assert.equal(closed.status, 200);
  let list = await admin.request('/admin/vehicles');
  assert.equal(list.data.find((v) => v.id === b.vehicle_id).physicalStatus, 'Maintenance');
  const service = await get(
    db,
    'SELECT * FROM maintenance WHERE vehicle_id=? AND resolved=0',
    b.vehicle_id,
  );
  assert.ok(service);
  await admin.request('/admin/maintenance/' + service.id + '/resolve', {
    method: 'POST',
  });
  list = await admin.request('/admin/vehicles');
  assert.equal(list.data.find((v) => v.id === b.vehicle_id).physicalStatus, 'Available');
});

test('independent Prisma connections serialize conflicting reservations without deadlocks', async () => {
  const secondConnection = await openDb(db.filename);
  try {
    const input = details(vehicles[9], { ...period(500), phone: '9888800055' });
    const outcomes = await Promise.allSettled([
      createBooking(db, input),
      createBooking(secondConnection, input),
    ]);
    assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
    const rejected = outcomes.find((result) => result.status === 'rejected');
    assert.equal(rejected.reason.status, 409);
  } finally {
    await secondConnection.close();
  }
});

test('historical rental totals above 32-bit range preserve integer money through Prisma', async () => {
  const created = await admin.request('/admin/vehicles', {
    method: 'POST',
    body: {
      name: 'High-value Demo Vehicle',
      brand: 'Demo',
      category: 'Car',
      registration: 'TEST-LARGE-MONEY',
      rate: 10_000_000,
      deposit: 100_000,
      fuel: 'Petrol',
      transmission: 'Manual',
      seats: 5,
      engine: '2000 CC',
      image: '/images/fleet-car.jpg',
      description: 'Test fixture',
      odometer: 0,
      status: 'Available',
    },
  });
  assert.equal(created.status, 201);
  const start = Date.now() + 600 * 3_600_000;
  const booked = await admin.request('/admin/bookings', {
    method: 'POST',
    body: details(created.data, {
      startsAt: new Date(start).toISOString(),
      endsAt: new Date(start + 720 * 3_600_000).toISOString(),
      source: 'Phone',
    }),
  });
  assert.equal(booked.status, 201);
  assert.equal(booked.data.booking.base, 7_200_000_000);
  const fetched = await admin.request('/bookings/' + booked.data.booking.id);
  assert.equal(fetched.data.base, 7_200_000_000);
  assert.ok(Number.isSafeInteger(fetched.data.total));
});

test('dashboard batches reads and reports actual database receipt and fleet totals', async () => {
  let queries = 0;
  const measured = await openDb(db.filename, {
    queryObserver: () => {
      queries += 1;
    },
  });
  try {
    queries = 0;
    const result = await dashboard(measured);
    assert.ok(queries < 30, `Dashboard issued ${queries} queries`);
    assert.equal(
      result.kpis.totalVehicles,
      (await get(db, 'SELECT COUNT(*) count FROM vehicles')).count,
    );
    assert.equal(
      result.kpis.totalBookings,
      (await get(db, 'SELECT COUNT(*) count FROM bookings')).count,
    );
    const receipts = await get(
      db,
      "SELECT SUM(p.amount-COALESCE((SELECT SUM(amount) FROM refunds WHERE payment_id=p.id),0)) total FROM payments p WHERE p.purpose='rental'",
    );
    assert.equal(result.kpis.totalRentalReceipts, receipts.total);
  } finally {
    await measured.close();
  }
});
