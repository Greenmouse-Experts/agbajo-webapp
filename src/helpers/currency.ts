export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

export const converty_format_currency = (amount: string | number) => {
  const converted = Number(amount) / 100;
  return formatCurrency(converted);
};
