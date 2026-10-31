import type { FeeItem } from './demo-model';
export const admissionTotal = (fees: FeeItem[]) => fees.reduce((sum, fee) => sum + fee.amount, 0);
