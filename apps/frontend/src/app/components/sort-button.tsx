import React from "react";
import { Button } from "./ui/button";
import { useSearchParams } from "react-router-dom";
import { getNextSortDir, parseSortParam } from "@/utils/sort";

export type SortButtonProps = {
    title: string;
    name: string;
    icon: React.ElementType;
}

export function SortButton({ title, name, icon: Icon }: SortButtonProps) {
    const [params, setParams] = useSearchParams();

    const activeSort = parseSortParam(params.get("sort"));
    const isCurrentSortActive = activeSort.field === name;

    const handleSort = () => {
        const dir = getNextSortDir(activeSort.dir);

        const newSortParam = `${name}+${dir.toLocaleLowerCase()}`; 

        params.set("sort", newSortParam);
        setParams(params);
    };

    const arrowStyles = isCurrentSortActive ? "opacity-100" : "opacity-0";

    return (
        <Button
            variant={isCurrentSortActive ? "default" : "outline"}
            onClick={handleSort}
            className={`h-12 px-4 ${isCurrentSortActive ? "border" : "bg-background"}`}
        >
            <Icon className="h-4 w-4" />
            {title} <span className={arrowStyles}>{isCurrentSortActive ? (activeSort.dir === "ASC" ? "↑" : "↓") : "↑"}</span>
        </Button>
    );
}
