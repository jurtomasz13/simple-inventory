import { lazy, Suspense } from "react";
import { Navigate, Route, Routes as RouterRoutes } from "react-router-dom";
import { AnonymousOnly, RequireAuth } from "./auth/auth-routes";
import { MainLayout } from "./components/layouts/main-layout";
import { LoadingState } from "./components/loading-state";

const AuthPage = lazy(() => import("./pages/auth-page"));
const HomePage = lazy(() => import("./pages/home-page"));
const InventoryPage = lazy(() => import("./pages/inventory/inventory-page"));
const ProductsPage = lazy(() => import("./pages/products-page"));
const CategoriesPage = lazy(() => import("./pages/categories-page"));
const RoomsPage = lazy(() => import("./pages/rooms-page"));
const OrdersPage = lazy(() => import("./pages/orders-page"));
const InventorySummaryPage = lazy(() => import("./pages/inventory/inventory-summary-page"));
const InventoryPositionsPage = lazy(() => import("./pages/inventory/inventory-positions-page"));

const page = (element: React.ReactNode) => (
  <Suspense fallback={<LoadingState title="Otwieranie widoku" description="Przygotowuję ekran i jego narzędzia…" />}>
    {element}
  </Suspense>
);

export function Routes() {
  return (
    <RouterRoutes>
      <Route element={<AnonymousOnly />}>
        <Route path="/login" element={page(<AuthPage />)} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={page(<HomePage />)} />
          <Route path="inventory" element={page(<InventoryPage />)} />
          <Route path="inventory/:id/summary" element={page(<InventorySummaryPage />)} />
          <Route path="inventory/:id/positions" element={page(<InventoryPositionsPage />)} />
          <Route path="products" element={page(<ProductsPage />)} />
          <Route path="categories" element={page(<CategoriesPage />)} />
          <Route path="rooms" element={page(<RoomsPage />)} />
          <Route path="orders" element={page(<OrdersPage />)} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </RouterRoutes>
  );
}

export default Routes;
