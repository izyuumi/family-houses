"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useI18n } from "@/lib/i18n/context";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
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
  Loader2,
  Shield,
  Trash2,
  Plus,
  Home,
  Pencil,
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import type { MemberRole } from "@/convex/propertyMembers";

interface Profile {
  _id: Id<"profiles">;
  clerkId: string;
  email: string;
  displayName?: string;
  role: string;
  approved?: boolean;
}

interface PropertyMembership {
  _id: Id<"propertyMembers">;
  propertyId: Id<"properties">;
  role: MemberRole;
  property: {
    _id: Id<"properties">;
    name: string;
  } | null;
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
    await approveUser({ clerkId });
    removeLoading(key);
  };

  const handleReject = async (clerkId: string) => {
    const key = `reject-${clerkId}`;
    addLoading(key);
    await rejectUser({ clerkId });
    removeLoading(key);
  };

  const handleAssign = async (
    userId: string,
    propertyId: Id<"properties">,
    role: MemberRole
  ) => {
    const key = `assign-${userId}-${propertyId}`;
    addLoading(key);
    await addMember({ propertyId, userId, role });
    removeLoading(key);
  };

  const handleRemove = async (userId: string, propertyId: Id<"properties">) => {
    const key = `remove-${userId}-${propertyId}`;
    addLoading(key);
    await removeMember({ propertyId, userId });
    removeLoading(key);
  };

  return (
    <main className="h-dvh flex flex-col">
      <Navbar showBack backHref="/profile" title={t.memberManagement.title} />
      <div className="flex-1 overflow-auto p-4 max-w-2xl mx-auto w-full space-y-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{t.properties.title}</span>
          </div>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/add">
                <Plus className="h-4 w-4 mr-2" />
                {t.admin.addProperty}
              </Link>
            </Button>
            {allProperties && allProperties.length > 0 && (
              <div className="pt-2 space-y-1">
                {allProperties.map((property) => (
                  <div
                    key={property._id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded"
                  >
                    <span className="text-sm">{property.name}</span>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/add/p/${property._id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {t.memberManagement.pendingApproval}
            </span>
            {pendingProfiles && pendingProfiles.length > 0 && (
              <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                {pendingProfiles.length}
              </span>
            )}
          </div>
          {!pendingProfiles ? (
            <div className="text-sm text-muted-foreground animate-pulse">
              {t.common.loading}
            </div>
          ) : pendingProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.memberManagement.noPending}
            </p>
          ) : (
            <div className="space-y-2">
              {pendingProfiles.map((profile) => (
                <div
                  key={profile._id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {profile.displayName || profile.email}
                    </p>
                    {profile.displayName && (
                      <p className="text-sm text-muted-foreground">
                        {profile.email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(profile.clerkId)}
                      disabled={loadingActions.has(`approve-${profile.clerkId}`)}
                    >
                      {loadingActions.has(`approve-${profile.clerkId}`) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(profile.clerkId)}
                      disabled={loadingActions.has(`reject-${profile.clerkId}`)}
                    >
                      {loadingActions.has(`reject-${profile.clerkId}`) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {t.memberManagement.approvedMembers}
            </span>
          </div>
          {!approvedProfiles ? (
            <div className="text-sm text-muted-foreground animate-pulse">
              {t.common.loading}
            </div>
          ) : approvedProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t.memberManagement.noMembers}
            </p>
          ) : (
            <div className="space-y-2">
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
        </Card>
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
  ) => Promise<void>;
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
    await onAssign(profile.clerkId, selectedProperty, selectedRole);
    setSelectedProperty(null);
    setSelectedRole("member");
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-left">
          <div>
            <p className="font-medium">
              {profile.displayName || profile.email}
            </p>
            {profile.displayName && (
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            )}
          </div>
          {profile.role === "admin" && (
            <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Shield className="h-3 w-3" />
              {t.memberManagement.systemAdmin}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t p-3 space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">
              {t.memberManagement.properties}
            </p>
            {!memberships ? (
              <p className="text-sm text-muted-foreground animate-pulse">
                {t.common.loading}
              </p>
            ) : memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.memberManagement.noPropertyAccess}
              </p>
            ) : (
              <div className="space-y-1">
                {memberships.map((m) => (
                  <div
                    key={m._id}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{m.property?.name}</span>
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                        {m.role === "owner"
                          ? t.memberManagement.roleOwner
                          : m.role === "member"
                            ? t.memberManagement.roleMember
                            : t.memberManagement.roleGuest}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemove(profile.clerkId, m.propertyId)}
                      disabled={loadingActions.has(
                        `remove-${profile.clerkId}-${m.propertyId}`
                      )}
                    >
                      {loadingActions.has(
                        `remove-${profile.clerkId}-${m.propertyId}`
                      ) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {availableProperties.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-2">
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
                  <SelectTrigger className="flex-1 min-w-[120px]">
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
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">{t.memberManagement.roleOwner}</SelectItem>
                    <SelectItem value="member">{t.memberManagement.roleMember}</SelectItem>
                    <SelectItem value="guest">{t.memberManagement.roleGuest}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
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
