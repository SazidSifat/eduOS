export const DEMO_TODAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Dhaka',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
export const money = (amount: number) =>
  `BDT ${(amount / 100).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
