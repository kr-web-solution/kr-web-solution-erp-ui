const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function twoDigits(n: number): string {
  const v = Math.abs(n) % 100;
  if (v < 20) return ONES[v];
  const tens = TENS[Math.floor(v / 10)];
  const ones = ONES[v % 10];
  return ones ? `${tens} ${ones}` : tens;
}

function threeDigits(n: number): string {
  const v = Math.abs(n) % 1000;
  if (v < 100) return twoDigits(v);
  const hundred = ONES[Math.floor(v / 100)];
  const rest = twoDigits(v % 100);
  return `${hundred} Hundred${rest ? ` ${rest}` : ''}`;
}

/** Indian-currency amount in words from paise (integer). */
export function amountInWordsInr(paise: number): string {
  const sign = paise < 0 ? 'Minus ' : '';
  const total = Math.abs(Math.trunc(paise || 0));
  const rupees = Math.floor(total / 100);
  const paisePart = total % 100;

  if (rupees === 0 && paisePart === 0) return 'Rupees Zero Only';

  const parts: string[] = [];
  let rem = rupees;
  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;

  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rem) parts.push(threeDigits(rem));

  const words = parts.filter(Boolean).join(' ').trim() || 'Zero';
  let out = `${sign}Rupees ${words}`;
  if (paisePart) out += ` and ${twoDigits(paisePart)} Paise`;
  return `${out} Only`;
}
