export interface ProRequestInput {
  name: string;
  phone: string;
  email: string;
  feature: string;
  message: string;
}

export type ProRequestValidation =
  | { valid: true; value: ProRequestInput }
  | { valid: false; error: string };

export function validateProRequestInput(input: unknown): ProRequestValidation {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, error: 'Request details are required.' };
  }

  const values = input as Record<string, unknown>;
  const name = typeof values.name === 'string' ? values.name.trim() : '';
  const phone = typeof values.phone === 'string' ? values.phone.trim() : '';
  const email = typeof values.email === 'string' ? values.email.trim().toLowerCase() : '';
  const feature = typeof values.feature === 'string' ? values.feature.trim() : '';
  const message = typeof values.message === 'string' ? values.message.trim() : '';

  if (name.length < 2 || name.length > 100) {
    return { valid: false, error: 'Name must be between 2 and 100 characters.' };
  }
  if (phone.length < 7 || phone.length > 30 || (phone.match(/\d/g) || []).length < 7) {
    return { valid: false, error: 'Enter a valid phone number.' };
  }
  if (email.length > 254 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { valid: false, error: 'Enter a valid email address.' };
  }
  if (!feature || feature.length > 80) {
    return { valid: false, error: 'Feature must be between 1 and 80 characters.' };
  }
  if (message.length > 1000) {
    return { valid: false, error: 'Message must be 1000 characters or fewer.' };
  }

  return { valid: true, value: { name, phone, email, feature, message } };
}