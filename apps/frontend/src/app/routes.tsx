import { lazy, Suspense } from "react";
import { Route, Routes as RouterRoutes } from "react-router-dom";
import { MainLayout } from "./components/layouts/main-layout";

const HomePage = lazy(() => import("./pages/home-page"));
const InventoryPage = lazy(() => import("./pages/inventory/inventory-page"));
const ProductsPage = lazy(() => import("./pages/products-page"));
const CategoriesPage = lazy(() => import("./pages/categories-page"));
const RoomsPage = lazy(() => import("./pages/rooms-page"));
const OrdersPage = lazy(() => import("./pages/orders-page"));
const InventorySummaryPage = lazy(() => import("./pages/inventory/inventory-summary-page"));
const InventoryPositionsPage = lazy(() => import("./pages/inventory/inventory-positions-page"));

const page = (element: React.ReactNode) => (
  <Suspense fallback={<div className="h-72 animate-pulse rounded-[28px] border bg-white/60" />}>
    {element}
  </Suspense>
);

export function Routes() {
  return (
    <RouterRoutes>
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
    </RouterRoutes>
  );
}

export default Routes;
