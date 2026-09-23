import React from "react";
import { useUser } from "../context/UserContext";

export const ProExpiryBadge: React.FC = () => {
  const { user, proExpiresAt } = useUser();
  const isPro = user?.tier === "paid" || user?.tier === "pro" || user?.tier === "unlimited";
  if (!isPro) return null;
  if (!proExpiresAt) {
    return (
      <span
        title="Pro does not expire"
        className="px-1.5 py-0.5 rounded-full border text-[10px] font-bold bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
      >
        ∞
      </span>
    );
  }

  const expiresAt = new Date(proExpiresAt);
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
  const hoursLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 3600000);
  const label = daysLeft >= 3 ? `${daysLeft}d` : hoursLeft < 24 ? `${Math.max(0, hoursLeft)}h` : `${Math.max(0, daysLeft)}d`;
  const tone = daysLeft > 7
    ? "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
    : daysLeft >= 3
      ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
      : "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
  const title = expiresAt ? `Pro expires ${expiresAt.toLocaleString()}` : "Pro does not expire";

  return (
    <span className="inline-flex items-center gap-1">
      <span title={title} className={`px-1.5 py-0.5 rounded-full border text-[10px] font-bold ${tone}`}>{label}</span>
      {expiresAt && <a href="/?upgrade=pro" className="text-[10px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400">Renew</a>}
    </span>
  );
};
