import { Outlet } from "react-router-dom";
import Navigation from "../navigation";
import { useEffect, useState } from "react";
import { getDemoLoginUrl } from "@/lib/axios";

function prepareSession() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");

    if (token) {
        localStorage.setItem("accessToken", token);
        url.searchParams.delete("token");
        window.history.replaceState({}, document.title, url.toString());
        return true;
    }

    return Boolean(localStorage.getItem("accessToken"));
}

export function MainLayout() {
    const [isSessionReady] = useState(prepareSession);

    useEffect(() => {
        if (!isSessionReady) {
            window.location.assign(getDemoLoginUrl());
        }
    }, [isSessionReady]);

    if (!isSessionReady) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#f5f6f2] px-6">
                <div className="text-center">
                    <div className="mx-auto mb-4 size-12 animate-pulse rounded-2xl bg-primary" />
                    <p className="font-semibold text-foreground">Przygotowuję stanowisko…</p>
                    <p className="mt-1 text-sm text-muted-foreground">Logowanie do sklepu</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navigation />
            <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <Outlet />
            </main>
        </div>
    )
}
