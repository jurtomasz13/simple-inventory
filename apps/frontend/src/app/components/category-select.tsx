import { useCategories } from "@/hooks/categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type CategorySelectProps = {
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
};

export function CategorySelect({ value, onValueChange, placeholder = "Wybierz kategorię" }: CategorySelectProps) {
    const { data: categories = [], isLoading } = useCategories();
    const isUnavailable = !isLoading && categories.length === 0;

    return (
        <Select value={value} onValueChange={onValueChange} disabled={isLoading || isUnavailable}>
            <SelectTrigger className="w-full" title={isUnavailable ? "Brak kategorii — dodaj ją najpierw" : undefined}>
                {isLoading
                    ? <span className="truncate">Wczytywanie kategorii…</span>
                    : isUnavailable
                      ? <span className="truncate">Brak kategorii</span>
                      : <SelectValue placeholder={placeholder} />}
            </SelectTrigger>
            <SelectContent isEmpty={categories.length === 0} emptyMessage={isLoading ? "Wczytywanie kategorii…" : "Brak kategorii — dodaj ją najpierw"}>
                {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
