export function verifiedCheckoutSelections(selections, models, verified) {
  return selections.map((selection) => {
    const model = models?.find((model) => model.unitIds.includes(selection.vehicleId));
    const available = verified && Number.isSafeInteger(model?.available) ? model.available : 0;
    const wanted = selection.quantity === null ? 1 : selection.quantity;
    const quantity = Number.isSafeInteger(wanted) ? Math.max(0, Math.min(wanted, available)) : 0;
    return { vehicleId: selection.vehicleId, quantity };
  });
}

export function stepCheckoutSelection(selections, vehicleId, delta, maximum, displayedQuantity) {
  if (![-1, 1].includes(delta)) return selections;
  return selections.flatMap((selection) => {
    if (selection.vehicleId !== vehicleId) return [selection];
    const requested = selection.quantity === null ? displayedQuantity : selection.quantity;
    const current = Math.max(0, Math.min(requested, maximum));
    const quantity = Math.max(0, Math.min(current + delta, maximum));
    if (delta > 0 && quantity === current) return [selection];
    return quantity === 0 ? [] : [{ ...selection, quantity }];
  });
}

export function stepBoundedQuantity(current, delta, maximum) {
  const bounded = Math.max(0, Math.min(current, maximum));
  return Math.max(0, Math.min(bounded + delta, maximum));
}

export function removeCheckoutSelection(selections, vehicleId) {
  return selections.filter((selection) => selection.vehicleId !== vehicleId);
}

export function addOnSelectionLimits(option, rows, models, verified) {
  let included = 0,
    eligible = false;
  for (const row of rows) {
    if (row.quantity <= 0) continue;
    const model = models?.find((model) => model.unitIds.includes(row.vehicleId));
    const rule = option?.categories?.find((rule) => rule.category === model?.category);
    if (rule) {
      eligible = true;
      included += row.quantity * rule.includedQuantity;
    }
  }
  const maximum =
    verified && eligible && option && option.enabled !== false
      ? Math.max(0, Math.min(option.available, option.maxQuantity) - included)
      : 0;
  return { included, eligible, maximum };
}

export const helmetSelectionLimits = addOnSelectionLimits;

export function checkoutAddOnSelections(options, quantities, rows, models, verified) {
  return (options || [])
    .filter((option) => option.enabled !== false)
    .map((option) => {
      const limits = addOnSelectionLimits(option, rows, models, verified);
      const requested = Number.isSafeInteger(quantities[option.id]) ? quantities[option.id] : 0;
      return {
        option,
        ...limits,
        paidQuantity: verified
          ? Math.max(0, Math.min(requested, limits.maximum))
          : Math.max(0, requested),
      };
    })
    .filter((entry) => entry.eligible);
}
