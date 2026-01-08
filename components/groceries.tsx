"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ShoppingCart, Plus, Trash2, Loader2 } from "lucide-react";
import type { Tables } from "@/database.types";

type GroceryItem = Tables<"grocery_items">;

interface GroceriesProps {
  propertyId: string;
  initialItems?: GroceryItem[];
}

export function Groceries({ propertyId, initialItems }: GroceriesProps) {
  const { t } = useI18n();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<GroceryItem[]>(initialItems ?? []);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

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
    if (!initialItems) {
      load();
    }
  }, [load, initialItems]);

  const addItem = async () => {
    const itemName = text.trim();
    if (!itemName) return;

    setLoading(true);
    setText("");

    const optimisticItem: GroceryItem = {
      id: `temp-${Date.now()}`,
      property_id: propertyId,
      item_name: itemName,
      quantity: null,
      checked: false,
      added_by: null,
      created_at: new Date().toISOString(),
      updated_at: null,
    };

    setItems((prev) => [optimisticItem, ...prev]);

    const { error } = await supabase.from("grocery_items").insert({
      property_id: propertyId,
      item_name: itemName,
      checked: false,
    });

    if (error) {
      setItems((prev) => prev.filter((item) => item.id !== optimisticItem.id));
      toast.error(t.groceries.errorAdding);
    } else {
      toast.success(t.groceries.itemAdded);
      await load();
    }

    setLoading(false);
  };

  const toggleItem = async (id: string, checked: boolean | null) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !checked } : item
      )
    );

    const { error } = await supabase
      .from("grocery_items")
      .update({ checked: !checked })
      .eq("id", id);

    if (error) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, checked: checked } : item
        )
      );
      toast.error(t.groceries.errorToggling);
    }
  };

  const deleteItem = async (id: string) => {
    const deletedItem = items.find((item) => item.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));

    const { error } = await supabase.from("grocery_items").delete().eq("id", id);

    if (error) {
      if (deletedItem) {
        setItems((prev) => [...prev, deletedItem]);
      }
      toast.error(t.groceries.errorDeleting);
    } else {
      toast.success(t.groceries.itemDeleted);
    }
  };

  const clearChecked = async () => {
    const checkedItems = items.filter((i) => i.checked);
    const checkedIds = checkedItems.map((i) => i.id);
    if (checkedIds.length === 0) return;

    setItems((prev) => prev.filter((item) => !item.checked));
    setClearDialogOpen(false);

    const { error } = await supabase.from("grocery_items").delete().in("id", checkedIds);

    if (error) {
      setItems((prev) => [...prev, ...checkedItems]);
      toast.error(t.groceries.errorClearing);
    } else {
      toast.success(t.groceries.itemsCleared);
    }
  };

  const uncheckedCount = items.filter((i) => !i.checked).length;
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            {t.groceries.title}
            {uncheckedCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {uncheckedCount}
              </span>
            )}
          </span>
          {checkedCount > 0 && (
            <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  {t.groceries.clearDone}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.groceries.confirmClearTitle}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t.groceries.confirmClearDescription}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={clearChecked}>
                    {t.groceries.confirmClearAction}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
            placeholder={t.groceries.addItem}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!text.trim() || loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </form>

        <div className="space-y-2">
          {items.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              {t.groceries.noItems}
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
