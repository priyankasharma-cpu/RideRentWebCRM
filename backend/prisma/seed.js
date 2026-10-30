import { all, get, run, transaction } from '../src/config/database.js';
import { id, passwordHash, hash } from '../src/utils/crypto.js';
import { now } from '../src/utils/dateTime.js';
export const defaultSettings = {
  name: 'RideRent',
  phoneDisplay: '+91 98765 43210',
  phoneTel: '+919876543210',
  phonePlaceholder: true,
  email: 'hello@riderent.example',
  address: 'Demo Rental Studio, New Delhi, India',
  timezone: 'Asia/Kolkata',
  taxBps: 0,
  roundingMinutes: 60,
  lateGraceMinutes: 15,
  cancellationHours: 2,
  maxRentalDays: 30,
  currency: 'INR',
  fuelPolicy: 'Return with the same fuel level. Fuel is not included.',
  distancePolicy: '100 km per day included. Extra distance terms are confirmed at pickup.',
};
export async function seed(db) {
  if (!(await get(db, 'SELECT id FROM settings')))
    await run(db, 'INSERT INTO settings VALUES(1,?)', JSON.stringify(defaultSettings));
  if (!(await get(db, 'SELECT id FROM users'))) {
    if (!process.env.ADMIN_PASSWORD) throw Error('ADMIN_PASSWORD is required. Run npm run setup.');
    await run(
      db,
      'INSERT INTO users VALUES(?,?,?,?,?,?,?)',
      id(),
      'Shop Owner',
      process.env.ADMIN_EMAIL || 'admin@riderent.local',
      await passwordHash(process.env.ADMIN_PASSWORD),
      'admin',
      1,
      now(),
    );
  }
  if (await get(db, 'SELECT id FROM vehicles')) return;
  await transaction(db, async () => {
    const bike = '/images/fleet-bike.jpg',
      classic = '/images/fleet-classic.jpg',
      car = '/images/fleet-car.jpg';
    const records = [
      ['Yamaha R15 V4', 'Yamaha', 'Bike', 120, '155 CC', bike],
      ['Royal Enfield Classic 350', 'Royal Enfield', 'Bike', 100, '350 CC', classic],
      ['KTM Duke 250', 'KTM', 'Bike', 150, '250 CC', bike],
      ['Bajaj Pulsar NS200', 'Bajaj', 'Bike', 110, '200 CC', bike],
      ['Honda CB350', 'Honda', 'Bike', 130, '350 CC', classic],
      ['TVS Apache RTR', 'TVS', 'Bike', 100, '160 CC', bike],
      ['Royal Enfield Meteor', 'Royal Enfield', 'Bike', 140, '350 CC', classic],
      ['Yamaha MT15', 'Yamaha', 'Bike', 120, '155 CC', bike],
      ['Honda Activa 6G', 'Honda', 'Scooter', 80, '110 CC', '/images/scooter.png'],
      ['TVS Jupiter', 'TVS', 'Scooter', 80, '110 CC', '/images/scooter.png'],
      ['Suzuki Access 125', 'Suzuki', 'Scooter', 90, '125 CC', '/images/scooter.png'],
      ['Honda Dio', 'Honda', 'Scooter', 85, '110 CC', '/images/scooter.png'],
      ['TVS Ntorq', 'TVS', 'Scooter', 100, '125 CC', '/images/scooter.png'],
      ['Yamaha Fascino', 'Yamaha', 'Scooter', 90, '125 CC', '/images/scooter.png'],
      ['Maruti Swift', 'Maruti', 'Car', 250, '1200 CC', car],
      ['Hyundai i20', 'Hyundai', 'Car', 280, '1200 CC', car],
      ['Tata Nexon', 'Tata', 'Car', 320, '1500 CC', car],
      ['Toyota Innova', 'Toyota', 'Car', 300, '2400 CC', car],
      ['Maruti Baleno', 'Maruti', 'Car', 260, '1200 CC', car],
      ['Hyundai Creta', 'Hyundai', 'Car', 350, '1500 CC', car],
    ];
    await Promise.all(
      records.map(
        async (v, i) =>
          await run(
            db,
            'INSERT INTO vehicles VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            id(),
            v[0].toLowerCase().replaceAll(' ', '-'),
            v[0],
            v[1],
            v[2],
            `DL-DEMO-${String(i + 1).padStart(4, '0')}`,
            v[3] * 100,
            v[2] === 'Car' ? 500000 : 200000,
            v[2] === 'Car' && i % 2 ? 'Diesel' : 'Petrol',
            v[2] === 'Scooter' ? 'Automatic' : 'Manual',
            v[2] === 'Car' ? (v[0] === 'Toyota Innova' ? 7 : 5) : 2,
            v[4],
            v[5],
            `A carefully maintained ${v[0]} for your next journey. Sample fleet record; imagery is illustrative.`,
            1200 + i * 380,
            'Available',
            now(),
          ),
      ),
    );
    const vehicles = await all(db, 'SELECT * FROM vehicles ORDER BY rowid');
    const staff = (await get(db, 'SELECT id FROM users')).id;
    const hour = 3600000;
    const current = Date.now();
    const demo = [
      ['Aarav Demo', '9000000001', 0, 'completed', -72, -66, 'Website'],
      ['Meera Demo', '9000000002', 8, 'completed', -48, -42, 'Phone'],
      ['Kabir Demo', '9000000003', 14, 'completed', -24, -20, 'Walk-in'],
      ['Isha Demo', '9000000004', 2, 'active', -2, 4, 'Phone'],
      ['Rohan Demo', '9000000005', 15, 'active', -8, -2, 'Website'],
      ['Anaya Demo', '9000000006', 10, 'confirmed', 24, 30, 'Website'],
    ];
    for (const [name, phone, index, status, start, end, source] of demo) {
      const v = vehicles[index],
        customer = id(),
        booking = id(),
        startAt = new Date(current + start * hour).toISOString(),
        endAt = new Date(current + end * hour).toISOString(),
        hours = end - start,
        base = hours * v.rate;
      await run(
        db,
        'INSERT INTO customers VALUES(?,?,?,?,?,?)',
        customer,
        name,
        phone,
        '',
        1,
        now(),
      );
      await run(
        db,
        'INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        booking,
        'RR-DEMO-' + phone.slice(-4),
        hash(id()),
        customer,
        v.id,
        startAt,
        endAt,
        hours,
        v.rate,
        base,
        0,
        v.deposit,
        0,
        status,
        source,
        'Fictional demo booking',
        new Date(current + Math.min(start - 2, -1) * hour).toISOString(),
      );
      if (status !== 'confirmed') {
        const rental = id();
        await run(
          db,
          'INSERT INTO rentals VALUES(?,?,?,?,?,?,?,?,?,?)',
          rental,
          booking,
          startAt,
          status === 'completed' ? endAt : null,
          staff,
          status === 'completed' ? staff : null,
          v.odometer,
          status === 'completed' ? v.odometer + 60 : null,
          0,
          0,
        );
        await run(
          db,
          'INSERT INTO inspections VALUES(?,?,?,?,?,?,?,?)',
          id(),
          rental,
          'pickup',
          'Full',
          'Good',
          'Demo inspection',
          staff,
          startAt,
        );
        if (status === 'completed') {
          await run(
            db,
            'INSERT INTO inspections VALUES(?,?,?,?,?,?,?,?)',
            id(),
            rental,
            'return',
            'Full',
            'Good',
            'Demo inspection',
            staff,
            endAt,
          );
          await run(db, 'UPDATE vehicles SET odometer=? WHERE id=?', v.odometer + 60, v.id);
        }
      }
      const payment = id();
      await run(
        db,
        'INSERT INTO payments VALUES(?,?,?,?,?,?,?,?)',
        payment,
        booking,
        base,
        'rental',
        'Cash',
        'Fictional demo receipt',
        staff,
        status === 'completed' ? endAt : status === 'active' ? startAt : now(),
      );
      if (status === 'active')
        await run(
          db,
          'INSERT INTO payments VALUES(?,?,?,?,?,?,?,?)',
          id(),
          booking,
          v.deposit,
          'deposit',
          'Cash',
          'Fictional demo deposit',
          staff,
          startAt,
        );
    }
    const v = vehicles[19];
    await run(db, 'UPDATE vehicles SET status=? WHERE id=?', 'Maintenance', v.id);
    await run(
      db,
      'INSERT INTO maintenance VALUES(?,?,?,?,?,?,?)',
      id(),
      v.id,
      new Date(current - hour).toISOString(),
      new Date(current + 24 * hour).toISOString(),
      'Scheduled demo service',
      0,
      now(),
    );
  });
}
