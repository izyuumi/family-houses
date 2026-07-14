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
import { StickyNote, Plus, Trash2, Loader2, Pencil, X, Check } from "lucide-react";

interface PropertyNote {
  id: string;
  property_id: string;
  content: string;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  creator?: { display_name: string | null } | null;
}

interface PropertyNotesProps {
  propertyId: string;
  initialNotes?: PropertyNote[];
  userId?: string;
}

export function PropertyNotes({ propertyId, initialNotes, userId }: PropertyNotesProps) {
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");
  const [editContent, setEditContent] = useState("");

  const convexPropertyId = propertyId as Id<"properties">;
  const liveNotes = useQuery(api.propertyNotes.listByProperty, { propertyId: convexPropertyId });
  const addMutation = useMutation(api.propertyNotes.add);
  const updateMutation = useMutation(api.propertyNotes.update);
  const removeMutation = useMutation(api.propertyNotes.remove);

  const notes: PropertyNote[] = liveNotes
    ? liveNotes.map((note) => ({
        id: note._id,
        property_id: note.propertyId,
        content: note.content,
        created_by: note.createdBy ?? null,
        created_at: note._creationTime ? new Date(note._creationTime).toISOString() : null,
        updated_at: null,
        creator: note.creator ? { display_name: note.creator.displayName ?? null } : null,
      }))
    : (initialNotes ?? []);

  const addNote = async () => {
    const content = newContent.trim();
    if (!content) return;

    setLoading(true);

    try {
      await addMutation({
        propertyId: convexPropertyId,
        content,
        createdBy: userId,
      });
      toast.success(t.propertyNotes.noteAdded);
      setNewContent("");
      setIsAdding(false);
    } catch {
      toast.error(t.propertyNotes.errorAdding);
    }

    setLoading(false);
  };

  const updateNote = async (id: string) => {
    const content = editContent.trim();
    if (!content) return;

    setLoading(true);

    try {
      await updateMutation({
        id: id as Id<"propertyNotes">,
        content,
      });
      toast.success(t.propertyNotes.noteUpdated);
      setEditingId(null);
      setEditContent("");
    } catch {
      toast.error(t.propertyNotes.errorUpdating);
    }

    setLoading(false);
  };

  const deleteNote = async (id: string) => {
    try {
      await removeMutation({ id: id as Id<"propertyNotes"> });
      toast.success(t.propertyNotes.noteDeleted);
    } catch {
      toast.error(t.propertyNotes.errorDeleting);
    }
  };

  const startEdit = (note: PropertyNote) => {
    setEditContent(note.content);
    setEditingId(note.id);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString(
      language === "ja" ? "ja-JP" : "en-US"
    );
  };

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="flex items-center justify-between text-[15px]">
          <span className="flex items-center gap-2">
            <StickyNote className="h-[17px] w-[17px] text-primary" />
            {t.propertyNotes.title}
            {notes.length > 0 && (
              <span className="rounded-full bg-secondary px-[9px] py-0.5 text-xs font-semibold text-secondary-foreground">
                {notes.length}
              </span>
            )}
          </span>
          {!isAdding && !editingId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(true);
                setNewContent("");
              }}
              aria-label={t.common.add}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {isAdding && (
          <div className="flex gap-2">
            <Input
              placeholder={t.propertyNotes.addNotePlaceholder}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="flex-1 bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addNote();
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsAdding(false);
                setNewContent("");
              }}
              aria-label={t.common.cancel}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              disabled={!newContent.trim() || loading}
              onClick={addNote}
              aria-label={t.common.add}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        <div className="flex flex-col">
          {notes.length === 0 && !isAdding && (
            <p className="text-center text-muted-foreground text-sm py-4">
              {t.propertyNotes.noNotes}
            </p>
          )}

          {notes.map((note) => (
            <div
              key={note.id}
              className="border-b border-hairline px-0.5 py-3 last:border-b-0"
            >
              {editingId === note.id ? (
                <div className="flex gap-2">
                  <Input
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        updateNote(note.id);
                      }
                      if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={cancelEdit}
                    aria-label={t.common.cancel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    disabled={!editContent.trim() || loading}
                    onClick={() => updateNote(note.id)}
                    aria-label={t.common.save}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm break-words">{note.content}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      {note.creator?.display_name && (
                        <span>{note.creator.display_name} · </span>
                      )}
                      {formatDate(note.created_at)}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => startEdit(note)}
                        aria-label={t.common.edit}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            aria-label={t.propertyNotes.delete}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.propertyNotes.confirmDeleteTitle}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.propertyNotes.confirmDeleteDescription}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteNote(note.id)}>
                              {t.propertyNotes.delete}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
