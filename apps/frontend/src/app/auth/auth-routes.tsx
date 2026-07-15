import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth-context";

function SessionLoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f5f6f2] px-6">
      <div className="text-center">
        <img src="/dino-logo.svg" alt="DINO" className="mx-auto w-28" />
        <div className="mx-auto mt-6 h-1.5 w-28 overflow-hidden rounded-full bg-[#dce5de]">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
        </div>
        <p className="mt-4 text-sm font-semibold text-muted-foreground">Sprawdzam sesję…</p>
      </div>
    </div>
  );
}

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <SessionLoadingScreen />;
  if (status === "anonymous") {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}

export function AnonymousOnly() {
  const { status } = useAuth();

  if (status === "loading") return <SessionLoadingScreen />;
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <Outlet />;
}
