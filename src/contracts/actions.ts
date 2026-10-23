import { z } from "zod";

/**
 * The shape every server action returns (spec section 11). Screens branch on `ok` and, on
 * failure, show `error.message` as-is — it is already screen-ready wording, not a code to
 * translate.
 */
export type ActionError = {
  code: "unauthenticated" | "forbidden" | "not_found" | "invalid" | "conflict" | "rate_limited" | "upstream";
  message: string;
  fields?: Record<string, string>;
};
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}
export function fail(code: ActionError["code"], message: string, fields?: Record<string, string>): ActionResult<never> {
  return { ok: false, error: fields ? { code, message, fields } : { code, message } };
}

// --- auth module (spec section 7, section 11) ---

export const SignInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type SignInInput = z.infer<typeof SignInSchema>;

export const VerifyCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().length(6),
});
export type VerifyCodeInput = z.infer<typeof VerifyCodeSchema>;

export const ResendCodeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
export type ResendCodeInput = z.infer<typeof ResendCodeSchema>;

export const RequestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>;

// Minimum 12 characters per spec section 7.2/7.4. The common-password check happens in the
// action itself (against a short deny-list), not here — Zod validates shape, not a lookup.
export const PasswordSchema = z.string().min(12, "Use at least 12 characters.");

export const ResetPasswordSchema = z.object({
  password: PasswordSchema,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: PasswordSchema,
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const ChangeEmailSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email(),
});
export type ChangeEmailInput = z.infer<typeof ChangeEmailSchema>;

export const UpdateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  jobTitle: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(50).optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
