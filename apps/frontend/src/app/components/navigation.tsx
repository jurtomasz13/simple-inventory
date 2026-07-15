import { useAuth } from "@/app/auth/auth-context";
import { Button } from "@/app/components/ui/button";
import { ClipboardList, Home, LogOut, MapPin, ReceiptText, ScanBarcode, Tag } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const navigationItems = [
  { to: "/", label: "Start", icon: Home, end: true },
  { to: "/inventory", label: "Inwentaryzacje", icon: ClipboardList },
  { to: "/orders", label: "Sprzedaż", icon: ReceiptText },
  { to: "/products", label: "Produkty", icon: ScanBarcode },
  { to: "/rooms", label: "Strefy", icon: MapPin },
  { to: "/categories", label: "Kategorie", icon: Tag },
];

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pl"))
    .join("") || "U";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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

        <div className="flex shrink-0 items-center gap-2 border-l pl-3 lg:gap-3 lg:pl-5">
          <div className="grid size-10 place-items-center rounded-full bg-slate-900 text-sm font-bold text-white">{initials}</div>
          <div className="hidden max-w-40 leading-tight xl:block">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={handleLogout} aria-label="Wyloguj się" title="Wyloguj się"><LogOut /></Button>
        </div>
      </div>
    </header>
  );
}
