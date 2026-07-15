"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useI18n } from "@/lib/i18n/context";
import { JapanMap, type MapLocation } from "@/components/japan-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, MapPin, Pencil, X, Save } from "lucide-react";
import { MailboxLockInput } from "@/components/mailbox-lock-input";
import { AutoLockInput } from "@/components/auto-lock-input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Property {
  id: string;
  slug: string | null;
  name: string;
  postal_code: string | null;
  prefecture: string | null;
  city_ward_town: string | null;
  area: string | null;
  chome: string | null;
  block: string | null;
  building: string | null;
  room: string | null;
  wifi_ssid: string | null;
  wifi_password: string | null;
  guest_wifi_ssid: string | null;
  guest_wifi_password: string | null;
  mailbox_lock_combination: string | null;
  auto_lock_code: string | null;
  location_x: number | null;
  location_y: number | null;
  apple_maps_url: string | null;
}

interface AdminFormProps {
  property?: Property;
}

export function AdminForm({ property }: AdminFormProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  const createMutation = useMutation(api.properties.create);
  const updateMutation = useMutation(api.properties.update);
  const devices = useQuery(api.locks.devicesForProperty, property ? { propertyId: property.id as Id<"properties"> } : "skip") as Array<{ _id: string; deviceId: string; deviceType: string; label: string; deviceRole: string; keypadDeviceId?: string }> | undefined;
  const bindDevice = useMutation(api.locks.bindDevice);
  const unbindDevice = useMutation(api.locks.unbindDevice);
  const listAccountLocks = useAction(api.switchbot.listAccountLocks);
  const registerWebhook = useAction(api.switchbot.registerWebhook);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [accountDevices, setAccountDevices] = useState<{ locks: Array<{deviceId:string;deviceName:string;deviceType:string}>; keypads: Array<{deviceId:string;deviceName:string;deviceType:string;lockDeviceId?:string}> } | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [deviceRole, setDeviceRole] = useState("entrance");
  const [keypadDeviceId, setKeypadDeviceId] = useState("");
  const [binding, setBinding] = useState(false);
  const [unbindingId, setUnbindingId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");

  const isEditMode = !!property;

  const [formData, setFormData] = useState({
    name: property?.name ?? "",
    slug: property?.slug ?? "",
    postal_code: property?.postal_code ?? "",
    prefecture: property?.prefecture ?? "",
    city_ward_town: property?.city_ward_town ?? "",
    area: property?.area ?? "",
    chome: property?.chome ?? "",
    block: property?.block ?? "",
    building: property?.building ?? "",
    room: property?.room ?? "",
    apple_maps_url: property?.apple_maps_url ?? "",
    wifi_ssid: property?.wifi_ssid ?? "",
    wifi_password: property?.wifi_password ?? "",
    guest_wifi_ssid: property?.guest_wifi_ssid ?? "",
    guest_wifi_password: property?.guest_wifi_password ?? "",
    mailbox_lock_combination: property?.mailbox_lock_combination ?? "",
    auto_lock_code: property?.auto_lock_code ?? "",
  });

  const [location, setLocation] = useState<MapLocation | null>(
    property?.location_x != null && property?.location_y != null
      ? { x: property.location_x, y: property.location_y }
      : null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const payload = {
      name: formData.name,
      slug: formData.slug || undefined,
      postalCode: formData.postal_code || undefined,
      prefecture: formData.prefecture || undefined,
      cityWardTown: formData.city_ward_town || undefined,
      area: formData.area || undefined,
      chome: formData.chome || undefined,
      block: formData.block || undefined,
      building: formData.building || undefined,
      room: formData.room || undefined,
      locationX: location?.x,
      locationY: location?.y,
      appleMapsUrl: formData.apple_maps_url || undefined,
      wifiSsid: formData.wifi_ssid || undefined,
      wifiPassword: formData.wifi_password || undefined,
      guestWifiSsid: formData.guest_wifi_ssid || undefined,
      guestWifiPassword: formData.guest_wifi_password || undefined,
      mailboxLockCombination: formData.mailbox_lock_combination || undefined,
      autoLockCode: formData.auto_lock_code || undefined,
    };

    try {
      if (isEditMode) {
        await updateMutation({
          id: property.id as Id<"properties">,
          ...payload,
        });
      } else {
        await createMutation(payload);
      }

      setSuccess(true);

      if (isEditMode) {
        setTimeout(() => {
          router.push(`/p/${formData.slug || property.id}`);
        }, 1000);
      } else {
        setFormData({
          name: "",
          slug: "",
          postal_code: "",
          prefecture: "",
          city_ward_town: "",
          area: "",
          chome: "",
          block: "",
          building: "",
          room: "",
          apple_maps_url: "",
          wifi_ssid: "",
          wifi_password: "",
          guest_wifi_ssid: "",
          guest_wifi_password: "",
          mailbox_lock_combination: "",
          auto_lock_code: "",
        });
        setLocation(null);
        setTimeout(() => {
          router.refresh();
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }

    setLoading(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLocationSelect = (loc: MapLocation) => {
    setLocation(loc);
    setIsEditingLocation(false);
  };

  const clearLocation = () => {
    setLocation(null);
  };

  const openAddDevice = async () => {
    setAddDeviceOpen(true); setAccountDevices(null);
    try { setAccountDevices(await listAccountLocks({})); }
    catch (err) { toast.error(err instanceof Error ? err.message : t.common.errorGeneric); setAddDeviceOpen(false); }
  };
  const selectLock = (id: string) => {
    setSelectedDeviceId(id);
    const lock = accountDevices?.locks.find((item) => item.deviceId === id);
    if (!lock) return;
    setDeviceLabel(lock.deviceName);
    setKeypadDeviceId(accountDevices?.keypads.find((item) => item.lockDeviceId === id)?.deviceId ?? "");
  };
  const submitDevice = async () => {
    if (!property || !selectedDeviceId || !deviceLabel.trim()) return;
    const lock = accountDevices?.locks.find((item) => item.deviceId === selectedDeviceId); if (!lock) return;
    setBinding(true);
    try { await bindDevice({ propertyId: property.id as Id<"properties">, deviceId: lock.deviceId, deviceType: lock.deviceType, label: deviceLabel.trim(), deviceRole: deviceRole as "entrance" | "unit" | "mailbox" | "other", keypadDeviceId: keypadDeviceId || undefined }); toast.success(t.admin.deviceBound); setAddDeviceOpen(false); }
    catch (err) { toast.error(err instanceof Error ? err.message : t.common.errorGeneric); } finally { setBinding(false); }
  };
  const confirmUnbind = async () => { if (!unbindingId) return; try { await unbindDevice({ deviceDbId: unbindingId as never }); toast.success(t.admin.deviceUnbound); } catch (err) { toast.error(err instanceof Error ? err.message : t.common.errorGeneric); } finally { setUnbindingId(null); } };
  const submitWebhook = async () => { if (!webhookUrl.trim()) return; try { await registerWebhook({ url: webhookUrl.trim() }); toast.success(t.admin.webhookRegistered); } catch (err) { toast.error(err instanceof Error ? err.message : t.common.errorGeneric); } };

  const startEditingLocation = () => {
    setIsEditingLocation(true);
  };

  const cancelEditingLocation = () => {
    setIsEditingLocation(false);
  };

  const sectionClass =
    "flex flex-col gap-3.5 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none";
  const fieldLabelClass = "text-xs font-semibold text-muted-foreground";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className={sectionClass}>
        <div className="text-sm font-bold">{t.form.basicInfo}</div>
        <div className="space-y-1.5">
          <Label htmlFor="name" className={fieldLabelClass}>
            {t.form.name} *
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t.form.namePlaceholder}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug" className={fieldLabelClass}>
            {t.form.slug}
          </Label>
          <Input
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="my-house"
            pattern="^[a-z0-9-]+$"
          />
          <p className="text-[11px] text-muted-foreground">{t.form.slugHint}</p>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="text-sm font-bold">{t.form.address}</div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="postal_code"
                className="text-xs text-muted-foreground"
              >
                {t.form.postalCode}
              </Label>
              <Input
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="123-4567"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="prefecture"
                className="text-xs text-muted-foreground"
              >
                {t.form.prefecture}
              </Label>
              <Input
                id="prefecture"
                name="prefecture"
                value={formData.prefecture}
                onChange={handleChange}
                placeholder={t.form.prefecturePlaceholder}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="city_ward_town"
              className="text-xs text-muted-foreground"
            >
              {t.form.cityWardTown}
            </Label>
            <Input
              id="city_ward_town"
              name="city_ward_town"
              value={formData.city_ward_town}
              onChange={handleChange}
              placeholder={t.form.cityWardTownPlaceholder}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="area" className="text-xs text-muted-foreground">
              {t.form.area}
            </Label>
            <Input
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              placeholder={t.form.areaPlaceholder}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="chome" className="text-xs text-muted-foreground">
                {t.form.chome}
              </Label>
              <Input
                id="chome"
                name="chome"
                value={formData.chome}
                onChange={handleChange}
                placeholder="1"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block" className="text-xs text-muted-foreground">
                {t.form.block}
              </Label>
              <Input
                id="block"
                name="block"
                value={formData.block}
                onChange={handleChange}
                placeholder="1-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="building"
                className="text-xs text-muted-foreground"
              >
                {t.form.building}
              </Label>
              <Input
                id="building"
                name="building"
                value={formData.building}
                onChange={handleChange}
                placeholder={t.form.buildingPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room" className="text-xs text-muted-foreground">
                {t.form.room}
              </Label>
              <Input
                id="room"
                name="room"
                value={formData.room}
                onChange={handleChange}
                placeholder="101"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-dashed">
            <Label
              htmlFor="apple_maps_url"
              className="text-xs text-muted-foreground"
            >
              {t.form.appleMapsUrl}
            </Label>
            <Input
              id="apple_maps_url"
              name="apple_maps_url"
              value={formData.apple_maps_url}
              onChange={handleChange}
              placeholder="https://maps.apple.com/?..."
            />
            <p className="text-xs text-muted-foreground">
              {t.form.appleMapsUrlHint}
            </p>
          </div>
        </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold">{t.form.locationOnMap}</div>
          {location && !isEditingLocation && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <MapPin className="h-3.5 w-3.5" />
              {t.form.locationSet}
            </div>
          )}
        </div>
        <div
          className={`relative overflow-hidden rounded-xl border transition-colors ${
            isEditingLocation
              ? "h-[300px] border-primary ring-2 ring-primary/20"
              : "h-[180px] border-hairline"
          } bg-muted/30`}
        >
          {isEditingLocation ? (
            <JapanMap
              mode="edit"
              selectedLocation={location}
              onLocationClick={handleLocationSelect}
            />
          ) : (
            <JapanMap
              mode="view"
              markers={
                location
                  ? [
                      {
                        id: "selected",
                        name: "Selected Location",
                        x: location.x,
                        y: location.y,
                      },
                    ]
                  : []
              }
            />
          )}
          {isEditingLocation && (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-4">
              <div className="animate-pulse rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
                {t.form.clickToSetLocation}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isEditingLocation ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-xl text-xs shadow-none"
              onClick={cancelEditingLocation}
            >
              {t.common.cancel}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 rounded-xl text-xs shadow-none"
              onClick={startEditingLocation}
            >
              {location ? (
                <>
                  <Pencil className="h-[13px] w-[13px]" />
                  {t.common.edit}
                </>
              ) : (
                <>
                  <MapPin className="h-[13px] w-[13px]" />
                  {t.form.setLocation}
                </>
              )}
            </Button>
          )}
          {location && (
            <Button
              type="button"
              variant="outline"
              className="h-10 w-11 rounded-xl px-0 text-destructive shadow-none"
              onClick={clearLocation}
              aria-label={t.a11y.clearLocation}
            >
              <X className="h-[15px] w-[15px]" />
            </Button>
          )}
        </div>
        {!location && !isEditingLocation && (
          <p className="text-xs text-muted-foreground">{t.form.noLocationSet}</p>
        )}
      </div>

      <div className={sectionClass}>
        <div className="text-sm font-bold">{t.info.wifi}</div>
        <div className="space-y-1.5">
          <Label htmlFor="wifi_ssid" className={fieldLabelClass}>
            {t.form.wifiSSID}
          </Label>
          <Input
            id="wifi_ssid"
            name="wifi_ssid"
            value={formData.wifi_ssid}
            onChange={handleChange}
            placeholder={t.form.wifiSSIDPlaceholder}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wifi_password" className={fieldLabelClass}>
            {t.form.wifiPassword}
          </Label>
          <Input
            id="wifi_password"
            name="wifi_password"
            type="password"
            value={formData.wifi_password}
            onChange={handleChange}
            placeholder="••••••••"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guest_wifi_ssid" className={fieldLabelClass}>
            {t.form.guestWifiSSID}
          </Label>
          <Input
            id="guest_wifi_ssid"
            name="guest_wifi_ssid"
            value={formData.guest_wifi_ssid}
            onChange={handleChange}
            placeholder={t.form.guestWifiSSIDPlaceholder}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guest_wifi_password" className={fieldLabelClass}>
            {t.form.guestWifiPassword}
          </Label>
          <Input
            id="guest_wifi_password"
            name="guest_wifi_password"
            type="password"
            value={formData.guest_wifi_password}
            onChange={handleChange}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className={sectionClass}>
        <div className="text-sm font-bold">{t.form.mailboxLockCombination}</div>
        <MailboxLockInput
          value={formData.mailbox_lock_combination}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, mailbox_lock_combination: value }))
          }
        />
      </div>

      <div className={sectionClass}>
        <div className="text-sm font-bold">{t.form.autoLockCode}</div>
        <AutoLockInput
          value={formData.auto_lock_code}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, auto_lock_code: value }))
          }
        />
      </div>

      <div className={sectionClass}>
        <div className="flex items-center justify-between"><div className="text-sm font-bold">{t.admin.switchbotDevices}</div>{isEditMode && <Button type="button" size="sm" className="rounded-xl" onClick={() => void openAddDevice()}><Plus className="h-4 w-4" />{t.admin.addDevice}</Button>}</div>
        {!isEditMode ? <p className="text-xs text-muted-foreground">{t.admin.saveFirst}</p> : <>
          {!devices?.length ? <p className="text-xs text-muted-foreground">{t.admin.noDevices}</p> : <div className="divide-y divide-hairline">{devices.map((device) => <div key={device._id} className="flex items-center gap-3 py-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{device.label}</p><p className="text-xs text-muted-foreground">{device.deviceType} · {device.deviceRole} · {device.keypadDeviceId ? t.admin.keypad : t.admin.noKeypad}</p></div><Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setUnbindingId(device._id)}>{t.admin.unbind}</Button></div>)}</div>}
          <div className="mt-2 border-t border-hairline pt-3"><Label className={fieldLabelClass}>{t.admin.webhookUrl}</Label><div className="mt-1 flex gap-2"><Input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://…/switchbot-webhook?token=" /><Button type="button" variant="outline" className="shrink-0" onClick={() => void submitWebhook()}>{t.admin.registerWebhook}</Button></div><p className="mt-1 text-[11px] text-muted-foreground">{t.admin.webhookHint}</p></div>
        </>}
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
          {isEditMode ? t.admin.propertyUpdated : t.admin.propertyAdded}
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isEditMode ? (
          <>
            <Save className="h-[17px] w-[17px]" />
            {t.admin.saveChanges}
          </>
        ) : (
          <>
            <Plus className="h-[17px] w-[17px]" />
            {t.admin.addProperty}
          </>
        )}
      </Button>
      <Dialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen}><DialogContent><DialogHeader><DialogTitle>{t.admin.addDevice}</DialogTitle></DialogHeader>{!accountDevices ? <p className="text-sm text-muted-foreground">{t.common.loading}</p> : <div className="space-y-3"><select className="h-11 w-full rounded-lg border bg-card px-3 text-sm" value={selectedDeviceId} onChange={(event) => selectLock(event.target.value)}><option value="">{t.admin.selectDevice}</option>{accountDevices.locks.map((lock) => <option key={lock.deviceId} value={lock.deviceId}>{lock.deviceName} · {lock.deviceType}</option>)}</select>{selectedDeviceId && <><div><Label>{t.admin.deviceLabel}</Label><Input value={deviceLabel} onChange={(event) => setDeviceLabel(event.target.value)} /></div><div><Label>{t.admin.deviceRole}</Label><select className="mt-1 h-11 w-full rounded-lg border bg-card px-3 text-sm" value={deviceRole} onChange={(event) => setDeviceRole(event.target.value)}><option value="entrance">{t.locks.roles.entrance}</option><option value="unit">{t.locks.roles.unit}</option><option value="mailbox">{t.locks.roles.mailbox}</option><option value="other">{t.locks.roles.other}</option></select></div><div><Label>{t.admin.keypad}</Label><select className="mt-1 h-11 w-full rounded-lg border bg-card px-3 text-sm" value={keypadDeviceId} onChange={(event) => setKeypadDeviceId(event.target.value)}><option value="">{t.admin.noKeypad}</option>{accountDevices.keypads.map((keypad) => <option key={keypad.deviceId} value={keypad.deviceId}>{keypad.deviceName}</option>)}</select></div></>}</div>}<DialogFooter><Button type="button" disabled={!selectedDeviceId || !deviceLabel.trim() || binding} onClick={() => void submitDevice()}>{binding ? t.common.loading : t.common.add}</Button></DialogFooter></DialogContent></Dialog>
      <AlertDialog open={Boolean(unbindingId)} onOpenChange={(open) => !open && setUnbindingId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t.admin.unbindTitle}</AlertDialogTitle><AlertDialogDescription>{t.admin.unbindDescription}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t.common.cancel}</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void confirmUnbind()}>{t.admin.unbind}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </form>
  );
}
