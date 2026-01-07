"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PREFECTURES } from "@/components/japan-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Plus, Loader2 } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    prefecture_id: "",
    floor_unit: "",
    notes: "",
    wifi_ssid: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    const { error: insertError } = await supabase.from("properties").insert({
      name: formData.name,
      address: formData.address,
      prefecture_id: formData.prefecture_id || null,
      floor_unit: formData.floor_unit || null,
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
      prefecture_id: "",
      floor_unit: "",
      notes: "",
      wifi_ssid: "",
    });

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

  const sortedPrefectures = [...PREFECTURES].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <main className="min-h-dvh p-4 max-w-xl mx-auto pb-20">
      <header className="py-2">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-2 -ml-2">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Map
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Add Property</h1>
        <p className="text-sm text-muted-foreground">
          Create a new house entry
        </p>
      </header>

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
            <Label htmlFor="prefecture_id">Prefecture</Label>
            <select
              id="prefecture_id"
              name="prefecture_id"
              value={formData.prefecture_id}
              onChange={handleChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select prefecture...</option>
              {sortedPrefectures.map((pref) => (
                <option key={pref.id} value={pref.id}>
                  {pref.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Links this property to a location on the map
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="floor_unit">Floor / Unit</Label>
            <Input
              id="floor_unit"
              name="floor_unit"
              value={formData.floor_unit}
              onChange={handleChange}
              placeholder="3F, Room 301"
            />
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
    </main>
  );
}
