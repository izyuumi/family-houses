"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCheck,
  Users,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  Loader2,
  Shield,
  Trash2,
  Plus,
  Home,
  Pencil,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import type { MemberRole } from "@/convex/propertyMembers";
import { SwitchbotSettingsCard } from "@/components/switchbot-settings-card";
import { cn } from "@/lib/utils";

interface Profile {
  _id: Id<"profiles">;
  clerkId: string;
  email: string;
  displayName?: string;
  role: string;
  approved?: boolean;
}

export function AdminMembersClient() {
  const { t } = useI18n();
  const allProfiles = useQuery(api.profiles.listAll);
  const pendingProfiles = useQuery(api.profiles.listPending);
  const allProperties = useQuery(api.properties.list);

  const approveUser = useMutation(api.profiles.approveUser);
  const rejectUser = useMutation(api.profiles.rejectUser);
  const addMember = useMutation(api.propertyMembers.addMember);
  const removeMember = useMutation(api.propertyMembers.removeMember);

  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const approvedProfiles = allProfiles?.filter((p) => p.approved === true) ?? [];

  const addLoading = (key: string) =>
    setLoadingActions((prev) => new Set(prev).add(key));
  const removeLoading = (key: string) =>
    setLoadingActions((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

  const handleApprove = async (clerkId: string) => {
    const key = `approve-${clerkId}`;
    addLoading(key);
    try {
      await approveUser({ clerkId });
      toast.success(t.memberManagement.userApproved);
    } catch {
      toast.error(t.common.errorGeneric);
    } finally {
      removeLoading(key);
    }
  };

  const handleReject = async (clerkId: string) => {
    const key = `reject-${clerkId}`;
    addLoading(key);
    try {
      await rejectUser({ clerkId });
      toast.success(t.memberManagement.userRejected);
    } catch {
      toast.error(t.common.errorGeneric);
    } finally {
      removeLoading(key);
    }
  };

  const handleAssign = async (
    userId: string,
    propertyId: Id<"properties">,
    role: MemberRole
  ) => {
    const key = `assign-${userId}-${propertyId}`;
    addLoading(key);
    try {
      await addMember({ propertyId, userId, role });
      toast.success(t.memberManagement.memberAssigned);
      return true;
    } catch {
      toast.error(t.common.errorGeneric);
      return false;
    } finally {
      removeLoading(key);
    }
  };

  const handleRemove = async (userId: string, propertyId: Id<"properties">) => {
    const key = `remove-${userId}-${propertyId}`;
    addLoading(key);
    try {
      await removeMember({ propertyId, userId });
      toast.success(t.memberManagement.memberRemoved);
    } catch {
      toast.error(t.common.errorGeneric);
    } finally {
      removeLoading(key);
    }
  };

  return (
    <main className="h-dvh flex flex-col">
      <div className="mx-auto flex w-full max-w-2xl shrink-0 items-center gap-3 px-4 pb-1 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="rounded-xl shadow-none"
          aria-label={t.common.back}
        >
          <Link href="/profile">
            <ChevronLeft className="h-[18px] w-[18px]" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold tracking-[-0.01em]">
          {t.memberManagement.title}
        </h1>
      </div>
      <div className="flex-1 overflow-auto px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[15px] font-bold">
                <Home className="h-[17px] w-[17px] text-primary" />
                {t.memberManagement.properties}
              </div>
              <Button asChild size="sm" className="h-[38px] rounded-full px-3.5 text-xs">
                <Link href="/add">
                  <Plus className="h-3.5 w-3.5" />
                  {t.common.add}
                </Link>
              </Button>
            </div>
            {allProperties && allProperties.length > 0 && (
              <div className="flex flex-col">
                {allProperties.map((property) => (
                  <div
                    key={property._id}
                    className="flex items-center gap-3 border-b border-hairline px-0.5 py-2 last:border-b-0"
                  >
                    <span className="flex-1 truncate text-sm font-medium">
                      {property.name}
                    </span>
                    <Button
                      asChild
                      size="icon"
                      variant="outline"
                      className="h-10 w-10 rounded-[11px] text-muted-foreground shadow-none"
                      aria-label={`${t.a11y.editProperty}: ${property.name}`}
                    >
                      <Link href={`/add/p/${property._id}/edit`}>
                        <Pencil className="h-[15px] w-[15px]" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
            <div className="flex items-center gap-2 text-[15px] font-bold">
              <UserCheck className="h-[17px] w-[17px] text-primary" />
              {t.memberManagement.pendingApproval}
              {pendingProfiles && pendingProfiles.length > 0 && (
                <span className="rounded-full bg-destructive/10 px-[9px] py-0.5 text-xs font-semibold text-destructive">
                  {pendingProfiles.length}
                </span>
              )}
            </div>
            {!pendingProfiles ? (
              <div className="animate-pulse text-sm text-muted-foreground">
                {t.common.loading}
              </div>
            ) : pendingProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.memberManagement.noPending}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {pendingProfiles.map((profile) => (
                  <div
                    key={profile._id}
                    className="flex items-center gap-3 rounded-xl bg-background p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {profile.displayName || profile.email}
                      </p>
                      {profile.displayName && (
                        <p className="truncate text-xs text-muted-foreground">
                          {profile.email}
                        </p>
                      )}
                    </div>
                    <Button
                      size="icon"
                      className="rounded-xl"
                      onClick={() => handleApprove(profile.clerkId)}
                      disabled={loadingActions.has(`approve-${profile.clerkId}`)}
                      aria-label={t.memberManagement.approve}
                    >
                      {loadingActions.has(`approve-${profile.clerkId}`) ? (
                        <Loader2 className="h-[17px] w-[17px] animate-spin" />
                      ) : (
                        <Check className="h-[17px] w-[17px]" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-xl text-destructive"
                      onClick={() => handleReject(profile.clerkId)}
                      disabled={loadingActions.has(`reject-${profile.clerkId}`)}
                      aria-label={t.memberManagement.reject}
                    >
                      {loadingActions.has(`reject-${profile.clerkId}`) ? (
                        <Loader2 className="h-[17px] w-[17px] animate-spin" />
                      ) : (
                        <X className="h-[17px] w-[17px]" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
            <div className="flex items-center gap-2 text-[15px] font-bold">
              <Users className="h-[17px] w-[17px] text-primary" />
              {t.memberManagement.approvedMembers}
            </div>
            {!approvedProfiles ? (
              <div className="animate-pulse text-sm text-muted-foreground">
                {t.common.loading}
              </div>
            ) : approvedProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.memberManagement.noMembers}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {approvedProfiles.map((profile) => (
                  <UserCard
                    key={profile._id}
                    profile={profile}
                    expanded={expandedUser === profile.clerkId}
                    onToggle={() =>
                      setExpandedUser(
                        expandedUser === profile.clerkId ? null : profile.clerkId
                      )
                    }
                    properties={allProperties ?? []}
                    onAssign={handleAssign}
                    onRemove={handleRemove}
                    loadingActions={loadingActions}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>

          <SwitchbotSettingsCard />
        </div>
      </div>
    </main>
  );
}

interface UserCardProps {
  profile: Profile;
  expanded: boolean;
  onToggle: () => void;
  properties: Array<{ _id: Id<"properties">; name: string }>;
  onAssign: (
    userId: string,
    propertyId: Id<"properties">,
    role: MemberRole
  ) => Promise<boolean>;
  onRemove: (userId: string, propertyId: Id<"properties">) => Promise<void>;
  loadingActions: Set<string>;
  t: ReturnType<typeof useI18n>["t"];
}

function UserCard({
  profile,
  expanded,
  onToggle,
  properties,
  onAssign,
  onRemove,
  loadingActions,
  t,
}: UserCardProps) {
  const memberships = useQuery(api.propertyMembers.listByUser, {
    userId: profile.clerkId,
  });

  const [selectedProperty, setSelectedProperty] =
    useState<Id<"properties"> | null>(null);
  const [selectedRole, setSelectedRole] = useState<MemberRole>("member");

  const memberPropertyIds = new Set(memberships?.map((m) => m.propertyId) ?? []);
  const availableProperties = properties.filter(
    (p) => !memberPropertyIds.has(p._id)
  );

  const handleAssign = async () => {
    if (!selectedProperty) return;
    const ok = await onAssign(profile.clerkId, selectedProperty, selectedRole);
    if (ok) {
      setSelectedProperty(null);
      setSelectedRole("member");
    }
  };

  const roleLabel = (role: string) =>
    role === "owner"
      ? t.memberManagement.roleOwner
      : role === "member"
        ? t.memberManagement.roleMember
        : t.memberManagement.roleGuest;

  return (
    <div className="overflow-hidden rounded-[14px] border">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-2.5 p-3.5 transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">
              {profile.displayName || profile.email}
            </span>
            {profile.role === "admin" && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-[3px] text-[10px] font-semibold text-secondary-foreground">
                <Shield className="h-[11px] w-[11px]" />
                {t.memberManagement.systemAdmin}
              </span>
            )}
          </div>
          {profile.displayName && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {profile.email}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 border-t border-hairline bg-nested p-3.5">
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              {t.memberManagement.properties}
            </p>
            {!memberships ? (
              <p className="animate-pulse text-sm text-muted-foreground">
                {t.common.loading}
              </p>
            ) : memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.memberManagement.noPropertyAccess}
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {memberships.map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center gap-2.5 rounded-[10px] border border-hairline bg-card px-3 py-2"
                  >
                    <span className="flex-1 truncate text-[13px] font-medium">
                      {m.property?.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-muted px-[9px] py-0.5 text-[11px] font-medium text-muted-foreground">
                      {roleLabel(m.role)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(profile.clerkId, m.propertyId)}
                      disabled={loadingActions.has(
                        `remove-${profile.clerkId}-${m.propertyId}`
                      )}
                      aria-label={`${t.memberManagement.remove}: ${m.property?.name ?? ""}`}
                    >
                      {loadingActions.has(
                        `remove-${profile.clerkId}-${m.propertyId}`
                      ) ? (
                        <Loader2 className="h-[15px] w-[15px] animate-spin" />
                      ) : (
                        <Trash2 className="h-[15px] w-[15px]" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {availableProperties.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {t.memberManagement.assignToProperty}
              </p>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={selectedProperty ?? ""}
                  onValueChange={(value: string) =>
                    setSelectedProperty(
                      value ? (value as Id<"properties">) : null
                    )
                  }
                >
                  <SelectTrigger className="h-11 min-w-[120px] flex-1 rounded-xl bg-card">
                    <SelectValue placeholder={t.memberManagement.selectProperty} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedRole}
                  onValueChange={(value: string) => setSelectedRole(value as MemberRole)}
                >
                  <SelectTrigger className="h-11 w-[110px] rounded-xl bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">{t.memberManagement.roleOwner}</SelectItem>
                    <SelectItem value="member">{t.memberManagement.roleMember}</SelectItem>
                    <SelectItem value="guest">{t.memberManagement.roleGuest}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="h-11 rounded-xl"
                  onClick={handleAssign}
                  disabled={
                    !selectedProperty ||
                    loadingActions.has(
                      `assign-${profile.clerkId}-${selectedProperty}`
                    )
                  }
                >
                  {selectedProperty &&
                  loadingActions.has(
                    `assign-${profile.clerkId}-${selectedProperty}`
                  ) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t.memberManagement.assign
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
