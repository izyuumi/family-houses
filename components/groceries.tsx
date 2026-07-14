"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
import { ListTodo, Plus, Trash2, Loader2 } from "lucide-react";

interface GroceryItem {
  id: string;
  property_id: string;
  item_name: string;
  quantity: string | null;
  checked: boolean | null;
  added_by: string | null;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  adder?: { display_name: string | null } | null;
  completer?: { display_name: string | null } | null;
}

interface GroceriesProps {
  propertyId: string;
  initialItems?: GroceryItem[];
  userId?: string;
}

export function Groceries({
  propertyId,
  initialItems,
  userId,
}: GroceriesProps) {
  const { t, language } = useI18n();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const convexPropertyId = propertyId as Id<"properties">;
  const liveItems = useQuery(api.groceryItems.listByProperty, { propertyId: convexPropertyId });
  const addMutation = useMutation(api.groceryItems.add);
  const toggleMutation = useMutation(api.groceryItems.toggle);
  const removeMutation = useMutation(api.groceryItems.remove);
  const clearCheckedMutation = useMutation(api.groceryItems.clearChecked);

  const items: GroceryItem[] = liveItems
    ? liveItems.map((item) => ({
        id: item._id,
        property_id: item.propertyId,
        item_name: item.itemName,
        quantity: item.quantity ?? null,
        checked: item.checked,
        added_by: item.addedBy ?? null,
        completed_by: item.completedBy ?? null,
        completed_at: item.completedAt ? new Date(item.completedAt).toISOString() : null,
        created_at: item._creationTime ? new Date(item._creationTime).toISOString() : null,
        updated_at: null,
        adder: item.adder ? { display_name: item.adder.displayName ?? null } : null,
        completer: item.completer ? { display_name: item.completer.displayName ?? null } : null,
      }))
    : (initialItems ?? []);

  const addItem = async () => {
    const itemName = text.trim();
    if (!itemName) return;

    setLoading(true);
    setText("");

    try {
      await addMutation({
        propertyId: convexPropertyId,
        itemName,
        addedBy: userId,
      });
      toast.success(t.groceries.itemAdded);
    } catch {
      // Restore the input so the user doesn't retype it
      setText(itemName);
      toast.error(t.groceries.errorAdding);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (id: string, checked: boolean | null) => {
    try {
      await toggleMutation({
        id: id as Id<"groceryItems">,
        checked: !checked,
        completedBy: userId,
      });
    } catch {
      toast.error(t.groceries.errorToggling);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await removeMutation({ id: id as Id<"groceryItems"> });
      toast.success(t.groceries.itemDeleted);
    } catch {
      toast.error(t.groceries.errorDeleting);
    }
  };

  const clearChecked = async () => {
    setClearDialogOpen(false);
    try {
      await clearCheckedMutation({ propertyId: convexPropertyId });
      toast.success(t.groceries.itemsCleared);
    } catch {
      toast.error(t.groceries.errorClearing);
    }
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.groceries.justNow;
    if (diffMins < 60) return `${diffMins}${t.groceries.minutesAgo}`;
    if (diffHours < 24) return `${diffHours}${t.groceries.hoursAgo}`;
    if (diffDays < 7) return `${diffDays}${t.groceries.daysAgo}`;
    return date.toLocaleDateString(language === "ja" ? "ja-JP" : "en-US");
  };

  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);
  const uncheckedCount = uncheckedItems.length;
  const checkedCount = checkedItems.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            {t.groceries.title}
            {uncheckedCount > 0 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {uncheckedCount}
              </span>
            )}
          </span>
          {checkedCount > 0 && (
            <AlertDialog
              open={clearDialogOpen}
              onOpenChange={setClearDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  {t.groceries.clearDone}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t.groceries.confirmClearTitle}
                  </AlertDialogTitle>
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
          <Button
            type="submit"
            disabled={!text.trim() || loading}
            aria-label={t.common.add}
          >
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

          {uncheckedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 py-2 px-3 rounded-lg border bg-card"
            >
              <Checkbox
                checked={false}
                onCheckedChange={() => toggleItem(item.id, item.checked)}
                className="h-5 w-5 mt-0.5"
                aria-label={item.item_name}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm break-words">
                  {item.item_name}
                  {item.quantity && (
                    <span className="text-muted-foreground ml-1">
                      ({item.quantity})
                    </span>
                  )}
                </span>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.adder?.display_name && (
                    <span>{item.adder.display_name} · </span>
                  )}
                  {formatRelativeTime(item.created_at)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => deleteItem(item.id)}
                aria-label={`${t.a11y.deleteItem}: ${item.item_name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {checkedItems.length > 0 && uncheckedItems.length > 0 && (
            <div className="border-t my-3" />
          )}

          {checkedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 py-2 px-3 rounded-lg border bg-card opacity-60"
            >
              <Checkbox
                checked={true}
                onCheckedChange={() => toggleItem(item.id, item.checked)}
                className="h-5 w-5 mt-0.5"
                aria-label={item.item_name}
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm line-through text-muted-foreground break-words">
                  {item.item_name}
                  {item.quantity && (
                    <span className="ml-1">({item.quantity})</span>
                  )}
                </span>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.completer?.display_name && (
                    <span>
                      {t.groceries.completedBy} {item.completer.display_name} ·{" "}
                    </span>
                  )}
                  {formatRelativeTime(item.completed_at)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => deleteItem(item.id)}
                aria-label={`${t.a11y.deleteItem}: ${item.item_name}`}
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
