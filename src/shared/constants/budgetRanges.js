import { DIRHAM_SYMBOL } from "@/shared/utils/currency";

const s = DIRHAM_SYMBOL;

export const BUDGET_RANGE_OPTIONS = [
  `${s} 10,000 - ${s} 50,000`,
  `${s} 50,000 - ${s} 100,000`,
  `${s} 100,000 - ${s} 150,000`,
  `${s} 150,000 - ${s} 200,000`,
  `${s} 200,000 - ${s} 500,000`,
  `${s} 500,000+`,
];

export const DEFAULT_BUDGET_RANGE = `${s} 100,000 - ${s} 150,000`;
