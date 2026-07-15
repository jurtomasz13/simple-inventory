import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect } from "react";

const categorySchema = z.object({
    name: z.string().min(2, "Nazwa kategorii musi mieć co najmniej 2 znaki"),
    // description: z.string(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

type CategoryFormProps = {
    onSubmit: (data: CategoryFormValues, isEditing: boolean) => void;
    onCancel: () => void;
    editingCategory?: Partial<CategoryFormValues> | null;
    isPending?: boolean;
}

export function CategoryForm({ editingCategory, onSubmit, onCancel, isPending }: CategoryFormProps) {
    const { register, handleSubmit, reset, formState: { errors }} = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: editingCategory || { name: "" }
    });
    
    const isEditing = !!editingCategory;
    
    useEffect(() => {
        reset(editingCategory || { name: "" });
    }, [editingCategory, reset]);
    
    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data, isEditing))} className="space-y-4">
            <div>
                <Label htmlFor="name">Nazwa kategorii</Label>
                <Input id="name" placeholder="np. Mięso wołowe" {...register("name")} />
                {errors.name && <span className="text-red-500">{errors.name.message}</span>}
            </div>

            {/* <div>
                <Label htmlFor="code">Opis kategorii</Label>
                <Input id="code" placeholder="np. MEAT001" {...register("description")} />
                {errors.description && <span className="text-red-500">{errors.description.message}</span>}
            </div> */}

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                    Anuluj
                </Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Zapisywanie…" : isEditing ? "Zapisz zmiany" : "Dodaj kategorię"}</Button>
            </div>
        </form>
    )
}
