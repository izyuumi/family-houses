"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Car,
  Check,
  ChevronLeft,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CarRow = {
  _id: Id<"cars">;
  name: string;
  model?: string;
  plate?: string;
  propertyId?: Id<"properties">;
  propertyName: string | null;
  upcoming: Array<{
    _id: string;
    startTime: number;
    endTime: number;
    requesterName: string | null;
    isCurrent: boolean;
  }>;
};

function toLocalInputValue(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultRequestWindow() {
  const start = Date.now() + 2 * 60 * 60 * 1000;
  return { start, end: start + 2 * 60 * 60 * 1000 };
}

function isCancellable(reservation: { status: string; endTime: number }) {
  return (
    reservation.status === "pending" ||
    (reservation.status === "approved" && reservation.endTime > Date.now())
  );
}

export function CarsClient() {
  const { t, language } = useI18n();
  const data = useQuery(api.cars.carsWithSchedule);
  const mine = useQuery(api.cars.myReservations);
  const pending = useQuery(
    api.cars.pendingRequests,
    data?.isAdmin ? {} : "skip"
  );
  const requestReservation = useMutation(api.cars.requestReservation);
  const cancelReservation = useMutation(api.cars.cancelReservation);
  const approveReservation = useMutation(api.cars.approveReservation);
  const denyReservation = useMutation(api.cars.denyReservation);
  const createCar = useMutation(api.cars.createCar);
  const updateCar = useMutation(api.cars.updateCar);
  const deleteCar = useMutation(api.cars.deleteCar);
  const properties = useQuery(api.properties.list, data?.isAdmin ? {} : "skip");

  const [requestCar, setRequestCar] = useState<CarRow | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [denyId, setDenyId] = useState<Id<"carReservations"> | null>(null);
  const [denyNote, setDenyNote] = useState("");
  const [editorCar, setEditorCar] = useState<Partial<CarRow> | null>(null);
  const [deleteCarId, setDeleteCarId] = useState<Id<"cars"> | null>(null);
  const [savingCar, setSavingCar] = useState(false);

  const fmt = new Intl.DateTimeFormat(language === "ja" ? "ja-JP" : "en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const fmtRange = (startTime: number, endTime: number) =>
    `${fmt.format(startTime)} – ${fmt.format(endTime)}`;

  const errorToast = (error: unknown) =>
    toast.error(
      error instanceof Error && error.message ? error.message : t.common.errorGeneric
    );

  const openRequest = (car: CarRow) => {
    const window = defaultRequestWindow();
    setRequestCar(car);
    setStart(toLocalInputValue(window.start));
    setEnd(toLocalInputValue(window.end));
    setNote("");
  };

  const submitRequest = async () => {
    if (!requestCar || !start || !end) return;
    setSubmitting(true);
    try {
      await requestReservation({
        carId: requestCar._id,
        startTime: new Date(start).getTime(),
        endTime: new Date(end).getTime(),
        note: note.trim() || undefined,
      });
      toast.success(data?.isAdmin ? t.cars.booked : t.cars.requested);
      setRequestCar(null);
    } catch (error) {
      errorToast(error);
    } finally {
      setSubmitting(false);
    }
  };

  const saveCar = async () => {
    if (!editorCar?.name?.trim()) return;
    setSavingCar(true);
    try {
      const fields = {
        name: editorCar.name.trim(),
        model: editorCar.model?.trim() || undefined,
        plate: editorCar.plate?.trim() || undefined,
        propertyId: editorCar.propertyId || undefined,
      };
      if (editorCar._id) {
        await updateCar({ carId: editorCar._id, ...fields });
      } else {
        await createCar(fields);
      }
      toast.success(t.cars.carSaved);
      setEditorCar(null);
    } catch (error) {
      errorToast(error);
    } finally {
      setSavingCar(false);
    }
  };

  const statusChip = (status: string) => (
    <span
      className={cn(
        "shrink-0 rounded-full px-[9px] py-0.5 text-[11px] font-medium",
        status === "pending" && "bg-secondary text-secondary-foreground",
        status === "approved" && "bg-primary/15 text-primary",
        status === "denied" && "bg-destructive/10 text-destructive",
        status === "cancelled" && "bg-muted text-muted-foreground"
      )}
    >
      {status === "pending"
        ? t.cars.statusPending
        : status === "approved"
          ? t.cars.statusApproved
          : status === "denied"
            ? t.cars.statusDenied
            : t.cars.statusCancelled}
    </span>
  );

  return (
    <main className="h-dvh flex flex-col">
      <div className="mx-auto flex w-full max-w-2xl shrink-0 items-center gap-3 px-4 pb-1 pt-[calc(0.5rem+env(safe-area-inset-top))]">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="rounded-xl shadow-none"
          aria-label={t.common.back}
        >
          <Link href="/profile">
            <ChevronLeft className="h-[18px] w-[18px]" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold tracking-[-0.01em]">{t.cars.title}</h1>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {data?.isAdmin && pending && pending.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
              <div className="flex items-center gap-2 text-[15px] font-bold">
                {t.cars.pendingRequests}
                <span className="rounded-full bg-destructive/10 px-[9px] py-0.5 text-xs font-semibold text-destructive">
                  {pending.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {pending.map((request) => (
                  <div
                    key={request._id}
                    className="rounded-xl bg-background p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {request.requesterName} · {request.carName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {fmtRange(request.startTime, request.endTime)}
                        </p>
                        {request.note && (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            “{request.note}”
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        className="rounded-xl"
                        onClick={() =>
                          approveReservation({ reservationId: request._id })
                            .then(() => toast.success(t.cars.approvedToast))
                            .catch(errorToast)
                        }
                        aria-label={t.cars.approve}
                      >
                        <Check className="h-[17px] w-[17px]" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-xl text-destructive"
                        onClick={() => {
                          setDenyId(request._id);
                          setDenyNote("");
                        }}
                        aria-label={t.cars.deny}
                      >
                        <X className="h-[17px] w-[17px]" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[15px] font-bold">
                <Car className="h-[17px] w-[17px] text-primary" />
                {t.cars.title}
              </div>
              {data?.isAdmin && (
                <Button
                  size="sm"
                  className="h-[38px] rounded-full px-3.5 text-xs"
                  onClick={() => setEditorCar({})}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t.common.add}
                </Button>
              )}
            </div>
            {!data ? (
              <div className="animate-pulse text-sm text-muted-foreground">
                {t.common.loading}
              </div>
            ) : data.cars.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.cars.noCars}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.cars.map((car) => (
                  <div key={car._id} className="rounded-xl border border-hairline p-3.5">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{car.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[car.model, car.plate, car.propertyName]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </div>
                      {data.isAdmin && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-muted-foreground"
                            onClick={() => setEditorCar(car)}
                            aria-label={`${t.common.edit}: ${car.name}`}
                          >
                            <Pencil className="h-[14px] w-[14px]" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteCarId(car._id)}
                            aria-label={`${t.cars.deleteCar}: ${car.name}`}
                          >
                            <Trash2 className="h-[14px] w-[14px]" />
                          </Button>
                        </>
                      )}
                    </div>
                    {car.upcoming.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1 border-t border-hairline pt-2">
                        {car.upcoming.map((booking) => (
                          <p key={booking._id} className="text-xs text-muted-foreground">
                            <span
                              className={cn(
                                "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                                booking.isCurrent
                                  ? "bg-[hsl(var(--dial-left))]"
                                  : "bg-primary"
                              )}
                            />
                            {fmtRange(booking.startTime, booking.endTime)}
                            {booking.requesterName ? ` · ${booking.requesterName}` : ""}
                          </p>
                        ))}
                      </div>
                    )}
                    <Button
                      className="mt-3 h-10 w-full rounded-xl"
                      onClick={() => openRequest(car)}
                    >
                      {t.cars.requestCar}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card dark:shadow-none">
            <div className="text-[15px] font-bold">{t.cars.myRequests}</div>
            {!mine ? (
              <div className="animate-pulse text-sm text-muted-foreground">
                {t.common.loading}
              </div>
            ) : mine.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.cars.noRequests}</p>
            ) : (
              <div className="flex flex-col">
                {mine.map((reservation) => (
                  <div
                    key={reservation._id}
                    className="flex items-center gap-2.5 border-b border-hairline py-2.5 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{reservation.carName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {fmtRange(reservation.startTime, reservation.endTime)}
                      </p>
                      {reservation.status === "denied" && reservation.decisionNote && (
                        <p className="mt-0.5 text-xs text-destructive">
                          {reservation.decisionNote}
                        </p>
                      )}
                    </div>
                    {statusChip(reservation.status)}
                    {isCancellable(reservation) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          cancelReservation({ reservationId: reservation._id })
                            .then(() => toast.success(t.cars.cancelled))
                            .catch(errorToast)
                        }
                        aria-label={t.common.cancel}
                      >
                        <X className="h-[15px] w-[15px]" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={Boolean(requestCar)} onOpenChange={(open) => !open && setRequestCar(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t.cars.requestCar} · {requestCar?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="car-start">{t.cars.from}</Label>
                <Input
                  id="car-start"
                  type="datetime-local"
                  className="mt-1"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="car-end">{t.cars.until}</Label>
                <Input
                  id="car-end"
                  type="datetime-local"
                  className="mt-1"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="car-note">{t.cars.noteOptional}</Label>
              <Input
                id="car-note"
                className="mt-1"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.cars.notePlaceholder}
              />
            </div>
            {!data?.isAdmin && (
              <p className="text-[11px] text-muted-foreground">{t.cars.approvalHint}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="rounded-xl"
              disabled={!start || !end || submitting}
              onClick={() => void submitRequest()}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : data?.isAdmin ? (
                t.cars.book
              ) : (
                t.cars.sendRequest
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editorCar)} onOpenChange={(open) => !open && setEditorCar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editorCar?._id ? t.cars.editCar : t.cars.addCar}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="car-name">{t.cars.carName}</Label>
              <Input
                id="car-name"
                className="mt-1"
                value={editorCar?.name ?? ""}
                onChange={(e) => setEditorCar({ ...editorCar, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="car-model">{t.cars.carModel}</Label>
                <Input
                  id="car-model"
                  className="mt-1"
                  value={editorCar?.model ?? ""}
                  onChange={(e) => setEditorCar({ ...editorCar, model: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="car-plate">{t.cars.carPlate}</Label>
                <Input
                  id="car-plate"
                  className="mt-1"
                  value={editorCar?.plate ?? ""}
                  onChange={(e) => setEditorCar({ ...editorCar, plate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="car-property">{t.cars.homeBase}</Label>
              <select
                id="car-property"
                className="mt-1 h-11 w-full rounded-lg border bg-card px-3 text-sm"
                value={editorCar?.propertyId ?? ""}
                onChange={(e) =>
                  setEditorCar({
                    ...editorCar,
                    propertyId: e.target.value
                      ? (e.target.value as Id<"properties">)
                      : undefined,
                  })
                }
              >
                <option value="">—</option>
                {properties?.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              className="rounded-xl"
              disabled={!editorCar?.name?.trim() || savingCar}
              onClick={() => void saveCar()}
            >
              {savingCar ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(denyId)} onOpenChange={(open) => !open && setDenyId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.cars.denyTitle}</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="deny-note">{t.cars.denyReason}</Label>
            <Input
              id="deny-note"
              className="mt-1"
              value={denyNote}
              onChange={(e) => setDenyNote(e.target.value)}
              placeholder={t.cars.denyReasonPlaceholder}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={() => {
                if (!denyId) return;
                denyReservation({
                  reservationId: denyId,
                  decisionNote: denyNote.trim() || undefined,
                })
                  .then(() => toast.success(t.cars.deniedToast))
                  .catch(errorToast)
                  .finally(() => setDenyId(null));
              }}
            >
              {t.cars.deny}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteCarId)}
        onOpenChange={(open) => !open && setDeleteCarId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.cars.deleteCarTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.cars.deleteCarDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteCarId) return;
                deleteCar({ carId: deleteCarId })
                  .then(() => toast.success(t.cars.carDeleted))
                  .catch(errorToast)
                  .finally(() => setDeleteCarId(null));
              }}
            >
              {t.cars.deleteCar}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
