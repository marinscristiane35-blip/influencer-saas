export function money(value: string | number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(value ?? 0));
}

export function shortDate(value: Date | null | undefined) {
  return value ? new Intl.DateTimeFormat("pt-BR").format(value) : "-";
}

export function signedAmount(direction: "credit" | "debit", amount: string) {
  return `${direction === "credit" ? "+" : "-"} ${money(amount)}`;
}
