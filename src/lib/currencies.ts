export interface Currency {
  code: string;
  symbol: string;
  name: string;
  symbolPosition: "before" | "after";
  decimals: number;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", symbolPosition: "before", decimals: 2 },
  { code: "EUR", symbol: "EUR", name: "Euro", symbolPosition: "after", decimals: 2 },
  { code: "GBP", symbol: "£", name: "British Pound", symbolPosition: "before", decimals: 2 },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", symbolPosition: "before", decimals: 2 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", symbolPosition: "before", decimals: 2 },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", symbolPosition: "before", decimals: 2 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", symbolPosition: "before", decimals: 2 },
  { code: "PLN", symbol: "zł", name: "Polish Zloty", symbolPosition: "after", decimals: 2 },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia", symbolPosition: "before", decimals: 2 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", symbolPosition: "before", decimals: 0 },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", symbolPosition: "after", decimals: 2 },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", symbolPosition: "after", decimals: 2 },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", symbolPosition: "after", decimals: 2 },
  { code: "DKK", symbol: "kr", name: "Danish Krone", symbolPosition: "after", decimals: 2 },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna", symbolPosition: "after", decimals: 2 },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", symbolPosition: "before", decimals: 2 },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", symbolPosition: "before", decimals: 2 },
  { code: "ARS", symbol: "AR$", name: "Argentine Peso", symbolPosition: "before", decimals: 2 },
  { code: "CLP", symbol: "CL$", name: "Chilean Peso", symbolPosition: "before", decimals: 0 },
  { code: "COP", symbol: "CO$", name: "Colombian Peso", symbolPosition: "before", decimals: 0 },
];

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}
