import { settings } from '../settings/settings.service.js';
import { integerMoney, taxAmount } from '../../utils/money.js';

export async function price(database, vehicle, period) {
  const configuration = await settings(database);
  const base = integerMoney(Math.round(period.hours * vehicle.rate));
  const tax = taxAmount(base, configuration.taxBps);
  return {
    hours: period.hours,
    rate: vehicle.rate,
    base,
    tax,
    deposit: vehicle.deposit,
    total: integerMoney(base + tax + vehicle.deposit),
    roundingMinutes: configuration.roundingMinutes,
  };
}
