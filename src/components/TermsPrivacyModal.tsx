import React from 'react';
import { X, Shield, FileText } from 'lucide-react';
import { uiCopy, type UiLanguage } from '../i18n/ui';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
  language: UiLanguage;
}

const content = {
  english: {
    terms: `
# Terms of Service

Last Updated: October 7, 2026

Welcome to G-AGE AI. By using our service, you agree to these terms.

## 1. Use of Service
G-AGE AI provides educational assistance. You must use the service responsibly and for educational purposes.

## 2. Accounts
You are responsible for maintaining the security of your account.

## 3. Content
The AI provides information for study purposes. Always verify critical information.

## 4. Termination
We reserve the right to suspend accounts that violate our policies.
    `,
    privacy: `
# Privacy Policy

Last Updated: October 7, 2026

Your privacy is important to us.

## 1. Data Collection
We collect your name, email, and study preferences to provide a personalized experience.

## 2. Data Usage
Your data is used to improve our AI models and provide better educational support.

## 3. Data Protection
We use industry-standard security measures to protect your information.

## 4. Your Rights
You can export or delete your data at any time from the Me screen.
    `
  },
  'roman-urdu': {
    terms: `
# Terms of Service

Aakhri Update: October 7, 2026

G-AGE AI istemal karne ke liye in sharait ka manna zaroori hai.

## 1. Service ka Istemal
G-AGE AI parhai mein madad ke liye hai. Isay zimmedari se sirf educational maqasid ke liye istemal karein.

## 2. Accounts
Apne account ki hifazat aapki zimmedari hai.

## 3. Content
AI sirf parhai mein madad ke liye maloomat deta hai. Zaroori maloomat ki hamesha tasdeeq karein.

## 4. Termination
Policies ki khilaf-warzi par account band kiya ja sakta hai.
    `,
    privacy: `
# Privacy Policy

Aakhri Update: October 7, 2026

Aapki privacy hamare liye bohot aham hai.

## 1. Data Collection
Behtar tajurbe ke liye hum aapka naam, email aur parhai ki tarjehat save karte hain.

## 2. Data Usage
Aapka data AI models ko behtar banane aur parhai mein madad dene ke liye istemal hota hai.

## 3. Data Protection
Hum aapki maloomat ki hifazat ke liye jadeed security istemal karte hain.

## 4. Aapke Huqooq
Aap kisi bhi waqt 'Me' screen se apna data export ya delete kar sakte hain.
    `
  },
  urdu: {
    terms: `
# سروس کی شرائط

آخری اپ ڈیٹ: 7 اکتوبر 2026

G-AGE AI استعمال کرنے کے لیے ان شرائط کا ماننا ضروری ہے۔

## 1. سروس کا استعمال
G-AGE AI پڑھائی میں مدد کے لیے ہے۔ اسے ذمہ داری سے صرف تعلیمی مقاصد کے لیے استعمال کریں۔

## 2. اکاؤنٹس
اپنے اکاؤنٹ کی حفاظت آپ کی ذمہ داری ہے۔

## 3. مواد
AI صرف پڑھائی میں مدد کے لیے معلومات دیتا ہے۔ ضروری معلومات کی ہمیشہ تصدیق کریں۔

## 4. خاتمہ
پالیسیوں کی خلاف ورزی پر اکاؤنٹ معطل کیا جا سکتا ہے۔
    `,
    privacy: `
# رازداری کی پالیسی

آخری اپ ڈیٹ: 7 اکتوبر 2026

آپ کی رازداری ہمارے لیے بہت اہم ہے۔

## 1. ڈیٹا کا حصول
بہتر تجربے کے لیے ہم آپ کا نام، ای میل اور پڑھائی کی ترجیحات محفوظ کرتے ہیں۔

## 2. ڈیٹا کا استعمال
آپ کا ڈیٹا AI ماڈلز کو بہتر بنانے اور پڑھائی میں مدد دینے کے لیے استعمال ہوتا ہے۔

## 3. ڈیٹا کا تحفظ
ہم آپ کی معلومات کی حفاظت کے لیے جدید سیکیورٹی اقدامات کرتے ہیں۔

## 4. آپ کے حقوق
آپ کسی بھی وقت 'میری پروفائل' اسکرین سے اپنا ڈیٹا برآمد یا حذف کر سکتے ہیں۔
    `
  }
};

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({
  isOpen,
  onClose,
  type,
  language
}) => {
  if (!isOpen) return null;

  const t = (key: any) => uiCopy(language, key);
  const Icon = type === 'terms' ? FileText : Shield;
  const title = type === 'terms' ? t('sidebarTerms') : t('sidebarPrivacy');
  const text = content[language]?.[type] || content['english'][type];

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <section
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-tile border border-border bg-surface text-text shadow-popover"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="flex h-11 w-11 items-center justify-center rounded-pill text-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 prose dark:prose-invert max-w-none prose-sm sm:prose-base">
          {text.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 mt-2">{line.slice(2)}</h1>;
            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mb-3 mt-6">{line.slice(3)}</h2>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i} className="mb-3 text-muted-foreground">{line}</p>;
          })}
        </div>

        <footer className="border-t border-border p-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-control bg-accent text-accent-text font-semibold hover:opacity-90 transition-opacity"
          >
            {t('close')}
          </button>
        </footer>
      </section>
    </div>
  );
};
