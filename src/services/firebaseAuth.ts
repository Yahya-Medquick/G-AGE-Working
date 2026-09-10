// Firebase Phone Auth disabled — pending Firebase project configuration
// Re-enable when VITE_FIREBASE_API_KEY and related env vars are set in Railway

export { getOrCreateDeviceId } from "../utils/deviceFingerprint";

/*
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  Auth
} from "firebase/auth";

const isProduction = import.meta.env.PROD;
if (!isProduction) {
  // Only in development: log warning that real OTP will not send
  console.warn('[DEV] Firebase phone auth may use test credentials');
}

let app: any = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (!apiKey || !authDomain || !projectId) {
      throw new Error(
        'Firebase configuration error: Missing required environment variables (VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID).'
      );
    }

    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  }
  return auth;
}

// In-Memory Confirmation Handler Storage
let currentConfirmationResult: ConfirmationResult | null = null;

export function sanitizePhoneNumber(phone: string): string {
  let cleaned = phone.trim().replace(/[\s()\-]/g, '');

  if (cleaned.startsWith('+92')) {
    cleaned = '+92' + cleaned.slice(3).replace(/\D/g, '');
  } else if (cleaned.startsWith('0092')) {
    cleaned = '+92' + cleaned.slice(4).replace(/\D/g, '');
  } else if (cleaned.startsWith('92')) {
    cleaned = '+92' + cleaned.slice(2).replace(/\D/g, '');
  } else if (cleaned.startsWith('0')) {
    cleaned = '+92' + cleaned.slice(1).replace(/\D/g, '');
  } else if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.slice(1).replace(/\D/g, '');
  } else if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = '+92' + cleaned.replace(/\D/g, '');
  } else {
    cleaned = '+' + cleaned.replace(/\D/g, '');
  }

  return cleaned;
}

// Initialize or get reCAPTCHA verifier
export function getRecaptchaVerifier(containerId = "recaptcha-container"): RecaptchaVerifier {
  const authInstance = getFirebaseAuth();
  
  // Clear any existing window instance if needed
  if ((window as any).recaptchaVerifier) {
    try {
      (window as any).recaptchaVerifier.clear();
    } catch (e) {
      console.warn("Recaptcha verifier clear notice:", e);
    }
    (window as any).recaptchaVerifier = undefined;
  }

  // Ensure DOM container exists
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  const verifier = new RecaptchaVerifier(authInstance, containerId, {
    size: "invisible",
    callback: () => {
      console.log("[Firebase Phone Auth] reCAPTCHA verified successfully");
    },
    "expired-callback": () => {
      console.warn("[Firebase Phone Auth] reCAPTCHA expired, clearing verifier.");
      try {
        verifier.clear();
      } catch (e) {}
      (window as any).recaptchaVerifier = undefined;
    },
  });

  (window as any).recaptchaVerifier = verifier;
  return verifier;
}

export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  containerId = "recaptcha-container"
): Promise<{ success: boolean; message?: string }> {
  const sanitized = sanitizePhoneNumber(phoneNumber);

  try {
    const authInstance = getFirebaseAuth();
    const verifier = getRecaptchaVerifier(containerId);
    const confirmation = await signInWithPhoneNumber(authInstance, sanitized, verifier);
    currentConfirmationResult = confirmation;
    return { success: true, message: `OTP verification code sent to ${sanitized} via SMS.` };
  } catch (error: any) {
    console.error('[Firebase OTP Error]', error);
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {}
      (window as any).recaptchaVerifier = undefined;
    }

    const code = error?.code || '';
    if (code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format. Please enter a valid mobile number (e.g., 03264397102 or +923264397102).');
    } else if (code === 'auth/missing-phone-number') {
      throw new Error('Phone number is missing. Please enter your mobile number.');
    } else if (code === 'auth/quota-exceeded') {
      throw new Error('SMS quota exceeded for today. Please try again later or contact support.');
    } else if (code === 'auth/captcha-check-failed') {
      throw new Error('reCAPTCHA security check failed. Please refresh the page and try again.');
    } else if (code === 'auth/too-many-requests') {
      throw new Error('Too many OTP attempts. Please wait a few minutes before trying again.');
    } else if (code === 'auth/invalid-app-credential') {
      throw new Error('Phone authentication service configuration error. Please contact support.');
    }

    throw new Error(error?.message || 'Failed to send OTP. Please check your phone number and try again.');
  }
}

export async function verifyFirebasePhoneOtp(otpCode: string): Promise<boolean> {
  const cleanCode = otpCode.trim();

  if (!currentConfirmationResult) {
    throw new Error("No active verification session found. Please request a new OTP code.");
  }

  try {
    const result = await currentConfirmationResult.confirm(cleanCode);
    return !!result.user;
  } catch (error: any) {
    console.error("[Firebase Phone Auth] Verification error:", error);
    throw new Error(
      error?.code === 'auth/invalid-verification-code'
        ? 'Invalid verification code. Please check and try again.'
        : error?.code === 'auth/code-expired'
        ? 'Verification code has expired. Please request a new one.'
        : error?.message || 'Invalid verification code. Please check and try again.'
    );
  }
}
*/
