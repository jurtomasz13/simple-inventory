import { useAuth } from "@/app/auth/auth-context";
import { Button } from "@/app/components/ui/button";
import {
  ClipboardList,
  Home,
  LogOut,
  MapPin,
  Maximize2,
  Menu,
  Minimize2,
  ReceiptText,
  ScanBarcode,
  Tag,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

export type AppLayout = "desktop" | "tablet" | "mobile";
export type WideLayout = Exclude<AppLayout, "mobile">;

type NavigationProps = {
  layout: AppLayout;
  onLayoutChange: (layout: WideLayout) => void;
};

const navigationItems = [
  { to: "/", label: "Start", shortLabel: "Start", icon: Home, end: true },
  { to: "/inventory", label: "Inwentaryzacje", shortLabel: "Inwentaryzacja", icon: ClipboardList },
  { to: "/orders", label: "Sprzedaż", shortLabel: "Sprzedaż", icon: ReceiptText },
  { to: "/products", label: "Produkty", shortLabel: "Produkty", icon: ScanBarcode },
  { to: "/rooms", label: "Strefy", shortLabel: "Strefy", icon: MapPin },
  { to: "/categories", label: "Kategorie", shortLabel: "Kategorie", icon: Tag },
];

const mobilePrimaryItems = navigationItems.slice(0, 2);
const mobileMoreItems = navigationItems.slice(2);

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/inventory/")) {
    return pathname.endsWith("/summary") ? "Podsumowanie" : "Pozycje";
  }

  return navigationItems.find(({ to, end }) => end ? pathname === to : pathname.startsWith(to))?.label ?? "Panel sklepu";
}

