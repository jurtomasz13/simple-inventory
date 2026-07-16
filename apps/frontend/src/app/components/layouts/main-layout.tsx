import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navigation, { type AppLayout, type WideLayout } from "../navigation";

const LAYOUT_STORAGE_KEY = "inventory:layout";
const PHONE_MEDIA_QUERY = "(max-width: 639px)";

function getInitialWideLayout(): WideLayout {
  const storedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (storedLayout === "desktop" || storedLayout === "tablet") return storedLayout;
  return window.innerWidth >= 1180 ? "desktop" : "tablet";
}

function useIsPhone() {
  const [isPhone, setIsPhone] = useState(() => window.matchMedia(PHONE_MEDIA_QUERY).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(PHONE_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setIsPhone(event.matches);
    setIsPhone(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isPhone;
}

export function MainLayout() {
  const [wideLayout, setWideLayout] = useState<WideLayout>(getInitialWideLayout);
  const isPhone = useIsPhone();
  const layout: AppLayout = isPhone ? "mobile" : wideLayout;

  useEffect(() => {
    document.documentElement.dataset.appLayout = layout;
    return () => { delete document.documentElement.dataset.appLayout; };
  }, [layout]);

  const handleLayoutChange = (nextLayout: WideLayout) => {
    setWideLayout(nextLayout);
    localStorage.setItem(LAYOUT_STORAGE_KEY, nextLayout);
  };

  return (
    <div className={`app-layout app-layout--${layout} min-h-screen bg-background`} data-app-layout={layout}>
      <Navigation layout={layout} onLayoutChange={handleLayoutChange} />
      <div className={layout === "desktop" ? "min-h-screen pl-[248px]" : "min-h-0"}>
        <main
          className={
            layout === "desktop"
              ? "mx-auto w-full max-w-[1760px] px-5 py-5 xl:px-6 xl:py-6"
              : layout === "tablet"
                ? "mx-auto w-full max-w-[1180px] px-5 py-7"
                : "mx-auto w-full px-3 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-3"
          }
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
