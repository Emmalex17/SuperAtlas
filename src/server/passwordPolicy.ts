/**
 * A short, well-known list, not an exhaustive check — spec section 7.2's "checked against
 * common passwords" doesn't name a source, so this covers the obvious cases (a handful of
 * passwords everyone tries first) rather than pulling in a long breached-password corpus for
 * a pilot of a handful of accounts.
 */
const COMMON_PASSWORDS = new Set(["password1234", "123456789012", "qwertyuiop12", "passwordpassword"]);

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password);
}
