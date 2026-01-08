"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Plus, Trash2 } from "lucide-react";
import type { Tables } from "@/database.types";

type Delivery = Tables<"deliveries">;

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

interface DeliveriesProps {
  propertyId: string;
}

export function Deliveries({ propertyId }: DeliveriesProps) {
  const supabase = createClient();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("Other");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("deliveries")
      .select("*")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });
    setDeliveries(data ?? []);
  }, [supabase, propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const addDelivery = async () => {
    setLoading(true);
    await supabase.from("deliveries").insert({
      property_id: propertyId,
      carrier,
      tracking_number: trackingNumber.trim() || null,
      status: "ordered",
    });
    setTrackingNumber("");
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

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
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
            placeholder="Tracking number (optional)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
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
            <Button disabled={loading} onClick={addDelivery}>
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
                  <div className="font-medium text-sm">{d.carrier}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.tracking_number ?? "No tracking"} ·{" "}
                    {STATUS_LABELS[d.status] ?? d.status}
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
                  <textarea
                    className="w-full min-h-[60px] rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    placeholder="Notes"
                    defaultValue={d.notes ?? ""}
                    onBlur={(e) =>
                      updateField(d.id, "notes", e.target.value || null)
                    }
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
