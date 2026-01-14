"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useI18n } from "@/lib/i18n/context";
import { JapanMap, type MapLocation } from "@/components/japan-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Loader2, MapPin, Pencil, X, Save } from "lucide-react";

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

  const startEditingLocation = () => {
    setIsEditingLocation(true);
  };

  const cancelEditingLocation = () => {
    setIsEditingLocation(false);
  };

  return (
    <Card className="mt-6 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">{t.form.name} *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t.form.namePlaceholder}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">{t.form.slug}</Label>
          <Input
            id="slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="my-house"
            pattern="^[a-z0-9-]+$"
          />
          <p className="text-xs text-muted-foreground">{t.form.slugHint}</p>
        </div>

        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <Label className="text-base font-medium">{t.form.address}</Label>

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

        <div className="space-y-2">
          <Label>{t.form.locationOnMap}</Label>
          <div
            className={`border rounded-md overflow-hidden transition-colors ${
              isEditingLocation
                ? "border-primary ring-2 ring-primary/20"
                : "border-input"
            }`}
          >
            <div className="h-[300px] bg-muted/30 relative">
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
                <div className="absolute inset-0 pointer-events-none flex items-start justify-center pt-4">
                  <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium animate-pulse">
                    {t.form.clickToSetLocation}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t border-input bg-muted/30">
              {location ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{t.form.locationSet}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isEditingLocation ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditingLocation}
                      >
                        {t.common.cancel}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={startEditingLocation}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        {t.common.edit}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearLocation}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">
                    {t.form.noLocationSet}
                  </span>
                  {isEditingLocation ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditingLocation}
                    >
                      {t.common.cancel}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={startEditingLocation}
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {t.form.setLocation}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wifi_ssid">{t.form.wifiSSID}</Label>
          <Input
            id="wifi_ssid"
            name="wifi_ssid"
            value={formData.wifi_ssid}
            onChange={handleChange}
            placeholder={t.form.wifiSSIDPlaceholder}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wifi_password">{t.form.wifiPassword}</Label>
          <Input
            id="wifi_password"
            name="wifi_password"
            type="password"
            value={formData.wifi_password}
            onChange={handleChange}
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guest_wifi_ssid">{t.form.guestWifiSSID}</Label>
          <Input
            id="guest_wifi_ssid"
            name="guest_wifi_ssid"
            value={formData.guest_wifi_ssid}
            onChange={handleChange}
            placeholder={t.form.guestWifiSSIDPlaceholder}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="guest_wifi_password">
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

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 p-3 rounded-md">
            {isEditMode ? t.admin.propertyUpdated : t.admin.propertyAdded}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEditMode ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t.admin.saveChanges}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              {t.admin.addProperty}
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
