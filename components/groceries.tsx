"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Trash2 } from "lucide-react";
import type { Tables } from "@/database.types";

type GroceryItem = Tables<"grocery_items">;

interface GroceriesProps {
  propertyId: string;
}

export function Groceries({ propertyId }: GroceriesProps) {
  const supabase = createClient();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("property_id", propertyId)
      .order("checked", { ascending: true })
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  }, [supabase, propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = async () => {
    const itemName = text.trim();
    if (!itemName) return;

    setLoading(true);
    setText("");
    await supabase.from("grocery_items").insert({
      property_id: propertyId,
      item_name: itemName,
      checked: false,
    });
    await load();
    setLoading(false);
  };

  const toggleItem = async (id: string, checked: boolean | null) => {
    await supabase
      .from("grocery_items")
      .update({ checked: !checked })
      .eq("id", id);
    await load();
  };

  const deleteItem = async (id: string) => {
    await supabase.from("grocery_items").delete().eq("id", id);
    await load();
  };

  const clearChecked = async () => {
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) return;
    await supabase.from("grocery_items").delete().in("id", checkedIds);
    await load();
  };

  const uncheckedCount = items.filter((i) => !i.checked).length;
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Groceries
            {uncheckedCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {uncheckedCount}
              </span>
            )}
          </span>
          {checkedCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChecked}>
              Clear done
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addItem();
          }}
        >
          <Input
            placeholder="Add item..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!text.trim() || loading}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <div className="space-y-2">
          {items.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              No items yet
            </p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-2 px-3 rounded-lg border bg-card"
            >
              <Checkbox
                checked={item.checked ?? false}
                onCheckedChange={() => toggleItem(item.id, item.checked)}
                className="h-5 w-5"
              />
              <span
                className={`flex-1 text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}
              >
                {item.item_name}
                {item.quantity && (
                  <span className="text-muted-foreground ml-1">
                    ({item.quantity})
                  </span>
                )}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => deleteItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
