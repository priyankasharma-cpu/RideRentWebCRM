import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeCheckout } from '../../src/modules/bookings/booking.read.service.js';

function member({
  id,
  name,
  total,
  rentalTotal = total,
  base = rentalTotal,
  extra = 0,
  tax = 0,
  deposit = 0,
  rentalPaid = 0,
  depositPaid = 0,
  outstanding = total - rentalPaid - depositPaid,
  refundableDeposit = 0,
  status = 'confirmed',
  paymentState = 'pending',
  payments = [],
  addons = [],
}) {
  return {
    id,
    reference: `RR-${id}`,
    vehicle: { name },
    status,
    base,
    extra,
    tax,
    deposit,
    total,
    rentalTotal,
    rentalPaid,
    depositPaid,
    outstanding,
    refundableDeposit,
    paymentState,
    payments,
    addons,
  };
}

test('checkout summary sums the server-presented vehicle totals and itemizes each vehicle', () => {
  const checkout = summarizeCheckout('checkout-1', [
    member({ id: 'creta', name: 'Hyundai Creta', total: 20050 }),
    member({ id: 'nexon', name: 'Tata Nexon', total: 18760 }),
    member({ id: 'classic', name: 'Royal Enfield Classic 350', total: 6600 }),
  ]);

  assert.equal(checkout.totalPayable, 45410);
  assert.equal(checkout.total, checkout.totalPayable);
  assert.deepEqual(
    checkout.bookings.map(({ name, totalPayable }) => [name, totalPayable]),
    [
      ['Hyundai Creta', 20050],
      ['Tata Nexon', 18760],
      ['Royal Enfield Classic 350', 6600],
    ],
  );
});

test('checkout summary nets refunds and sums partial payments and outstanding balances once', () => {
  const checkout = summarizeCheckout('checkout-2', [
    member({
      id: 'a',
      name: 'Bike A',
      total: 10000,
      rentalPaid: 3000,
      outstanding: 7000,
      paymentState: 'partial',
      payments: [{ refunded: 500 }],
    }),
    member({
      id: 'b',
      name: 'Bike B',
      total: 5000,
      rentalPaid: 5000,
      outstanding: 0,
      paymentState: 'paid',
      payments: [{ refunded: 0 }],
    }),
  ]);

  assert.equal(checkout.totalPayable, 15000);
  assert.equal(checkout.amountPaid, 8000);
  assert.equal(checkout.amountRefunded, 500);
  assert.equal(checkout.outstanding, 7000);
  assert.equal(checkout.paymentState, 'partial');
});

test('a cancelled vehicle remains listed but contributes no current payable amount', () => {
  const checkout = summarizeCheckout('checkout-3', [
    member({ id: 'active', name: 'Active vehicle', total: 8000, outstanding: 8000 }),
    member({
      id: 'cancelled',
      name: 'Cancelled vehicle',
      total: 0,
      rentalTotal: 0,
      base: 0,
      tax: 0,
      status: 'cancelled',
      paymentState: 'refund_pending',
      payments: [{ refunded: 0 }],
    }),
  ]);

  assert.equal(checkout.bookings.length, 2);
  assert.equal(checkout.totalPayable, 8000);
  assert.equal(checkout.bookings[1].totalPayable, 0);
  assert.equal(checkout.paymentState, 'refund_pending');
});

test('addon charges and deposit are itemized without changing the booking total', () => {
  const checkout = summarizeCheckout('checkout-4', [
    member({
      id: 'helmet-bike',
      name: 'Bike',
      total: 1640,
      base: 1000,
      extra: 0,
      tax: 120,
      deposit: 300,
      rentalPaid: 1340,
      depositPaid: 0,
      outstanding: 300,
      paymentState: 'partial',
      addons: [
        {
          name: 'Helmet',
          quantity: 2,
          included_quantity: 1,
          base: 200,
          tax: 20,
        },
      ],
    }),
  ]);

  const [booking] = checkout.bookings;
  assert.equal(booking.rentalCharge, 1000);
  assert.equal(booking.tax, 140);
  assert.equal(booking.addOns[0].base + booking.addOns[0].tax, 220);
  assert.equal(booking.securityDeposit, 300);
  assert.equal(checkout.totalPayable, 1640);
});
