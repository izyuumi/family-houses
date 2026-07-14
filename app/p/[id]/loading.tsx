export default function Loading() {
  return (
    <main className="min-h-dvh flex flex-col">
      <div className="mx-auto w-full max-w-xl shrink-0">
        <div className="flex items-center justify-between px-4 pb-1 pt-[calc(0.5rem+env(safe-area-inset-top))]">
          <div className="h-11 w-11 bg-muted animate-pulse rounded-xl" />
          <div className="h-11 w-11 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="px-5 pb-4 pt-2 space-y-2">
          <div className="h-7 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-56 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex gap-2 px-5 pb-4">
          <div className="h-[38px] w-16 bg-muted animate-pulse rounded-full" />
          <div className="h-[38px] w-24 bg-muted animate-pulse rounded-full" />
          <div className="h-[38px] w-16 bg-muted animate-pulse rounded-full" />
          <div className="h-[38px] w-16 bg-muted animate-pulse rounded-full" />
        </div>
      </div>
      <div className="flex-1 px-4 pb-12">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
          <div className="h-56 bg-muted animate-pulse rounded-2xl" />
          <div className="h-40 bg-muted animate-pulse rounded-2xl" />
          <div className="h-32 bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
