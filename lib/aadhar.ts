export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatAadharInput(value: string) {
  const digits = digitsOnly(value).slice(0, 12);
  const parts = [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8, 12)].filter(
    Boolean,
  );
  return parts.join("-");
}

export function maskAadhar(value: string) {
  const digits = digitsOnly(value);
  if (digits.length < 4) {
    return "XXXX-XXXX-XXXX";
  }
  return `XXXX-XXXX-${digits.slice(-4)}`;
}
