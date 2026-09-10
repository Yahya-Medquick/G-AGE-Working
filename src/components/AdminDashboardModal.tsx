import React, { useState, useEffect } from "react";
import {
  X,
  Database,
  BarChart3,
  RefreshCw,
  Trash2,
  Plus,
  Zap,
  Activity,
  Layers,
  Cpu,
  Search,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Key,
  Copy,
  Check,
  Ban,
  UserCheck,
  Lock,
  Edit2,
  Star,
  Sparkles,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Globe,
  MapPin,
  Users,
  Phone,
  Mail,
  Crown,
  Clock,
} from "lucide-react";
import { AdminStats, Entity, ExpertPersona } from "../types";
import {
  adminFetchAll,
  adminCreatePersona,
  adminUpdatePersona,
  adminDeletePersona,
  adminTogglePersona,
  adminReorderPersona,
} from "../stores/personaStore";

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshEntityData?: (slug: string) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [personas, setPersonas] = useState<ExpertPersona[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userTierFilter, setUserTierFilter] = useState<"all" | "free" | "paid">("all");
  const [updatingUserTierId, setUpdatingUserTierId] = useState<string | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "entities" | "cache" | "apikeys" | "personas" | "users">("overview");
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  // New Expert Persona form state
  const [newPersonaName, setNewPersonaName] = useState("");
  const [newPersonaSlug, setNewPersonaSlug] = useState("");
  const [newPersonaInitials, setNewPersonaInitials] = useState("");
  const [newPersonaRole, setNewPersonaRole] = useState("");
  const [newPersonaAffiliation, setNewPersonaAffiliation] = useState("");
  const [newPersonaBadge, setNewPersonaBadge] = useState("");
  const [newPersonaAvatarColor, setNewPersonaAvatarColor] = useState("#6366f1");
  const [newPersonaSpecialties, setNewPersonaSpecialties] = useState("");
  const [newPersonaDomains, setNewPersonaDomains] = useState("");
  const [newPersonaDescription, setNewPersonaDescription] = useState("");
  const [newPersonaPersonality, setNewPersonaPersonality] = useState("");
  const [newPersonaOpener, setNewPersonaOpener] = useState("");
  const [newPersonaPrompt, setNewPersonaPrompt] = useState("");
  const [newPersonaIsDefault, setNewPersonaIsDefault] = useState(false);
  const [newPersonaVariant, setNewPersonaVariant] = useState<"global" | "pk">("global");
  const [newPersonaDisplayOrder, setNewPersonaDisplayOrder] = useState<number>(1);
  const [newPersonaIsActive, setNewPersonaIsActive] = useState(true);
  const [draggedPersonaId, setDraggedPersonaId] = useState<string | null>(null);

  // Editing Persona state
  const [editingPersona, setEditingPersona] = useState<ExpertPersona | null>(null);
  const [personaSearchQuery, setPersonaSearchQuery] = useState("");

  // Password Protection State
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // New API Key form state
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [dailyLimit, setDailyLimit] = useState(100);
  const [rawCreatedKey, setRawCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // New entity form state
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAliases, setNewAliases] = useState("");
  const [newPopularity, setNewPopularity] = useState(85);

  const [adminToken, setAdminToken] = useState<string>(() => {
    return localStorage.getItem("admin_token") || "";
  });

  const fetchAdminData = async (tokenToUse?: string) => {
    const activeAdminToken = tokenToUse !== undefined ? tokenToUse : adminToken;
    if (!activeAdminToken) {
      setIsUnlocked(false);
      return;
    }
    setIsLoading(true);
    try {
      const authHeaders = { "X-Admin-Token": activeAdminToken };
      const [statsRes, entitiesRes, keysRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: authHeaders }),
        fetch("/api/admin/entities", { headers: authHeaders }),
        fetch("/api/admin/apikeys", { headers: authHeaders }),
      ]);

      if (statsRes.status === 401) {
        setIsUnlocked(false);
        localStorage.removeItem("admin_token");
        setAdminToken("");
        return;
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        setIsUnlocked(true);
      }
      if (entitiesRes.ok) {
        const entitiesData = await entitiesRes.json();
        setEntities(entitiesData.entities || []);
      }
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData.keys || []);
      }

      // Fetch personas using unified persona store
      try {
        const allPersonas = await adminFetchAll(activeAdminToken);
        setPersonas(allPersonas);
      } catch (pErr) {
        console.warn("Failed to fetch personas via personaStore:", pErr);
        const fallbackRes = await fetch("/api/admin/personas", { headers: authHeaders });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setPersonas(Array.isArray(fallbackData) ? fallbackData : fallbackData.personas || []);
        }
      }

      // Fetch users list
      try {
        const usersRes = await fetch("/api/admin/users", { headers: authHeaders });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsersList(usersData.users || []);
        }
      } catch (uErr) {
        console.warn("Failed to fetch users for admin:", uErr);
      }
    } catch (err) {
      console.warn("Error fetching admin stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserTier = async (userId: string, targetTier: "free" | "paid") => {
    setUpdatingUserTierId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/tier`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({ tier: targetTier }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, tier: targetTier } : u))
        );
        setRefreshMessage(`User tier updated to ${targetTier.toUpperCase()}`);
        setTimeout(() => setRefreshMessage(null), 3500);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update user tier");
      }
    } catch (err: any) {
      console.error("Failed to update user tier:", err);
      alert(err.message || "Failed to update user tier");
    } finally {
      setUpdatingUserTierId(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (adminToken) {
        fetchAdminData(adminToken);
      } else {
        setIsUnlocked(false);
      }
    }
  }, [isOpen]);

  const handleUnlockAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setIsVerifying(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        const validToken = data.token;
        setAdminToken(validToken);
        localStorage.setItem("admin_token", validToken);
        setIsUnlocked(true);
        setPasswordInput("");
        fetchAdminData(validToken);
      } else {
        const errData = await res.json().catch(() => ({}));
        setAuthError(errData.error || "Incorrect admin password.");
      }
    } catch (err: any) {
      setAuthError("Failed to connect to authentication server.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLockAdmin = () => {
    localStorage.removeItem("admin_token");
    setAdminToken("");
    setIsUnlocked(false);
    setPasswordInput("");
    setAuthError(null);
  };

  const handleClearCache = async () => {
    try {
      const res = await fetch("/api/admin/cache/clear", {
        method: "POST",
        headers: { "X-Admin-Token": adminToken },
      });
      if (res.ok) {
        setRefreshMessage("Cache cleared successfully!");
        fetchAdminData();
        setTimeout(() => setRefreshMessage(null), 3000);
      }
    } catch (err) {
      console.warn("Failed to clear cache:", err);
    }
  };

  const handleTriggerRefresh = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/entities/${slug}/refresh`, {
        method: "POST",
        headers: { "X-Admin-Token": adminToken },
      });
      if (res.ok) {
        const data = await res.json();
        setRefreshMessage(`Entity "${slug}" refreshed! Freshness: 100%`);
        fetchAdminData();
        setTimeout(() => setRefreshMessage(null), 3000);
      }
    } catch (err) {
      console.warn("Failed to refresh entity:", err);
    }
  };

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) return;

    try {
      const aliasArray = newAliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const res = await fetch("/api/admin/entities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: newSlug.trim().toLowerCase(),
          description: newDesc.trim(),
          aliases: aliasArray,
          popularityScore: newPopularity,
        }),
      });

      if (res.ok) {
        setRefreshMessage(`Entity "${newTitle}" registered in G-AGE AI database!`);
        setNewTitle("");
        setNewSlug("");
        setNewDesc("");
        setNewAliases("");
        fetchAdminData();
        setTimeout(() => setRefreshMessage(null), 3000);
      }
    } catch (err) {
      console.warn("Failed to create entity:", err);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !ownerEmail.trim()) return;

    try {
      const res = await fetch("/api/admin/apikeys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
        body: JSON.stringify({
          owner_name: ownerName.trim(),
          owner_email: ownerEmail.trim(),
          daily_limit: dailyLimit,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRawCreatedKey(data.rawKey);
        setRefreshMessage(`API Key generated for ${ownerName.trim()}!`);
        setOwnerName("");
        setOwnerEmail("");
        setDailyLimit(100);
        fetchAdminData();
      }
    } catch (err) {
      console.warn("Failed to generate API key:", err);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/apikeys/${id}/revoke`, {
        method: "POST",
        headers: { "X-Admin-Token": adminToken },
      });
      if (res.ok) {
        setRefreshMessage("API key revoked successfully.");
        fetchAdminData();
        setTimeout(() => setRefreshMessage(null), 3000);
      }
    } catch (err) {
      console.warn("Failed to revoke API key:", err);
    }
  };

  const handleTogglePersonaActive = async (id: string, currentActive: boolean) => {
    try {
      await adminTogglePersona(id, !currentActive, adminToken);
      window.dispatchEvent(new CustomEvent('personas-updated'));
      setRefreshMessage("Persona status updated successfully!");
      fetchAdminData();
      setTimeout(() => setRefreshMessage(null), 3000);
    } catch (err: any) {
      console.warn("Failed to toggle persona active state:", err);
      setRefreshMessage(err?.message || "Failed to update persona status");
      setTimeout(() => setRefreshMessage(null), 3000);
    }
  };

  const handleDeletePersona = async (id: string, hard: boolean = false) => {
    if (!confirm(`Are you sure you want to ${hard ? "permanently delete" : "deactivate"} this persona?`)) {
      return;
    }
    try {
      await adminDeletePersona(id, hard, adminToken);
      window.dispatchEvent(new CustomEvent('personas-updated'));
      setRefreshMessage("Persona deleted successfully.");
      fetchAdminData();
      setTimeout(() => setRefreshMessage(null), 3000);
    } catch (err: any) {
      console.warn("Failed to delete persona:", err);
      setRefreshMessage(err?.message || "Failed to delete persona");
      setTimeout(() => setRefreshMessage(null), 3000);
    }
  };

  const handleCreatePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonaName.trim()) {
      setRefreshMessage("Name is required.");
      setTimeout(() => setRefreshMessage(null), 3000);
      return;
    }

    try {
      const badgeVal = newPersonaBadge.trim() || newPersonaDomains.trim() || "Expert";
      const roleVal = newPersonaRole.trim() || "Counselor & Advisor";

      await adminCreatePersona(
        {
          name: newPersonaName.trim(),
          slug: newPersonaSlug.trim() || undefined,
          initials: newPersonaInitials.trim() || undefined,
          role: roleVal,
          affiliation: newPersonaAffiliation.trim() || undefined,
          badge: badgeVal,
          avatar_color: newPersonaAvatarColor.trim() || "#6366f1",
          specialties: newPersonaSpecialties
            ? newPersonaSpecialties.split(",").map(s => s.trim()).filter(Boolean)
            : [],
          domains: newPersonaDomains
            ? newPersonaDomains.split(",").map(d => d.trim().toLowerCase()).filter(Boolean)
            : [badgeVal.toLowerCase()].filter(Boolean),
          description: newPersonaDescription.trim() || undefined,
          personality: newPersonaPersonality.trim() || undefined,
          opener_template: newPersonaOpener.trim() || undefined,
          system_prompt: newPersonaPrompt.trim() || undefined,
          is_active: newPersonaIsActive,
          is_default: newPersonaIsDefault,
          display_order: newPersonaDisplayOrder || personas.length + 1,
          variant: newPersonaVariant,
        },
        adminToken
      );

      window.dispatchEvent(new CustomEvent('personas-updated'));
      setRefreshMessage(`Expert persona "${newPersonaName}" created successfully!`);
      setNewPersonaName("");
      setNewPersonaSlug("");
      setNewPersonaInitials("");
      setNewPersonaRole("");
      setNewPersonaAffiliation("");
      setNewPersonaBadge("");
      setNewPersonaAvatarColor("#6366f1");
      setNewPersonaSpecialties("");
      setNewPersonaDomains("");
      setNewPersonaDescription("");
      setNewPersonaPersonality("");
      setNewPersonaOpener("");
      setNewPersonaPrompt("");
      setNewPersonaIsDefault(false);
      setNewPersonaVariant("global");
      setNewPersonaDisplayOrder(personas.length + 2);
      setNewPersonaIsActive(true);
      fetchAdminData();
      setTimeout(() => setRefreshMessage(null), 3000);
    } catch (err: any) {
      console.warn("Failed to add new persona:", err);
      setRefreshMessage(err?.message || "Failed to create persona");
      setTimeout(() => setRefreshMessage(null), 3000);
    }
  };

  const handleMovePersona = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= personas.length) return;

    const currentPersona = personas[index];
    const targetPersona = personas[targetIndex];

    const currentOrder = currentPersona.display_order ?? (index + 1);
    const targetOrder = targetPersona.display_order ?? (targetIndex + 1);

    try {
      await adminReorderPersona(currentPersona.id, targetOrder, adminToken);
      await adminReorderPersona(targetPersona.id, currentOrder, adminToken);
      window.dispatchEvent(new CustomEvent('personas-updated'));
      setRefreshMessage("Personas reordered successfully.");
      fetchAdminData();
      setTimeout(() => setRefreshMessage(null), 3000);
    } catch (err: any) {
      console.warn("Failed to reorder personas:", err);
      setRefreshMessage(err?.message || "Failed to reorder personas");
      setTimeout(() => setRefreshMessage(null), 3000);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedPersonaId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedPersonaId || draggedPersonaId === targetId) return;

    const sourceIdx = personas.findIndex(p => p.id === draggedPersonaId);
    const targetIdx = personas.findIndex(p => p.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const newPersonas = [...personas];
    const [moved] = newPersonas.splice(sourceIdx, 1);
    newPersonas.splice(targetIdx, 0, moved);

    try {
      for (let i = 0; i < newPersonas.length; i++) {
        await adminReorderPersona(newPersonas[i].id, i + 1, adminToken);
      }
      window.dispatchEvent(new CustomEvent('personas-updated'));
      setRefreshMessage("Reordered personas successfully!");
      fetchAdminData();
      setTimeout(() => setRefreshMessage(null), 3000);
    } catch (err: any) {
      console.warn("Failed drag reorder:", err);
    } finally {
      setDraggedPersonaId(null);
    }
  };

  const handleSaveEditPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPersona) return;

    try {
      await adminUpdatePersona(editingPersona.id, editingPersona, adminToken);
      window.dispatchEvent(new CustomEvent('personas-updated'));
      setRefreshMessage(`Persona "${editingPersona.name}" updated successfully!`);
      setEditingPersona(null);
      fetchAdminData();
      setTimeout(() => setRefreshMessage(null), 3000);
    } catch (err: any) {
      console.warn("Failed to update persona:", err);
      setRefreshMessage(err?.message || "Failed to update persona");
      setTimeout(() => setRefreshMessage(null), 3000);
    }
  };

  if (!isOpen) return null;

  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative overflow-hidden text-slate-800 dark:text-slate-100 space-y-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-2 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Panel Locked</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              This panel is restricted to system administrators. Enter your master administrative password to continue.
            </p>
          </div>

          <form onSubmit={handleUnlockAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Master Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                />
                <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 font-medium">
                {authError}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying || !passwordInput.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Unlock Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                G-AGE AI System Dashboard
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" /> Node Cluster Active
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time entity management, multi-tier cache metrics, and background jobs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAdminData()}
              disabled={isLoading}
              className="p-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium flex items-center gap-1.5"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleLockAdmin}
              className="px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="Lock Admin Panel"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Panel</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header Navigation */}
        <div className="px-6 pt-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-sm font-medium bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Telemetry & Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab("entities")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "entities"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Entity & Keyword Registry ({entities.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("cache")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "cache"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Redis & Memory Cache</span>
          </button>
          <button
            onClick={() => setActiveTab("apikeys")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "apikeys"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Key className="w-4 h-4 text-purple-500" />
            <span>API Keys ({apiKeys.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("personas")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "personas"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Counseling Personas ({personas.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Users className="w-4 h-4 text-blue-500" />
            <span>User Management ({usersList.length})</span>
          </button>
        </div>

        {/* Notification Banner */}
        {refreshMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-6 py-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{refreshMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
          
          {/* TAB 1: TELEMETRY OVERVIEW */}
          {activeTab === "overview" && stats && (
            <div className="space-y-6">
              {/* Stat Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Total Searches</span>
                    <Search className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {stats.totalSearches}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Live telemetry tracked</div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Cache Hit Rate</span>
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {stats.cacheHitRate}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {stats.totalCachedKeys} active cached keys
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Heap Memory</span>
                    <Layers className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {stats.memoryUsageMb} <span className="text-sm font-normal text-slate-400">MB</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Node container heap</div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Background Jobs</span>
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-4 h-4" /> Interval Active
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {stats.backgroundJobsStatus.entitiesRefreshed} entity syncs complete
                  </div>
                </div>
              </div>

              {/* API Calls Breakdown & Top Queries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* API Node Calls */}
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    External API Integrations Telemetry
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-700 dark:text-slate-300">OpenAlex Scientific API (Research Papers)</span>
                        <span className="font-bold text-indigo-600">{stats.apiCalls.openAlex} calls</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, stats.apiCalls.openAlex * 10)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-700 dark:text-slate-300">Wikipedia Knowledge Engine</span>
                        <span className="font-bold text-emerald-600">{stats.apiCalls.wikipedia} calls</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, stats.apiCalls.wikipedia * 10)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-700 dark:text-slate-300">Google Gemini AI Synthesis</span>
                        <span className="font-bold text-cyan-600">{stats.apiCalls.gemini} calls</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, stats.apiCalls.gemini * 10)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-700 dark:text-slate-300">GitHub Open Source API</span>
                        <span className="font-bold text-purple-600">{stats.apiCalls.github} calls</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, stats.apiCalls.github * 10)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Searched Queries */}
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Top Queries & Search Ranking
                  </h3>

                  <div className="space-y-2">
                    {stats.topQueries.map((q, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center">
                            #{i + 1}
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white capitalize">
                            {q.query}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300">
                          {q.count} searches
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: ENTITIES MANAGER */}
          {activeTab === "entities" && (
            <div className="space-y-6">
              {/* Register New Entity Form */}
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  Register New Lightweight Entity
                </h3>
                <form onSubmit={handleCreateEntity} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Quantum Gravity"
                      value={newTitle}
                      onChange={(e) => {
                        setNewTitle(e.target.value);
                        if (!newSlug) {
                          setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Slug</label>
                    <input
                      type="text"
                      placeholder="quantum-gravity"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Description</label>
                    <input
                      type="text"
                      placeholder="Brief entity overview description..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Aliases / Synonyms (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="loop quantum gravity, string theory, graviton"
                      value={newAliases}
                      onChange={(e) => setNewAliases(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Initial Popularity Score ({newPopularity}/100)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={newPopularity}
                      onChange={(e) => setNewPopularity(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Save Entity
                    </button>
                  </div>
                </form>
              </div>

              {/* Entity Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Registered Lightweight Entities ({entities.length})</span>
                  <span className="text-xs font-medium text-slate-500">Synonym Supported & Auto-Ranked</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                        <th className="p-3.5">Entity / Slug</th>
                        <th className="p-3.5">Popularity</th>
                        <th className="p-3.5">Authority</th>
                        <th className="p-3.5">Freshness</th>
                        <th className="p-3.5">Aliases / Synonyms</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {entities.map((ent) => (
                        <tr key={ent.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">{ent.title}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{ent.slug}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                              {ent.popularityScore}/100
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                            {ent.authorityScore}/100
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                              {ent.freshnessScore}%
                            </span>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {ent.aliases.map((al, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]"
                                >
                                  {al}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleTriggerRefresh(ent.slug)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                              title="Force background entity update"
                            >
                              <RefreshCw className="w-3 h-3" /> Refresh
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CACHE MANAGEMENT */}
          {activeTab === "cache" && stats && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Multi-Tier Redis-Style Memory Cache
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    1-Hour TTL with background automated pruning and hit-counter telemetry
                  </p>
                </div>

                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" /> Clear All Cache
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Cached Keys Count</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                    {stats.totalCachedKeys}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Cache Hit Rate</div>
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {stats.cacheHitRate}%
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-xs font-semibold text-slate-400 uppercase">Process Memory</div>
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {stats.memoryUsageMb} MB
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: API KEYS MANAGEMENT (Requirements #4 & #5) */}
          {activeTab === "apikeys" && (
            <div className="space-y-6">
              {/* Newly Generated Raw Key Callout */}
              {rawCreatedKey && (
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      API Key Issued Successfully! Save it now.
                    </span>
                    <button
                      onClick={() => setRawCreatedKey(null)}
                      className="text-xs hover:underline text-amber-700 dark:text-amber-300"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-xs">
                    This is the only time the full unhashed key will be displayed. It is securely hashed in the database.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={rawCreatedKey}
                      className="flex-1 font-mono text-sm p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 font-bold select-all text-slate-900 dark:text-amber-300"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(rawCreatedKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey ? "Copied!" : "Copy Key"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Issue New API Key Form */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-600" /> Issue New API Key
                </h3>

                <form onSubmit={handleCreateApiKey} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Owner Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Connor"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Owner Email</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@example.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Daily Quota Limit</label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(parseInt(e.target.value, 10) || 100)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Issue Key
                    </button>
                  </div>
                </form>
              </div>

              {/* Active API Keys Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Issued Keys & Real-Time Usage ({apiKeys.length})</span>
                  <span className="text-xs font-normal text-slate-400">Hashed via SHA-256</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Prefix</th>
                        <th className="py-2.5 px-3">Owner</th>
                        <th className="py-2.5 px-3">Daily Quota</th>
                        <th className="py-2.5 px-3">Today Requests</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {apiKeys.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            No API keys generated yet. Issue one above to secure <code className="font-mono">/api/v1/*</code> endpoints.
                          </td>
                        </tr>
                      ) : (
                        apiKeys.map((k) => (
                          <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50">
                            <td className="py-3 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                              {k.keyPrefix || "gage_live_..."}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-900 dark:text-white">{k.ownerName}</div>
                              <div className="text-[10px] text-slate-400">{k.ownerEmail}</div>
                            </td>
                            <td className="py-3 px-3 font-mono">
                              {k.dailyLimit} req/day
                            </td>
                            <td className="py-3 px-3">
                              <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                                k.todayRequests >= k.dailyLimit
                                  ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300"
                                  : "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                              }`}>
                                {k.todayRequests} / {k.dailyLimit}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {k.revoked ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-[10px] font-bold">
                                  <Ban className="w-3 h-3" /> Revoked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                  <UserCheck className="w-3 h-3" /> Active
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {!k.revoked && (
                                <button
                                  onClick={() => handleRevokeApiKey(k.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                                >
                                  <Ban className="w-3 h-3" /> Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COUNSELING PERSONAS MANAGEMENT (Single Source of Truth) */}
          {activeTab === "personas" && (
            <div className="space-y-6">
              
              {/* Header Stats / Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Personas</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{personas.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Personas</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {personas.filter(p => p.is_active).length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Regional Variants</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
                      Global: {personas.filter(p => p.variant !== 'pk').length}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                      Pakistani: {personas.filter(p => p.variant === 'pk').length}
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Default Persona</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {personas.find(p => p.is_default)?.name || "None set"}
                  </div>
                </div>
              </div>

              {/* Add / Create Expert Persona Form */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  Create New Expert Persona
                </h3>

                <form onSubmit={handleCreatePersona} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Aris Thorne"
                      value={newPersonaName}
                      onChange={(e) => setNewPersonaName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Role / Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Quantum Information Theorist"
                      value={newPersonaRole}
                      onChange={(e) => setNewPersonaRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Badge / Domain *</label>
                    <input
                      type="text"
                      placeholder="e.g. Quantum Physics & Computing"
                      value={newPersonaBadge}
                      onChange={(e) => setNewPersonaBadge(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Regional Variant *</label>
                    <select
                      value={newPersonaVariant}
                      onChange={(e) => setNewPersonaVariant(e.target.value as "global" | "pk")}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      <option value="global">Global Expert (Standard)</option>
                      <option value="pk">Pakistani Variant (Local Insights)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Display Order</label>
                    <input
                      type="number"
                      min={1}
                      value={newPersonaDisplayOrder}
                      onChange={(e) => setNewPersonaDisplayOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Avatar Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newPersonaAvatarColor}
                        onChange={(e) => setNewPersonaAvatarColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={newPersonaAvatarColor}
                        onChange={(e) => setNewPersonaAvatarColor(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Initials (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. AT"
                      maxLength={4}
                      value={newPersonaInitials}
                      onChange={(e) => setNewPersonaInitials(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Slug (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. aris"
                      value={newPersonaSlug}
                      onChange={(e) => setNewPersonaSlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-5">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={newPersonaIsActive}
                        onChange={(e) => setNewPersonaIsActive(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>Active</span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={newPersonaIsDefault}
                        onChange={(e) => setNewPersonaIsDefault(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span>Default Persona</span>
                    </label>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Affiliation / Background</label>
                    <input
                      type="text"
                      placeholder="e.g. Postdoctoral Fellow, Perimeter Institute"
                      value={newPersonaAffiliation}
                      onChange={(e) => setNewPersonaAffiliation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Specialties (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Quantum entanglement, Decoherence, Qubit architectures"
                      value={newPersonaSpecialties}
                      onChange={(e) => setNewPersonaSpecialties(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Matching Domains / Keywords (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. quantum mechanics, quantum computing, physics, qubits, superposition"
                      value={newPersonaDomains}
                      onChange={(e) => setNewPersonaDomains(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Opener Template ({'{topic}'} & {'{name}'} available)</label>
                    <input
                      type="text"
                      placeholder="e.g. I see you are exploring {topic}. I research quantum information theory. What questions do you have?"
                      value={newPersonaOpener}
                      onChange={(e) => setNewPersonaOpener(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">System Instruction Prompt *</label>
                    <textarea
                      rows={3}
                      placeholder="You are Dr. Aris Thorne, a Quantum Information Theorist. Speak with precision. Use thought experiments..."
                      value={newPersonaPrompt}
                      onChange={(e) => setNewPersonaPrompt(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Save Persona
                    </button>
                  </div>
                </form>
              </div>

              {/* Persona List & Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Expert Personas Directory ({personas.length})
                  </h3>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search personas..."
                      value={personaSearchQuery}
                      onChange={(e) => setPersonaSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs w-56"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-2 w-12 text-center">Order</th>
                        <th className="py-2.5 px-3">Expert</th>
                        <th className="py-2.5 px-3">Variant</th>
                        <th className="py-2.5 px-3">Badge & Domain</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {personas
                        .filter(p => {
                          if (!personaSearchQuery.trim()) return true;
                          const q = personaSearchQuery.toLowerCase();
                          return (
                            p.name.toLowerCase().includes(q) ||
                            (p.role || "").toLowerCase().includes(q) ||
                            (p.badge || "").toLowerCase().includes(q) ||
                            (p.variant || "").toLowerCase().includes(q) ||
                            (p.domains || []).some(d => d.toLowerCase().includes(q))
                          );
                        })
                        .map((p, idx) => (
                          <tr
                            key={p.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, p.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, p.id)}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors ${
                              draggedPersonaId === p.id ? "opacity-40 bg-indigo-50/50" : ""
                            }`}
                          >
                            <td className="py-3 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </span>
                                <div className="flex flex-col">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMovePersona(idx, "up")}
                                    className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 cursor-pointer p-0.5"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === personas.length - 1}
                                    onClick={() => handleMovePersona(idx, "down")}
                                    className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 cursor-pointer p-0.5"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 font-semibold">{p.display_order ?? (idx + 1)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-2xs"
                                  style={{ backgroundColor: p.avatar_color || "#6366f1" }}
                                >
                                  {p.initials || p.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    {p.is_default && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9px] font-bold">
                                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Default
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{p.role}</div>
                                  {p.affiliation && (
                                    <div className="text-[9px] text-slate-400 italic truncate max-w-xs">{p.affiliation}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              {p.variant === 'pk' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                  <MapPin className="w-3 h-3 text-emerald-500" /> Pakistani
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                                  <Globe className="w-3 h-3 text-blue-500" /> Global
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                                {p.badge || "Expert"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {p.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                                  <UserCheck className="w-3 h-3" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                                  <Ban className="w-3 h-3" /> Inactive
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingPersona(p)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition-colors cursor-pointer"
                                  title="Edit Persona"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleTogglePersonaActive(p.id, p.is_active)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                                    p.is_active
                                      ? "bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-900 dark:text-rose-400"
                                      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 dark:text-emerald-400"
                                  }`}
                                >
                                  {p.is_active ? <Ban className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                  {p.is_active ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  onClick={() => handleDeletePersona(p.id, true)}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 text-[10px] font-bold transition-colors cursor-pointer"
                                  title="Permanent Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Persona Modal Overlay */}
              {editingPersona && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative overflow-hidden text-slate-800 dark:text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-indigo-500" />
                        Edit Expert Persona: {editingPersona.name}
                      </h3>
                      <button
                        onClick={() => setEditingPersona(null)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditPersona} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Name</label>
                        <input
                          type="text"
                          value={editingPersona.name}
                          onChange={(e) => setEditingPersona({ ...editingPersona, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Role</label>
                        <input
                          type="text"
                          value={editingPersona.role}
                          onChange={(e) => setEditingPersona({ ...editingPersona, role: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Badge / Category</label>
                        <input
                          type="text"
                          value={editingPersona.badge}
                          onChange={(e) => setEditingPersona({ ...editingPersona, badge: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Regional Variant</label>
                        <select
                          value={editingPersona.variant || "global"}
                          onChange={(e) => setEditingPersona({ ...editingPersona, variant: e.target.value as "global" | "pk" })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                        >
                          <option value="global">Global Expert</option>
                          <option value="pk">Pakistani Variant</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Display Order</label>
                        <input
                          type="number"
                          min={1}
                          value={editingPersona.display_order ?? 1}
                          onChange={(e) => setEditingPersona({ ...editingPersona, display_order: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Avatar Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingPersona.avatar_color || "#6366f1"}
                            onChange={(e) => setEditingPersona({ ...editingPersona, avatar_color: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-200 dark:border-slate-700 cursor-pointer p-0"
                          />
                          <input
                            type="text"
                            value={editingPersona.avatar_color || "#6366f1"}
                            onChange={(e) => setEditingPersona({ ...editingPersona, avatar_color: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Affiliation</label>
                        <input
                          type="text"
                          value={editingPersona.affiliation || ""}
                          onChange={(e) => setEditingPersona({ ...editingPersona, affiliation: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Specialties (comma-separated)</label>
                        <input
                          type="text"
                          value={(editingPersona.specialties || []).join(", ")}
                          onChange={(e) => setEditingPersona({ ...editingPersona, specialties: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Domains (comma-separated)</label>
                        <input
                          type="text"
                          value={(editingPersona.domains || []).join(", ")}
                          onChange={(e) => setEditingPersona({ ...editingPersona, domains: e.target.value.split(",").map(d => d.trim().toLowerCase()).filter(Boolean) })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Opener Template</label>
                        <input
                          type="text"
                          value={editingPersona.opener_template || ""}
                          onChange={(e) => setEditingPersona({ ...editingPersona, opener_template: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">System Instruction Prompt</label>
                        <textarea
                          rows={4}
                          value={editingPersona.system_prompt || ""}
                          onChange={(e) => setEditingPersona({ ...editingPersona, system_prompt: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editingPersona.is_active}
                            onChange={(e) => setEditingPersona({ ...editingPersona, is_active: e.target.checked })}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Active</span>
                        </label>

                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editingPersona.is_default || false}
                            onChange={(e) => setEditingPersona({ ...editingPersona, is_default: e.target.checked })}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Default Persona</span>
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingPersona(null)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 6: USERS MANAGEMENT (BUG 9: Manual Tier Upgrade for Paid Users) */}
          {activeTab === "users" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Controls & Filters */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search users by username, phone, or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <select
                    value={userTierFilter}
                    onChange={(e) => setUserTierFilter(e.target.value as any)}
                    className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Tiers ({usersList.length})</option>
                    <option value="free">
                      Free Tier ({usersList.filter((u) => u.tier === "free").length})
                    </option>
                    <option value="paid">
                      Paid / Pro ({usersList.filter((u) => u.tier === "paid" || u.tier === "pro" || u.tier === "unlimited").length})
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => fetchAdminData()}
                    disabled={isLoading}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    <span>Refresh Users</span>
                  </button>
                </div>
              </div>

              {/* User Metric Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Registered</span>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{usersList.length}</p>
                  </div>
                  <Users className="w-6 h-6 text-blue-500 opacity-80" />
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Free Accounts</span>
                    <p className="text-xl font-black text-slate-700 dark:text-slate-300 mt-0.5">
                      {usersList.filter((u) => u.tier === "free").length}
                    </p>
                  </div>
                  <UserCheck className="w-6 h-6 text-slate-400 opacity-80" />
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Paid / Unlimited</span>
                    <p className="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5">
                      {usersList.filter((u) => u.tier === "paid" || u.tier === "pro" || u.tier === "unlimited").length}
                    </p>
                  </div>
                  <Crown className="w-6 h-6 text-amber-500 opacity-80" />
                </div>
              </div>

              {/* Users List Table / Card View */}
              <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Phone / Contact</th>
                        <th className="py-3 px-4">Queries Today</th>
                        <th className="py-3 px-4">Current Tier</th>
                        <th className="py-3 px-4 text-right">Manual Tier Upgrade / Downgrade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {usersList
                        .filter((u) => {
                          const matchesQuery =
                            !userSearchQuery.trim() ||
                            (u.username && u.username.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
                            (u.name && u.name.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
                            (u.phone && u.phone.includes(userSearchQuery)) ||
                            (u.email && u.email.toLowerCase().includes(userSearchQuery.toLowerCase()));

                          const isPaid = u.tier === "paid" || u.tier === "pro" || u.tier === "unlimited";
                          const matchesTier =
                            userTierFilter === "all" ||
                            (userTierFilter === "free" && !isPaid) ||
                            (userTierFilter === "paid" && isPaid);

                          return matchesQuery && matchesTier;
                        })
                        .map((u) => {
                          const isPaid = u.tier === "paid" || u.tier === "pro" || u.tier === "unlimited";
                          const isUpdating = updatingUserTierId === u.id;

                          return (
                            <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                                    {(u.name || u.username || "U").slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white truncate">
                                      {u.name || u.username || "Unnamed User"}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">
                                      {u.username ? `@${u.username}` : u.id.slice(0, 8)}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="space-y-0.5">
                                  {u.phone ? (
                                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                                      <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                      <span>{u.phone}</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">No phone registered</span>
                                  )}
                                  {u.email && (
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] truncate">
                                      <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{u.email}</span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                                  <Activity className="w-3 h-3 text-indigo-500" />
                                  <span>{u.queries_today || 0} today</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                                    <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                    PAID (UNLIMITED)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    FREE (10/day)
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {isPaid ? (
                                    <button
                                      onClick={() => handleUpdateUserTier(u.id, "free")}
                                      disabled={isUpdating}
                                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      title="Downgrade to free tier"
                                    >
                                      {isUpdating ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : null}
                                      <span>Downgrade to Free</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUpdateUserTier(u.id, "paid")}
                                      disabled={isUpdating}
                                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      title="Manually upgrade user to paid tier"
                                    >
                                      {isUpdating ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Crown className="w-3 h-3" />
                                      )}
                                      <span>Upgrade to Paid</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                      {usersList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No registered users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
