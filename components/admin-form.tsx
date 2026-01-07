"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JapanMap } from "@/components/japan-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Loader2, X } from "lucide-react";

interface MapLocation {
  x: number;
  y: number;
}

export function AdminForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    notes: "",
    wifi_ssid: "",
  });

  const [location, setLocation] = useState<MapLocation | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    const { error: insertError } = await supabase.from("properties").insert({
      name: formData.name,
      address: formData.address,
      location_x: location?.x ?? null,
      location_y: location?.y ?? null,
      notes: formData.notes || null,
      wifi_ssid: formData.wifi_ssid || null,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSuccess(true);
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
  };

  const clearLocation = () => {
    setLocation(null);
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
          <div className="border border-input rounded-md overflow-hidden">
            <div className="h-[300px] bg-muted/30">
              <JapanMap
                selectionMode
                selectedLocation={location}
                onLocationClick={handleLocationSelect}
              />
            </div>
            {location && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-input bg-muted/50">
                <span className="text-sm font-medium">Location: ({location.x}, {location.y})</span>
                <button
                  type="button"
                  onClick={clearLocation}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {!location && (
              <div className="px-3 py-2 border-t border-input">
                <span className="text-sm text-muted-foreground">Click on the map to set the property location</span>
              </div>
            )}
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
            Property added successfully!
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
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
