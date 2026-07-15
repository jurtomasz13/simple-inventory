import { Outlet } from "react-router-dom";
import Navigation from "../navigation";

export function MainLayout() {
    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <Outlet />
            </main>
        </div>
    )
}
