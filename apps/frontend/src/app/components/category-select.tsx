import { useCategories } from "@/hooks/categories";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type CategorySelectProps = {
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
};

export function CategorySelect({ value, onValueChange, placeholder = "Wybierz kategorię" }: CategorySelectProps) {
    const { data: categories = [] } = useCategories();

    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
