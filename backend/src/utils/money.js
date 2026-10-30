export function integerMoney(value) {
  if (!Number.isSafeInteger(value))
    throw new Error('Money must be an exact integer in minor units.');
  return value;
}

export const taxAmount = (base, basisPoints) =>
  integerMoney(Math.round((base * basisPoints) / 10_000));
