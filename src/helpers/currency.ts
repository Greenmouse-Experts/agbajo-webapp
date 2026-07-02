export const formatCurrency = (amount: number) => {
  return `₦${amount.toLocaleString()}`;
};

export const converty_format_currency = (amount: string | number) => {
  const converted = Number(amount) / 100;
  return formatCurrency(converted);
};
