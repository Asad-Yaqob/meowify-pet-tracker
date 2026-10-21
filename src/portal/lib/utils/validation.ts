/**
 * Email and Password Validation Helpers
 * Blocks disposable/temp emails and enforces strong password rules.
 */

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'guerrillamail.net',
  'throwawaymail.com',
  'yopmail.com',
  'sharklasers.com',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
  'fakeinbox.com',
  'tempail.com',
  'mohmal.com',
  'mytemp.email',
  'burnermail.io',
  'emailondeck.com',
  'generator.email',
  'crazymailing.com',
  'inboxkitten.com',
]);

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { isValid: true };

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address.' };
  }

  const domain = trimmed.split('@')[1];
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { isValid: false, error: 'Temporary or disposable email addresses are not allowed.' };
  }

  return { isValid: true };
};

export const validateStrongPassword = (password: string): { isValid: boolean; error?: string } => {
  const trimmed = password.trim();
  if (!trimmed) return { isValid: true };

  if (trimmed.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(trimmed)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(trimmed)) {
    return { isValid: false, error: 'Password must contain at least one number (0-9).' };
  }
  if (!/[^A-Za-z0-9]/.test(trimmed)) {
    return { isValid: false, error: 'Password must contain at least one special character (!@#$%^&*).' };
  }

  return { isValid: true };
};
