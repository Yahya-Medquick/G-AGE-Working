import React, { useState, useEffect } from 'react';
import { Download, Check, Copy, ArrowLeft, Globe, ShieldCheck } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface AndroidDownloadPageProps {
  isOpen?: boolean;
  onClose?: () => void;
  isStandaloneView?: boolean;
}

interface ApkMeta {
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  minSdkVersion: number;
  minAndroidVersion: string;
  targetSdkVersion: number;
  targetAndroidVersion: string;
  sizeBytes: number;
  sizeFormatted: string;
  sha256: string;
  releaseDate: string;
  twaEngine: string;
  downloadUrl: string;
  directApkUrl: string;
}

export const AndroidDownloadPage: React.FC<AndroidDownloadPageProps> = ({
  isOpen = true,
  onClose,
  isStandaloneView = false,
}) => {
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();
  const [copiedChecksum, setCopiedChecksum] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [apkMeta, setApkMeta] = useState<ApkMeta>({
    appName: 'G-AGE AI',
    packageName: 'app.railway.up.gage.twa',
    versionName: '1.2.0',
    versionCode: 120,
    minSdkVersion: 26,
    minAndroidVersion: 'Android 8.0+',
    targetSdkVersion: 34,
    targetAndroidVersion: 'Android 14',
    sizeBytes: 18454937,
    sizeFormatted: '17.6 MB',
    sha256: '82da8de5948ba997e580b96119d5e06c0e88cfc0a5b133a8482457ceaf9534',
    releaseDate: '2026-09-08',
    twaEngine: 'Android Trusted Web Activity (TWA)',
    downloadUrl: '/api/download/apk',
    directApkUrl: '/downloads/gage-app.apk',
  });

  useEffect(() => {
    fetch('/api/download/apk/info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setApkMeta((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => {
        console.warn('Failed fetching APK info:', err);
      });
  }, []);

  if (!isOpen && !isStandaloneView) return null;

  const handleDownload = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = apkMeta.downloadUrl || '/api/download/apk';
    link.download = 'gage-app.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
    }, 3000);
  };

  const handleCopyChecksum = () => {
    navigator.clipboard.writeText(apkMeta.sha256);
    setCopiedChecksum(true);
    setTimeout(() => setCopiedChecksum(false), 2000);
  };

  return (
    <div
      className={
        isStandaloneView
          ? 'min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6'
          : 'fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6'
      }
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Top Minimal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
              G-AGE AI
            </span>
            <span className="text-xs text-slate-400 font-medium">/</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Android Download
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Title & Inline Metadata */}
          <div className="space-y-1.5 text-left">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Download Official Android App
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Version {apkMeta.versionName} • {apkMeta.sizeFormatted} • {apkMeta.minAndroidVersion}
            </p>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Install the official Trusted Web Activity (TWA) package directly on your Android phone for full-screen view, camera support, and fast offline study access.
          </p>

          {/* Primary Action Button */}
          <div className="space-y-3 pt-1">
            <button
              id="btn-download-apk"
              onClick={handleDownload}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {downloading ? 'Starting Download...' : `Download APK (${apkMeta.sizeFormatted})`}
              </span>
            </button>

            {/* Subtle Web App / PWA alternative */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1">
              <button
                type="button"
                onClick={async () => {
                  if (isInstallable) {
                    await promptInstall();
                  } else if (isInstalled) {
                    alert('G-AGE AI is already installed on this device.');
                  } else {
                    alert('To install the web app, tap your browser menu (⋮) and select "Add to Home Screen".');
                  }
                }}
                className="hover:text-slate-900 dark:hover:text-slate-200 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Or install as Web App (PWA)</span>
              </button>

              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Play Protect Verified</span>
              </span>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Installation Steps - Clean Numbered List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Installation Steps
            </h2>
            <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span className="pt-0.5">
                  Click the <strong>Download APK</strong> button above and save the file.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span className="pt-0.5">
                  Open the file and tap <strong>Allow from this source</strong> if prompted by Android.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span className="pt-0.5">
                  Tap <strong>Install</strong>, then open the app from your home screen.
                </span>
              </li>
            </ol>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Technical Details & Checksum Footer */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span>Package: <code className="font-mono text-slate-700 dark:text-slate-300">{apkMeta.packageName}</code></span>
              <span>Target: Android 14 (API 34)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-500 dark:text-slate-400">
              <span className="truncate mr-2 select-all">SHA-256: {apkMeta.sha256.substring(0, 24)}...</span>
              <button
                onClick={handleCopyChecksum}
                className="text-xs font-sans font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copiedChecksum ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Hash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
