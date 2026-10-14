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
        className="px-2 py-0.5 rounded-full border text-xs font-bold bg-[#DDEFE6] text-[#0A5C45] border-[#0A5C45]/30 dark:bg-[#17352A] dark:text-[#5BE0A5] dark:border-[#5BE0A5]/30"
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
    ? "bg-[#DDEFE6] text-[#0A5C45] border-[#0A5C45]/30 dark:bg-[#17352A] dark:text-[#5BE0A5] dark:border-[#5BE0A5]/30"
    : daysLeft >= 3
      ? "bg-[#FFF3CC] text-[#7A5200] border-[#F4B400]/40 dark:bg-[#3A2F0B] dark:text-[#F4B400] dark:border-[#F4B400]/40"
      : "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800";
  const title = expiresAt ? `Pro expires ${expiresAt.toLocaleString()}` : "Pro does not expire";

  return (
    <span className="inline-flex items-center gap-1">
      <span title={title} className={`px-2 py-0.5 rounded-full border text-xs font-bold ${tone}`}>{label}</span>
    </span>
  );
};
