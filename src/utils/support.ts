import { appEnvironment } from '../config/env';

export function buildWhatsAppUrl(
  supportNumber: string | undefined,
  message: string,
  environment: 'production' | 'staging' | 'preview' = appEnvironment,
): string | null {
  const phone = supportNumber?.replace(/\D/g, '');
  if (!phone || phone.length < 7 || phone.length > 15) return null;
  const prefix = environment === 'production' ? '' : '[STAGING] ';
  return `https://wa.me/${phone}?text=${encodeURIComponent(`${prefix}${message}`)}`;
}

export function getWhatsAppSupportUrl(message: string): string | null {
  return buildWhatsAppUrl(import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER, message);
}