export default function Navigation({ layout, onLayoutChange }: NavigationProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const initials = user?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pl"))
    .join("") || "U";

  useEffect(() => setIsMobileMenuOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (layout === "desktop") {
    return (
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col overflow-y-auto border-r border-white/10 bg-[#153a2c] text-white shadow-[12px_0_40px_rgba(18,45,35,0.08)]">
        <div className="px-5 pb-4 pt-5">
          <Link to="/" className="flex items-center gap-3" aria-label="DINO Inwentaryzacja — start">
            <span className="grid h-12 w-[78px] place-items-center rounded-xl bg-white px-2 shadow-sm">
              <img src="/dino-logo.svg" alt="DINO" className="w-full" />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-[#f7df55]">Panel sklepu</span>
              <span className="mt-0.5 block text-sm font-bold text-white">Inwentaryzacja</span>
            </span>
          </Link>
        </div>

        <div className="mx-4 rounded-xl bg-black/10 p-1">
          <LayoutSwitcher value="desktop" onChange={onLayoutChange} inverse />
        </div>

        <nav className="mt-5 flex-1 space-y-1 px-3" aria-label="Główna nawigacja">
          <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Nawigacja</p>
          {navigationItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-[13px] font-semibold transition-all ${
                  isActive
                    ? "bg-white text-[#153a2c] shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid size-7 place-items-center rounded-lg transition-colors ${isActive ? "bg-[#e8f3ed] text-primary" : "bg-white/5 text-white/70 group-hover:bg-white/10"}`}>
                    <Icon className="size-4" />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 rounded-2xl border border-white/10 bg-white/[0.07] p-2.5">
          <div className="flex items-center gap-3">
            <Avatar initials={initials} inverse />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-bold">{user?.name}</p>
              <p className="mt-1 truncate text-xs text-white/45">{user?.email}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={handleLogout} className="text-white/60 hover:bg-white/10 hover:text-white" aria-label="Wyloguj się" title="Wyloguj się">
              <LogOut />
            </Button>
          </div>
        </div>
      </aside>
    );
  }

  if (layout === "tablet") {
    return (
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="DINO Inwentaryzacja — start">
            <img src="/dino-logo.svg" alt="DINO" className="w-20" />
            <span className="hidden min-[720px]:block">
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Panel sklepu</span>
              <span className="block text-sm font-bold leading-tight text-foreground">Inwentaryzacja</span>
            </span>
          </Link>

          <div className="ml-auto w-[220px]">
            <LayoutSwitcher value="tablet" onChange={onLayoutChange} />
          </div>

          <div className="flex shrink-0 items-center gap-2 border-l pl-4">
            <Avatar initials={initials} />
            <div className="hidden max-w-36 leading-tight lg:block">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={handleLogout} aria-label="Wyloguj się" title="Wyloguj się"><LogOut /></Button>
          </div>
        </div>

        <nav className="mx-auto grid max-w-[1180px] grid-cols-6 gap-1 border-t border-black/[0.04] px-5 py-2" aria-label="Główna nawigacja">
          {navigationItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold transition-colors lg:text-sm ${
                  isActive
                    ? "bg-[#e8f3ed] text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`
              }
            >
              <Icon className="size-[18px] shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
    );
  }

  const isMoreRouteActive = mobileMoreItems.some(({ to }) => location.pathname.startsWith(to));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2.5 px-3">
          <Link to="/" className="grid h-9 w-16 shrink-0 place-items-center rounded-lg bg-white" aria-label="DINO — start">
            <img src="/dino-logo.svg" alt="DINO" className="w-full" />
          </Link>
          <div className="min-w-0 flex-1 border-l pl-3">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">Inwentaryzacja</p>
            <p className="truncate text-sm font-bold">{getPageTitle(location.pathname)}</p>
          </div>
          <Avatar initials={initials} compact />
        </div>
      </header>

      {isMobileMenuOpen && (
        <>
          <button type="button" className="fixed inset-0 z-40 bg-[#10271e]/35 backdrop-blur-[2px]" onClick={() => setIsMobileMenuOpen(false)} aria-label="Zamknij menu" />
          <section className="fixed inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 overflow-hidden rounded-xl border bg-white shadow-[0_24px_80px_rgba(17,46,35,0.28)]" aria-label="Więcej opcji">
            <div className="flex items-center gap-3 border-b bg-[#f7f8f5] p-3">
              <Avatar initials={initials} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)} aria-label="Zamknij menu"><X /></Button>
            </div>
            <nav className="grid grid-cols-2 gap-2 p-3" aria-label="Pozostała nawigacja">
              {mobileMoreItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl text-xs font-bold ${isActive ? "bg-[#e8f3ed] text-primary" : "bg-[#f5f6f2] text-slate-700"}`}>
                  <Icon className="size-5" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t p-3">
              <Button type="button" variant="ghost" className="w-full justify-start text-muted-foreground hover:bg-red-50 hover:text-destructive" onClick={handleLogout}>
                <LogOut /> Wyloguj się
              </Button>
            </div>
          </section>
        </>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-black/5 bg-white/95 px-1 pb-[max(0.2rem,env(safe-area-inset-bottom))] pt-1 shadow-[0_-8px_30px_rgba(29,54,44,0.08)] backdrop-blur-xl" aria-label="Mobilna nawigacja">
        <div className="grid grid-cols-3">
          {mobilePrimaryItems.map(({ to, shortLabel, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[9px] font-bold transition-colors ${isActive ? "bg-[#e8f3ed] text-primary" : "text-slate-500"}`}>
              <Icon className="size-[18px]" />
              <span className="w-full truncate text-center">{shortLabel}</span>
            </NavLink>
          ))}
          <button type="button" onClick={() => setIsMobileMenuOpen((open) => !open)} className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[9px] font-bold transition-colors ${isMobileMenuOpen || isMoreRouteActive ? "bg-[#e8f3ed] text-primary" : "text-slate-500"}`} aria-expanded={isMobileMenuOpen}>
            {isMobileMenuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
            <span>Więcej</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function LayoutSwitcher({ value, onChange, inverse = false }: { value: WideLayout; onChange: (layout: WideLayout) => void; inverse?: boolean }) {
  return (
    <div className={`grid grid-cols-2 gap-1 rounded-xl p-1 ${inverse ? "bg-black/10" : "border bg-[#f5f6f2]"}`} aria-label="Wybierz gęstość interfejsu">
      <button
        type="button"
        onClick={() => onChange("desktop")}
        className={`flex h-9 items-center justify-center gap-1 rounded-lg px-1.5 text-[11px] font-bold transition-all ${value === "desktop" ? inverse ? "bg-white text-[#153a2c] shadow-sm" : "bg-white text-primary shadow-sm" : inverse ? "text-white/55 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
        aria-pressed={value === "desktop"}
        aria-label="Tryb kompaktowy — więcej danych na ekranie"
        title="Więcej danych na ekranie"
      >
        <Minimize2 className="size-4" />
        <span>Kompaktowy</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("tablet")}
        className={`flex h-9 items-center justify-center gap-1 rounded-lg px-1.5 text-[11px] font-bold transition-all ${value === "tablet" ? inverse ? "bg-white text-[#153a2c] shadow-sm" : "bg-white text-primary shadow-sm" : inverse ? "text-white/55 hover:text-white" : "text-muted-foreground hover:text-foreground"}`}
        aria-pressed={value === "tablet"}
        aria-label="Tryb wygodny — większe elementy i odstępy"
        title="Większe elementy i odstępy"
      >
        <Maximize2 className="size-4" />
        <span>Wygodny</span>
      </button>
    </div>
  );
}

function Avatar({ initials, inverse = false, compact = false }: { initials: string; inverse?: boolean; compact?: boolean }) {
  return (
    <div className={`grid shrink-0 place-items-center rounded-full text-xs font-black ${compact ? "size-8" : "size-10"} ${inverse ? "bg-[#ffdc24] text-[#263126]" : "bg-[#173b2d] text-white"}`} aria-hidden="true">
      {initials}
    </div>
  );
}
