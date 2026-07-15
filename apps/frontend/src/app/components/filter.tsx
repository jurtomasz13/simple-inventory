import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Filter as FilterIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { useSearchParams } from "react-router-dom";

export type Option = {
    label: string; 
    value: string;
};

export type SelectClasses = {
    trigger?: string;
    content?: string;
    option?: string;
}

export type SelectProps = {
    title: string;
    options: string[]; 
}

export function Filter({ title = "Kategorie", options }: SelectProps) {
    const [params, setParams] = useSearchParams();

    const activeFilters = params.getAll("filter");

    const handleOptionToggle = (option: string) => {
        let nextFilters = [...activeFilters];

        if (activeFilters.includes(option)) {
            nextFilters = activeFilters.filter((f) => f !== option);
        } else {
            nextFilters.push(option);
        }

        nextFilters.sort();
        const newParams = new URLSearchParams(params);
        newParams.delete("filter");
        nextFilters.forEach((filter) => newParams.append("filter", filter));

        setParams(newParams);
    };

    const clearOptionFilters = () => {
        const newParams = new URLSearchParams(params);
        newParams.delete("filter");
        setParams(newParams);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={activeFilters.length === 0 ? "outline" : "default"}
                    className={`w-48 h-12 justify-start border border-border `}
                >
                    <FilterIcon className="h-4 w-4 mr-2" />
                    {activeFilters.length === 0 ? `Wszystkie ${title}` : `${activeFilters.length} ${title}`}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text h-8 content-center">{title}</h4>
                        {activeFilters.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearOptionFilters}
                                className="h-8 px-3 text-xs bg-muted"
                            >
                            Wyczyść
                            </Button>
                        )}
                        </div>
                    <div className="space-y-3">
                    {options.map((option) => (
                        <div key={option} className="flex items-center space-x-3">
                            <label
                                htmlFor={`option-${option}`}
                                className="flex gap-2 items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                <Checkbox
                                    id={`option-${option}`}
                                    checked={activeFilters.includes(option)}
                                    onCheckedChange={() => handleOptionToggle(option)}
                                    className="h-5 w-5"
                                />
                                {option}
                            </label>
                        </div>
                    ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
