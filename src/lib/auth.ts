const encoder = new TextEncoder();

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function expectedSessionValue(): Promise<string> {
  const data = encoder.encode(`${process.env.AUTH_PASSWORD}:${process.env.AUTH_SECRET}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufToHex(digest);
}

export async function isValidPassword(input: string): Promise<boolean> {
  return input === process.env.AUTH_PASSWORD;
}

export async function isValidSessionCookie(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const expected = await expectedSessionValue();
  return value === expected;
}
