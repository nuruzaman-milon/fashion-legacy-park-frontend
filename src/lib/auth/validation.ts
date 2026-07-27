import * as z from "zod";

/**
 * Client-side mirrors of the backend's validation rules
 * (docs/auth.md#validation-rules). These catch mistakes before a round trip;
 * the server stays authoritative and apiFetch maps its validation errors into
 * the same per-field shape.
 */

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "At most 72 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a digit")
  .regex(/[@$!%*?&]/, "Include one of @ $ ! % * ? &");

const emailField = z.email("Please enter a valid email address");

const phoneField = z
  .string()
  .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile, e.g. 01712345678");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "At least 2 characters")
      .max(100, "At most 100 characters"),
    email: emailField,
    phone: phoneField.optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** "+880 1712-345678" / "8801712345678" → the backend's "01712345678" shape. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s()-]/g, "");
  if (digits.startsWith("+880")) return `0${digits.slice(4)}`;
  if (digits.startsWith("880")) return `0${digits.slice(3)}`;
  return digits;
}
