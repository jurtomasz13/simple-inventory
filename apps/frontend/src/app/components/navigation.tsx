import { ClipboardList, Home, MapPin, ReceiptText, ScanBarcode, Tag } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const navigationItems = [
  { to: "/", label: "Start", icon: Home, end: true },
  { to: "/inventory", label: "Inwentaryzacje", icon: ClipboardList },
  { to: "/orders", label: "Sprzedaż", icon: ReceiptText },
  { to: "/products", label: "Produkty", icon: ScanBarcode },
  { to: "/rooms", label: "Strefy", icon: MapPin },
  { to: "/categories", label: "Kategorie", icon: Tag },
];

export default function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="DINO Inwentaryzacja — start">
          <div><img src="/dino-logo.svg" alt="logo" className="w-20"></img></div>
          <div className="hidden xl:block">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Panel sklepu</p>
            <p className="text-sm font-bold leading-tight text-foreground">Inwentaryzacja</p>
          </div>
        </Link>

        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Główna nawigacja">
          {navigationItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-[#e8f3ed] text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`
              }
            >
              <Icon className="size-[18px]" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 border-l pl-5 lg:flex">
          <div className="grid size-10 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">PS</div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Pracownik sklepu</p>
            <p className="text-xs text-muted-foreground">Stanowisko 01</p>
          </div>
        </div>
      </div>
    </header>
  );
}
