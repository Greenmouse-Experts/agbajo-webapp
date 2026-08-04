export const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    // style: "currency",
    // currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { dateStyle: "medium" });
