"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JapanMap, type MapLocation } from "@/components/japan-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Loader2, MapPin, Pencil, X, Save } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  notes: string | null;
  wifi_ssid: string | null;
  location_x: number | null;
  location_y: number | null;
}

interface AdminFormProps {
  property?: Property;
}

export function AdminForm({ property }: AdminFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  const isEditMode = !!property;

  const [formData, setFormData] = useState({
    name: property?.name ?? "",
    address: property?.address ?? "",
    notes: property?.notes ?? "",
    wifi_ssid: property?.wifi_ssid ?? "",
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

    const supabase = createClient();

    const payload = {
      name: formData.name,
      address: formData.address,
      location_x: location?.x ?? null,
      location_y: location?.y ?? null,
      notes: formData.notes || null,
      wifi_ssid: formData.wifi_ssid || null,
    };

    const { error: dbError } = isEditMode
      ? await supabase.from("properties").update(payload).eq("id", property.id)
      : await supabase.from("properties").insert(payload);

    setLoading(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setSuccess(true);

    if (isEditMode) {
      setTimeout(() => {
        router.push(`/properties/${property.id}`);
      }, 1000);
    } else {
      setFormData({
        name: "",
        address: "",
        notes: "",
        wifi_ssid: "",
      });
      setLocation(null);
      setTimeout(() => {
        router.refresh();
      }, 1000);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Kanazawa House"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="1-2-3 Katamachi, Kanazawa"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Location on Map</Label>
          <div className={`border rounded-md overflow-hidden transition-colors ${isEditingLocation ? "border-primary ring-2 ring-primary/20" : "border-input"}`}>
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
                  markers={location ? [{ id: "selected", name: "Selected Location", x: location.x, y: location.y }] : []}
                />
              )}
              {isEditingLocation && (
                <div className="absolute inset-0 pointer-events-none flex items-start justify-center pt-4">
                  <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium animate-pulse">
                    Click anywhere on the map
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t border-input bg-muted/30">
              {location ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">Location set</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isEditingLocation ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditingLocation}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={startEditingLocation}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
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
                  <span className="text-sm text-muted-foreground">No location set</span>
                  {isEditingLocation ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditingLocation}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={startEditingLocation}
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      Set Location
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wifi_ssid">WiFi SSID</Label>
          <Input
            id="wifi_ssid"
            name="wifi_ssid"
            value={formData.wifi_ssid}
            onChange={handleChange}
            placeholder="HomeNetwork-5G"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Entry code, parking info, etc."
            rows={3}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400 p-3 rounded-md">
            {isEditMode ? "Property updated successfully!" : "Property added successfully!"}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEditMode ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
