"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Plus, Trash2, Camera, X } from "lucide-react";

const STATUSES = [
  "ordered",
  "shipped",
  "out_for_delivery",
  "delivered",
  "stored",
] as const;

const CARRIERS = ["Yamato", "Sagawa", "JP Post", "Amazon", "Other"];

const STATUS_LABELS: Record<string, string> = {
  ordered: "Ordered",
  shipped: "Shipped",
  out_for_delivery: "Out",
  delivered: "Delivered",
  stored: "Stored",
};

interface Delivery {
  id: string;
  title: string;
  carrier: string;
  tracking_number: string | null;
  status: string;
  eta_date: string | null;
  dropoff_location: string | null;
  notes: string | null;
}

interface DeliveryPhoto {
  id: string;
  storage_path: string;
}

interface DeliveriesProps {
  propertyId: string;
}

export function Deliveries({ propertyId }: DeliveriesProps) {
  const supabase = createClient();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [title, setTitle] = useState("");
  const [carrier, setCarrier] = useState("Other");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Record<string, DeliveryPhoto[]>>({});

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("deliveries")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });
    setDeliveries((data as Delivery[]) ?? []);
  }, [supabase, propertyId]);

  const loadPhotos = useCallback(
    async (deliveryId: string) => {
      const { data } = await supabase
        .from("delivery_photos")
        .select("id, storage_path")
        .eq("delivery_id", deliveryId);
      if (data) {
        setPhotos((prev) => ({ ...prev, [deliveryId]: data }));
      }
    },
    [supabase]
  );

  useEffect(() => {
    load();
  }, [load]);

  const addDelivery = async () => {
    const t = title.trim();
    if (!t) return;

    setLoading(true);
    await supabase.from("deliveries").insert({
      property_id: propertyId,
      title: t,
      carrier,
      status: "ordered",
    });
    setTitle("");
    setCarrier("Other");
    await load();
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("deliveries").update({ status }).eq("id", id);
    await load();
  };

  const updateField = async (
    id: string,
    field: string,
    value: string | null
  ) => {
    await supabase
      .from("deliveries")
      .update({ [field]: value })
      .eq("id", id);
    await load();
  };

  const deleteDelivery = async (id: string) => {
    await supabase.from("deliveries").delete().eq("id", id);
    await load();
  };

  const uploadPhoto = async (deliveryId: string, file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${deliveryId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("delivery-photos")
      .upload(path, file);

    if (uploadError) return;

    await supabase.from("delivery_photos").insert({
      delivery_id: deliveryId,
      storage_path: path,
    });

    await loadPhotos(deliveryId);
  };

  const deletePhoto = async (photoId: string, deliveryId: string) => {
    const photo = photos[deliveryId]?.find((p) => p.id === photoId);
    if (photo) {
      await supabase.storage.from("delivery-photos").remove([photo.storage_path]);
      await supabase.from("delivery_photos").delete().eq("id", photoId);
      await loadPhotos(deliveryId);
    }
  };

  const getSignedUrl = async (path: string): Promise<string> => {
    const { data } = await supabase.storage
      .from("delivery-photos")
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? "";
  };

  const toggleExpand = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      if (!photos[id]) {
        await loadPhotos(id);
      }
    }
  };

  const activeCount = deliveries.filter(
    (d) => !["delivered", "stored"].includes(d.status)
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          Deliveries
          {activeCount > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {activeCount}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="What's being shipped?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="flex gap-2">
            <select
              className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              {CARRIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Button
              disabled={!title.trim() || loading}
              onClick={addDelivery}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {deliveries.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              No deliveries
            </p>
          )}

          {deliveries.map((d) => (
            <div key={d.id} className="rounded-lg border bg-card p-3 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <button
                  className="text-left flex-1"
                  onClick={() => toggleExpand(d.id)}
                >
                  <div className="font-medium text-sm">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.carrier} · {STATUS_LABELS[d.status] ?? d.status}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteDelivery(d.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1">
                {STATUSES.map((s) => (
                  <Button
                    key={s}
                    variant={d.status === s ? "default" : "outline"}
                    size="sm"
                    className="text-xs px-2 h-7"
                    onClick={() => updateStatus(d.id, s)}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>

              {expanded === d.id && (
                <div className="space-y-3 pt-2 border-t">
                  <Input
                    placeholder="Tracking number"
                    defaultValue={d.tracking_number ?? ""}
                    onBlur={(e) =>
                      updateField(d.id, "tracking_number", e.target.value || null)
                    }
                  />
                  <Input
                    placeholder="Drop-off location"
                    defaultValue={d.dropoff_location ?? ""}
                    onBlur={(e) =>
                      updateField(d.id, "dropoff_location", e.target.value || null)
                    }
                  />
                  <textarea
                    className="w-full min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    placeholder="Notes"
                    defaultValue={d.notes ?? ""}
                    onBlur={(e) =>
                      updateField(d.id, "notes", e.target.value || null)
                    }
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Photos
                      </span>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadPhoto(d.id, file);
                            e.target.value = "";
                          }}
                        />
                        <Button variant="outline" size="sm" asChild>
                          <span>
                            <Camera className="h-4 w-4 mr-1" />
                            Add
                          </span>
                        </Button>
                      </label>
                    </div>

                    {photos[d.id]?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {photos[d.id].map((photo) => (
                          <PhotoThumbnail
                            key={photo.id}
                            photo={photo}
                            getSignedUrl={getSignedUrl}
                            onDelete={() => deletePhoto(photo.id, d.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PhotoThumbnail({
  photo,
  getSignedUrl,
  onDelete,
}: {
  photo: DeliveryPhoto;
  getSignedUrl: (path: string) => Promise<string>;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    getSignedUrl(photo.storage_path).then(setUrl);
  }, [photo.storage_path, getSignedUrl]);

  if (!url) return null;

  return (
    <div className="relative group">
      <img
        src={url}
        alt=""
        className="h-16 w-16 object-cover rounded-md border"
      />
      <button
        className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
