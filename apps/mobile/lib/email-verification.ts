export const EMAIL_VERIFICATION_OTP_LENGTH = 6;

export function normalizeVerificationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeVerificationOtp(otp: string): string {
  return otp.replace(/\s+/g, '').trim();
}

export function isCompleteVerificationOtp(otp: string): boolean {
  return new RegExp(`^\\d{${String(EMAIL_VERIFICATION_OTP_LENGTH)}}$`).test(
    normalizeVerificationOtp(otp)
  );
}

export function parseVerificationSearchParams(params: {
  email?: string | string[];
  otp?: string | string[];
}): { email: string; otp: string } | null {
  const emailRaw = Array.isArray(params.email) ? params.email[0] : params.email;
  const otpRaw = Array.isArray(params.otp) ? params.otp[0] : params.otp;
  if (!emailRaw || !otpRaw) return null;
  const email = normalizeVerificationEmail(emailRaw);
  const otp = normalizeVerificationOtp(otpRaw);
  if (!email.includes('@') || !isCompleteVerificationOtp(otp)) return null;
  return { email, otp };
}
