"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Loader2, MailPlus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type MemberRole = "owner" | "member" | "guest";
type Assignment = { propertyId: Id<"properties">; role: MemberRole };

function generateToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function InvitationsCard() {
  const { t } = useI18n();
  const invitations = useQuery(api.invitations.list);
  const properties = useQuery(api.properties.list);
  const createInvitation = useMutation(api.invitations.create);
  const revokeInvitation = useMutation(api.invitations.revoke);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [email, setEmail] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignProperty, setAssignProperty] = useState<Id<"properties"> | "">("");
  const [assignRole, setAssignRole] = useState<MemberRole>("member");
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const roleLabel = (role: MemberRole) =>
    role === "owner"
      ? t.memberManagement.roleOwner
      : role === "member"
        ? t.memberManagement.roleMember
        : t.memberManagement.roleGuest;

  const propertyName = (id: Id<"properties">) =>
    properties?.find((p) => p._id === id)?.name ?? "";

  const inviteLink = (token: string) => `${window.location.origin}/invite/${token}`;

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t.invite.linkCopied);
    } catch {
      toast.error(t.toast.copyFailed);
    }
  };

  const openDialog = () => {
    setLabel("");
    setEmail("");
    setAssignments([]);
    setAssignProperty("");
    setAssignRole("member");
    setCreatedLink(null);
    setDialogOpen(true);
  };

  const addAssignment = () => {
    if (!assignProperty) return;
    if (assignments.some((a) => a.propertyId === assignProperty)) return;
    setAssignments([...assignments, { propertyId: assignProperty, role: assignRole }]);
    setAssignProperty("");
    setAssignRole("member");
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const token = generateToken();
      await createInvitation({
        label: label.trim(),
        email: email.trim() || undefined,
        token,
        propertyAssignments: assignments,
      });
      setCreatedLink(inviteLink(token));
      toast.success(t.invite.created);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : t.common.errorGeneric
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (invitationId: Id<"invitations">) => {
    try {
      await revokeInvitation({ invitationId });
      toast.success(t.invite.revoked);
    } catch {
      toast.error(t.common.errorGeneric);
    }
  };

  const statusChip = (status: string) => (
    <span
      className={cn(
        "shrink-0 rounded-full px-[9px] py-0.5 text-[11px] font-medium",
        status === "pending" && "bg-secondary text-secondary-foreground",
        status === "accepted" && "bg-muted text-muted-foreground",
        status === "revoked" && "bg-destructive/10 text-destructive"
      )}
    >
      {status === "pending"
        ? t.invite.statusPending
        : status === "accepted"
          ? t.invite.statusAccepted
          : t.invite.statusRevoked}
    </span>
  );

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[15px] font-bold">
          <MailPlus className="h-[17px] w-[17px] text-primary" />
          {t.invite.title}
        </div>
        <Button size="sm" className="h-[38px] rounded-full px-3.5 text-xs" onClick={openDialog}>
          <Plus className="h-3.5 w-3.5" />
          {t.invite.invite}
        </Button>
      </div>

      {!invitations ? (
        <div className="animate-pulse text-sm text-muted-foreground">
          {t.common.loading}
        </div>
      ) : invitations.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.invite.none}</p>
      ) : (
        <div className="flex flex-col">
          {invitations.map((invitation) => (
            <div
              key={invitation._id}
              className="flex items-center gap-2.5 border-b border-hairline px-0.5 py-2.5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {invitation.label || invitation.email || "—"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {invitation.status === "accepted" && invitation.acceptor
                    ? `${t.invite.acceptedBy} ${invitation.acceptor.displayName || invitation.acceptor.email}`
                    : invitation.label && invitation.email
                      ? invitation.email
                      : `${t.invite.invitedBy} ${invitation.inviter?.displayName || invitation.inviter?.email || "—"}`}
                </p>
              </div>
              {statusChip(invitation.status)}
              {invitation.status === "pending" && (
                <>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 rounded-[11px] shadow-none"
                    onClick={() => void copy(inviteLink(invitation.token))}
                    aria-label={t.invite.copyLink}
                  >
                    <Copy className="h-[15px] w-[15px]" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 rounded-[11px] text-muted-foreground hover:text-destructive"
                    onClick={() => void handleRevoke(invitation._id)}
                    aria-label={t.invite.revoke}
                  >
                    <X className="h-[15px] w-[15px]" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.invite.newInvitation}</DialogTitle>
          </DialogHeader>

          {createdLink ? (
            <div className="rounded-xl bg-secondary p-4">
              <p className="text-sm font-semibold">{t.invite.shareHint}</p>
              <code className="mt-2 block break-all rounded-lg bg-background/60 px-2 py-1.5 text-xs">
                {createdLink}
              </code>
              <Button
                type="button"
                size="sm"
                className="mt-3 rounded-xl"
                onClick={() => void copy(createdLink)}
              >
                <Copy className="h-4 w-4" />
                {t.invite.copyLink}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-label">{t.invite.labelField}</Label>
                  <Input
                    id="invite-label"
                    autoComplete="off"
                    className="mt-1"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={t.invite.labelPlaceholder}
                  />
                </div>
                <div>
                  <Label htmlFor="invite-email">{t.invite.emailOptional}</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    autoComplete="off"
                    className="mt-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t.invite.emailHint}
                  </p>
                </div>

                <div>
                  <Label>{t.memberManagement.assignToProperty}</Label>
                  {assignments.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.propertyId}
                          className="flex items-center gap-2.5 rounded-[10px] border border-hairline bg-background px-3 py-2"
                        >
                          <span className="flex-1 truncate text-[13px] font-medium">
                            {propertyName(assignment.propertyId)}
                          </span>
                          <span className="shrink-0 rounded-full bg-muted px-[9px] py-0.5 text-[11px] font-medium text-muted-foreground">
                            {roleLabel(assignment.role)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setAssignments(
                                assignments.filter(
                                  (a) => a.propertyId !== assignment.propertyId
                                )
                              )
                            }
                            aria-label={t.memberManagement.remove}
                          >
                            <X className="h-[13px] w-[13px]" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Select
                      value={assignProperty}
                      onValueChange={(value: string) =>
                        setAssignProperty(value ? (value as Id<"properties">) : "")
                      }
                    >
                      <SelectTrigger className="h-11 min-w-[120px] flex-1 rounded-xl bg-card">
                        <SelectValue placeholder={t.memberManagement.selectProperty} />
                      </SelectTrigger>
                      <SelectContent>
                        {properties
                          ?.filter(
                            (p) => !assignments.some((a) => a.propertyId === p._id)
                          )
                          .map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={assignRole}
                      onValueChange={(value: string) => setAssignRole(value as MemberRole)}
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
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl"
                      disabled={!assignProperty}
                      onClick={addAssignment}
                    >
                      {t.common.add}
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  className="rounded-xl"
                  disabled={!label.trim() || creating}
                  onClick={() => void handleCreate()}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t.invite.createLink
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
