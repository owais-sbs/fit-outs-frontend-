/** Finance billing template: % of approved BOQ grand total (not programme-gate presets). */
export const FINANCE_BOQ_PAYMENT_SLICES = [
  { id: "p1", name: "Payment 1", percent: 50 },
  { id: "p2", name: "Payment 2", percent: 20 },
  { id: "p3", name: "Payment 3", percent: 20 },
  { id: "p4", name: "Payment 4", percent: 5 },
  { id: "p5", name: "Payment 5", percent: 5 },
];

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Allocate AED amounts from grandTotal across selected slices by percent.
 * When all five template slices are selected, remainder fils go on the last slice.
 */
export function allocatePercents(grandTotal, selectedSlices) {
  const total = Number(grandTotal) || 0;
  if (total <= 0 || !Array.isArray(selectedSlices) || selectedSlices.length === 0) {
    return [];
  }

  const allFiveSelected =
    selectedSlices.length === FINANCE_BOQ_PAYMENT_SLICES.length &&
    FINANCE_BOQ_PAYMENT_SLICES.every((templateSlice) =>
      selectedSlices.some((slice) => slice.id === templateSlice.id)
    );

  const allocated = selectedSlices.map((slice) => ({
    ...slice,
    amount: round2((total * slice.percent) / 100),
  }));

  if (allFiveSelected && allocated.length > 0) {
    const sum = allocated.reduce((acc, row) => acc + row.amount, 0);
    const remainder = round2(total - sum);
    if (remainder !== 0) {
      const last = allocated[allocated.length - 1];
      last.amount = round2(last.amount + remainder);
    }
  }

  return allocated;
}

export function createFinanceTemplateRows() {
  return FINANCE_BOQ_PAYMENT_SLICES.map((slice) => ({
    ...slice,
    selected: true,
    dueDate: "",
  }));
}
