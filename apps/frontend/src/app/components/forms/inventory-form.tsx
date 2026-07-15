import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect } from "react";

const inventorySchema = z.object({
    date: z.string().min(1, "Wybierz datę inwentaryzacji"),
    name: z.string().trim().min(2, "Nazwa inwentaryzacji musi mieć co najmniej 2 znaki"),
});

export type InventoryFormValues = z.infer<typeof inventorySchema>;

type InventoryFormProps = {
    onSubmit: (data: InventoryFormValues, isEditing: boolean) => void;
    onCancel: () => void;
    editingInventory?: { name?: string; date?: string | Date } | null;
    isPending?: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

function getDefaults(inventory?: InventoryFormProps["editingInventory"]): InventoryFormValues {
    return {
        name: inventory?.name ?? "",
        date: inventory?.date ? new Date(inventory.date).toISOString().slice(0, 10) : today(),
    };
}

export function InventoryForm({ editingInventory, onSubmit, onCancel, isPending }: InventoryFormProps) {
    const { register, handleSubmit, reset, formState: { errors }} = useForm<InventoryFormValues>({
        resolver: zodResolver(inventorySchema),
        defaultValues: getDefaults(editingInventory),
    });

    const isEditing = Boolean(editingInventory);

    useEffect(() => {
        reset(getDefaults(editingInventory));
    }, [editingInventory, reset]);

    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data, isEditing))} className="space-y-5">
            <div>
                <Label htmlFor="inventory-name" className="mb-2">Nazwa arkusza</Label>
                <Input
                    id="inventory-name"
                    autoFocus
                    placeholder="np. Inwentaryzacja — zmiana poranna"
                    {...register("name")}
                />
                {errors.name && <p className="mt-1.5 text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div>
                <Label htmlFor="inventory-date" className="mb-2">Data liczenia</Label>
                <Input id="inventory-date" type="date" {...register("date")} />
                {errors.date && <p className="mt-1.5 text-sm text-destructive">{errors.date.message}</p>}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                    Anuluj
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Zapisywanie…" : isEditing ? "Zapisz zmiany" : "Utwórz i rozpocznij"}
                </Button>
            </div>
        </form>
    )
}
