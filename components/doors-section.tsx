"use client";

import { useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useI18n } from "@/lib/i18n/context";
import { LockControl, lockStateLabel } from "@/components/lock-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clipboard, Copy, KeyRound, Lock, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Device = { _id: string; propertyId: string; label: string; deviceRole: string; lockState?: string; doorState?: string; battery?: number; stateUpdatedAt?: number; keypadDeviceId?: string; canControl: boolean; canManageGuestAccess: boolean };
type PasscodeType = "permanent" | "timeLimit" | "disposable";

function relative(at: number, t: ReturnType<typeof useI18n>["t"]) {
  const minutes = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (minutes < 1) return t.locks.justNow;
  if (minutes < 60) return `${minutes}${t.locks.minutesAgo}`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}${t.locks.hoursAgo}`;
  return `${Math.floor(minutes / 1440)}${t.locks.daysAgo}`;
}

export function DoorsSection({ propertyId }: { propertyId: string }) {
  const { t } = useI18n();
  const devices = useQuery(api.locks.devicesForProperty, { propertyId: propertyId as never }) as Device[] | undefined;
  const activity = useQuery(api.locks.activityForProperty, { propertyId: propertyId as never }) as Array<{ _id: string; action: string; source: string; actor?: { displayName?: string | null } | null; at: number }> | undefined;
  const passcodes = useQuery(api.locks.passcodesForProperty, { propertyId: propertyId as never }) as Array<{ _id: string; deviceDbId: string; name: string; code: string; passcodeType: PasscodeType; startTime?: number; endTime?: number; status: string }> | undefined;
  const refresh = useAction(api.switchbot.refreshPropertyStatus);
  const createPasscode = useAction(api.switchbot.createGuestPasscode);
  const deletePasscode = useAction(api.switchbot.deleteGuestPasscode);
  const [dialogDevice, setDialogDevice] = useState<Device | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<PasscodeType>("permanent");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ name: string; code: string; validity: string } | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const keypadDevices = useMemo(() => (devices ?? []).filter((device) => device.keypadDeviceId && device.canManageGuestAccess), [devices]);
  if (!devices?.length) return null;
  const canSeeActivity = devices.some((device) => device.canControl);
  const openNew = (device: Device) => { setDialogDevice(device); setName(""); setCode(""); setKind("permanent"); setStart(""); setEnd(""); setCreated(null); };
  const generate = () => {
    const number = new Uint32Array(1); crypto.getRandomValues(number);
    setCode(String(10000000 + (number[0] % 90000000)));
  };
  const submit = async () => {
    if (!dialogDevice) return;
    setSaving(true);
    try {
      const startTime = start ? new Date(start).getTime() : undefined;
      const endTime = end ? new Date(end).getTime() : undefined;
      await createPasscode({ deviceDbId: dialogDevice._id as never, name, code, passcodeType: kind, startTime, endTime });
      const validity = kind === "permanent" ? t.locks.permanent : `${start || "—"} – ${end || "—"}`;
      setCreated({ name, code, validity }); toast.success(t.locks.codeCreated);
    } catch (error) { toast.error(error instanceof Error ? error.message : t.common.errorGeneric); } finally { setSaving(false); }
  };
  const revoke = async () => {
    if (!revokeId) return;
    try { const result = await deletePasscode({ passcodeId: revokeId as never }); toast.success(t.locks.codeRevoked); if (result?.warning) toast.message(result.warning); }
    catch (error) { toast.error(error instanceof Error ? error.message : t.common.errorGeneric); } finally { setRevokeId(null); }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); toast.success(t.locks.copied); } catch { toast.error(t.toast.copyFailed); } };

  return <section className="flex flex-col gap-4" aria-label={t.locks.title}>
    {devices.map((device) => <div key={device._id} className="rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{device.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{t.locks.roles[device.deviceRole as keyof typeof t.locks.roles] ?? device.deviceRole}</p></div><Lock className="h-5 w-5 text-primary" /></div>
      <p className="mt-4 text-xl font-bold">{lockStateLabel(device, t)}</p>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground"><span>{device.battery === undefined ? t.locks.batteryUnknown : `${t.locks.battery} ${device.battery}%`}</span>{device.stateUpdatedAt && <span>{t.locks.updated} {relative(device.stateUpdatedAt, t)}</span>}</div>
      <div className="mt-4"><LockControl device={device} /></div>
      <p className="mt-4 border-t border-hairline pt-3 text-xs text-muted-foreground">{t.locks.lastActivity}: {device.stateUpdatedAt ? relative(device.stateUpdatedAt, t) : t.locks.unknown}</p>
    </div>)}
    {canSeeActivity && <div className="rounded-2xl border bg-card p-4 shadow-card dark:shadow-none"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">{t.locks.activity}</h2><Button type="button" variant="ghost" size="icon" onClick={() => void refresh({ propertyId: propertyId as never })} aria-label={t.common.retry}><RefreshCw className="h-4 w-4" /></Button></div>
      {activity === undefined ? <p className="mt-3 text-sm text-muted-foreground">{t.common.loading}</p> : activity.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t.locks.noActivity}</p> : <div className="mt-3 divide-y divide-hairline">{activity.slice(0,20).map((event) => <div className="py-2.5 text-sm" key={event._id}><span className="font-medium">{event.action === "unlock" ? t.locks.unlockedAction : event.action === "lock" ? t.locks.lockedAction : t.locks.stateChanged}</span>{event.actor?.displayName ? ` ${t.locks.by} ${event.actor.displayName}` : event.source === "webhook" ? ` · ${t.locks.viaSwitchbot}` : ""}<span className="float-right text-xs text-muted-foreground">{relative(event.at, t)}</span></div>)}</div>}
    </div>}
    {keypadDevices.length > 0 && <div className="rounded-2xl border bg-card p-4 shadow-card dark:shadow-none"><div className="flex items-center justify-between"><div><h2 className="text-sm font-bold">{t.locks.guestAccess}</h2><p className="mt-0.5 text-xs text-muted-foreground">{t.locks.guestAccessHint}</p></div><Button type="button" size="sm" className="rounded-xl" onClick={() => openNew(keypadDevices[0])}><Plus className="h-4 w-4" />{t.locks.newCode}</Button></div>
      <div className="mt-3 divide-y divide-hairline">{(passcodes ?? []).filter((passcode) => keypadDevices.some((device) => device._id === passcode.deviceDbId)).map((passcode) => <div className="flex items-center gap-2 py-3" key={passcode._id}><KeyRound className="h-4 w-4 text-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{passcode.name}</p><p className="text-xs text-muted-foreground">••••••{passcode.code.slice(-2)} · {t.locks.passcodeTypes[passcode.passcodeType]}</p></div><Button type="button" variant="ghost" size="icon" onClick={() => void copy(passcode.code)} aria-label={t.a11y.copy}><Copy className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setRevokeId(passcode._id)}>{t.locks.revoke}</Button></div>)}{passcodes?.length === 0 && <p className="py-3 text-sm text-muted-foreground">{t.locks.noCodes}</p>}</div>
    </div>}
    <Dialog open={Boolean(dialogDevice)} onOpenChange={(open) => !open && setDialogDevice(null)}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{t.locks.newCode}</DialogTitle><DialogDescription>{dialogDevice?.label}</DialogDescription></DialogHeader>{created ? <div className="rounded-xl bg-secondary p-4"><p className="font-semibold">{created.name}</p><p className="mt-1 font-mono text-lg tracking-wider">{created.code}</p><p className="mt-1 text-xs text-secondary-foreground">{created.validity}</p><Button type="button" size="sm" className="mt-3" onClick={() => void copy(`${created.name}: ${created.code}\n${created.validity}`)}><Clipboard className="h-4 w-4" />{t.a11y.copy}</Button></div> : <><div className="space-y-3"><div><Label>{t.locks.codeName}</Label><Input value={name} onChange={(event) => setName(event.target.value)} /></div><Segmented value={kind} onValueChange={setKind} aria-label={t.locks.codeType} options={[{value:"permanent",label:t.locks.permanent},{value:"timeLimit",label:t.locks.timeLimit},{value:"disposable",label:t.locks.oneTime}]} /><div><Label>{t.locks.code}</Label><div className="mt-1 flex gap-2"><Input inputMode="numeric" pattern="[0-9]*" maxLength={12} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} /><Button type="button" variant="outline" onClick={generate}>{t.locks.generate}</Button></div></div>{kind !== "permanent" && <div className="grid grid-cols-2 gap-2"><div><Label>{t.locks.start}</Label><Input type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} /></div><div><Label>{t.locks.end}</Label><Input type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} /></div></div>}</div><DialogFooter><Button type="button" disabled={!name.trim() || !/^\d{6,12}$/.test(code) || (kind !== "permanent" && (!start || !end)) || saving} onClick={() => void submit()}>{saving ? t.common.loading : t.locks.createCode}</Button></DialogFooter></>}</DialogContent></Dialog>
    <AlertDialog open={Boolean(revokeId)} onOpenChange={(open) => !open && setRevokeId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t.locks.revokeCodeTitle}</AlertDialogTitle><AlertDialogDescription>{t.locks.revokeCodeDescription}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t.common.cancel}</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void revoke()}>{t.locks.revoke}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
