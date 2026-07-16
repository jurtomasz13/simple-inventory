import { cn } from "@/utils/cn";
import { LoaderCircle } from "lucide-react";

type LoadingStateProps = {
  title?: string;
  description?: string;
  variant?: "page" | "cards" | "list" | "workspace";
  count?: number;
  className?: string;
};

export function LoadingState({
  title = "Wczytywanie danych",
  description = "To może potrwać krótką chwilę.",
  variant = "page",
  count = 3,
  className,
}: LoadingStateProps) {
  const skeletons = Array.from({ length: count }, (_, index) => index);

  return (
    <section
      className={cn("app-loading-state app-panel overflow-hidden rounded-xl border bg-white p-5 shadow-sm", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f3ed] text-primary">
          <LoaderCircle className="size-5 animate-spin" />
        </span>
        <div>
          <p className="font-bold">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {variant === "workspace" ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(260px,0.42fr)_minmax(0,1fr)]" aria-hidden="true">
          <SkeletonCard lines={4} />
          <div className="space-y-3">
            {skeletons.map((item) => <SkeletonRow key={item} />)}
          </div>
        </div>
      ) : variant === "cards" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {skeletons.map((item) => <SkeletonCard key={item} />)}
        </div>
      ) : (
        <div className={cn("mt-4 space-y-3", variant === "page" && "min-h-36")} aria-hidden="true">
          {skeletons.map((item) => <SkeletonRow key={item} />)}
        </div>
      )}
    </section>
  );
}

function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="animate-pulse rounded-2xl border bg-[#f7f8f5] p-4">
      <div className="size-9 rounded-xl bg-[#dfe7e1]" />
      <div className="mt-4 h-3 w-2/3 rounded-full bg-[#dfe7e1]" />
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className={cn("mt-2 h-2.5 rounded-full bg-[#e7ece8]", index % 2 === 0 ? "w-full" : "w-3/4")} />
      ))}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-2xl border bg-[#f7f8f5] p-3">
      <div className="size-9 shrink-0 rounded-xl bg-[#dfe7e1]" />
      <div className="min-w-0 flex-1">
        <div className="h-3 w-2/3 rounded-full bg-[#dfe7e1]" />
        <div className="mt-2 h-2.5 w-1/2 rounded-full bg-[#e7ece8]" />
      </div>
      <div className="h-8 w-16 rounded-lg bg-[#e2e8e3]" />
    </div>
  );
}
