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
import { Label } from "@/components/ui/label";
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
import {
  Package,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PropertyItem {
  id: string;
  property_id: string;
  title: string;
  bought_date: string | null;
  note: string | null;
  category: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  creator?: { display_name: string | null } | null;
}

interface PropertyItemsProps {
  propertyId: string;
  initialItems?: PropertyItem[];
  userId?: string;
}

export function PropertyItems({
  propertyId,
  initialItems,
  userId,
}: PropertyItemsProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    bought_date: "",
    category: "",
    note: "",
  });

  const convexPropertyId = propertyId as Id<"properties">;
  const liveItems = useQuery(api.propertyItems.listByProperty, {
    propertyId: convexPropertyId,
  });
  const addMutation = useMutation(api.propertyItems.add);
  const updateMutation = useMutation(api.propertyItems.update);
  const removeMutation = useMutation(api.propertyItems.remove);

  const items: PropertyItem[] = liveItems
    ? liveItems.map((item) => ({
        id: item._id,
        property_id: item.propertyId,
        title: item.title,
        bought_date: item.boughtDate ?? null,
        note: item.note ?? null,
        category: item.category ?? null,
        created_by: item.createdBy ?? null,
        created_at: item._creationTime
          ? new Date(item._creationTime).toISOString()
          : null,
        updated_at: null,
        creator: item.creator
          ? { display_name: item.creator.displayName ?? null }
          : null,
      }))
    : (initialItems ?? []);

  const resetForm = () => {
    setFormData({ title: "", bought_date: "", category: "", note: "" });
  };

  const addItem = async () => {
    if (!formData.title.trim()) return;

    setLoading(true);

    try {
      await addMutation({
        propertyId: convexPropertyId,
        title: formData.title.trim(),
        boughtDate: formData.bought_date || undefined,
        category: formData.category.trim() || undefined,
        note: formData.note.trim() || undefined,
        createdBy: userId,
      });
      toast.success(t.propertyItems.itemAdded);
      resetForm();
      setIsAdding(false);
    } catch {
      toast.error(t.propertyItems.errorAdding);
    }

    setLoading(false);
  };

  const updateItem = async (id: string) => {
    if (!formData.title.trim()) return;

    setLoading(true);

    try {
      await updateMutation({
        id: id as Id<"propertyItems">,
        title: formData.title.trim(),
        boughtDate: formData.bought_date || undefined,
        category: formData.category.trim() || undefined,
        note: formData.note.trim() || undefined,
      });
      toast.success(t.propertyItems.itemUpdated);
      resetForm();
      setEditingId(null);
    } catch {
      toast.error(t.propertyItems.errorUpdating);
    }

    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    try {
      await removeMutation({ id: id as Id<"propertyItems"> });
      toast.success(t.propertyItems.itemDeleted);
    } catch {
      toast.error(t.propertyItems.errorDeleting);
    }
  };

  const startEdit = (item: PropertyItem) => {
    setFormData({
      title: item.title,
      bought_date: item.bought_date || "",
      category: item.category || "",
      note: item.note || "",
    });
    setEditingId(item.id);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t.propertyItems.title}
            {items.length > 0 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {items.length}
              </span>
            )}
          </span>
          {!isAdding && !editingId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(true);
                resetForm();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(isAdding || editingId) && (
          <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="item-title">{t.propertyItems.itemTitle}</Label>
              <Input
                id="item-title"
                placeholder={t.propertyItems.itemTitlePlaceholder}
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="bought-date">
                  {t.propertyItems.boughtDate}
                </Label>
                <Input
                  id="bought-date"
                  type="date"
                  value={formData.bought_date}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bought_date: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t.propertyItems.category}</Label>
                <Input
                  id="category"
                  placeholder={t.propertyItems.categoryPlaceholder}
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">{t.propertyItems.note}</Label>
              <Input
                id="note"
                placeholder={t.propertyItems.notePlaceholder}
                value={formData.note}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, note: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (editingId) cancelEdit();
                  else setIsAdding(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4 mr-1" />
                {t.common.cancel}
              </Button>
              <Button
                size="sm"
                disabled={!formData.title.trim() || loading}
                onClick={() => (editingId ? updateItem(editingId) : addItem())}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                {editingId ? t.common.save : t.common.add}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {items.length === 0 && !isAdding && (
            <p className="text-center text-muted-foreground text-sm py-4">
              {t.propertyItems.noItems}
            </p>
          )}

          {items.map((item) => (
            <div key={item.id} className="py-2 px-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <button
                  className="flex-1 text-left"
                  onClick={() =>
                    setExpandedId(expandedId === item.id ? null : item.id)
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    {item.category && (
                      <span className="text-xs bg-secondary text-secondary-foreground rounded px-1.5 py-0.5">
                        {item.category}
                      </span>
                    )}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() =>
                    setExpandedId(expandedId === item.id ? null : item.id)
                  }
                >
                  {expandedId === item.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedId === item.id && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {item.bought_date && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">
                        {t.propertyItems.boughtDate}:
                      </span>{" "}
                      {formatDate(item.bought_date)}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">
                        {t.propertyItems.note}:
                      </span>{" "}
                      {item.note}
                    </p>
                  )}
                  {item.creator?.display_name && (
                    <p className="text-xs text-muted-foreground">
                      {t.propertyItems.addedBy} {item.creator.display_name}
                    </p>
                  )}
                  {item.created_at && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(item)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      {t.common.edit}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {t.propertyItems.delete}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t.propertyItems.confirmDeleteTitle}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t.propertyItems.confirmDeleteDescription}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t.common.cancel}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteItem(item.id)}
                          >
                            {t.propertyItems.delete}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
