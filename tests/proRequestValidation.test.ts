import { describe, expect, it } from 'vitest';
import { validateProRequestInput } from '../src/utils/proRequestValidation';

const validInput = {
  name: 'Student Name',
  phone: '+92 300 1234567',
  email: 'STUDENT@example.com',
  feature: 'Unlimited AI queries',
  message: 'Please share Pro details.',
};

describe('validateProRequestInput', () => {
  it('accepts and normalizes valid guest or logged-in request details', () => {
    expect(validateProRequestInput(validInput)).toEqual({
      valid: true,
      value: { ...validInput, email: 'student@example.com' },
    });
  });

  it('rejects missing required fields and malformed email', () => {
    expect(validateProRequestInput({ ...validInput, name: ' ' }).valid).toBe(false);
    expect(validateProRequestInput({ ...validInput, phone: '123' }).valid).toBe(false);
    expect(validateProRequestInput({ ...validInput, email: 'not-an-email' }).valid).toBe(false);
  });

  it('rejects values exceeding configured limits', () => {
    expect(validateProRequestInput({ ...validInput, name: 'N'.repeat(101) }).valid).toBe(false);
    expect(validateProRequestInput({ ...validInput, feature: 'F'.repeat(81) }).valid).toBe(false);
    expect(validateProRequestInput({ ...validInput, message: 'M'.repeat(1001) }).valid).toBe(false);
  });
});