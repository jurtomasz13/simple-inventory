import * as z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useEffect } from "react";
import { Category } from "@/api/categories";
import { BarcodeScannerButton } from "../barcode-scanner";

const productSchema = z.object({
  name: z.string().trim().min(2, "Nazwa produktu musi mieć co najmniej 2 znaki"),
  code: z.string().trim().min(1, "Kod produktu jest wymagany"),
  unit: z.enum(["KILOGRAM", "PIECE", "LITER"], { message: "Jednostka jest wymagana" }),
  categoryId: z.string().min(1, "Kategoria jest wymagana"),
});

export type ProductFormValues = z.infer<typeof productSchema>;

type ProductFormProps = {
    editingProduct?: Partial<ProductFormValues> | null;
    initialCode?: string;
    categories: Category[],
    onSubmit: (data: ProductFormValues, isEditing: boolean) => void;
    onCancel: () => void;
    isPending?: boolean;
}

export function ProductForm({ editingProduct, initialCode = "", categories, onSubmit, onCancel, isPending }: ProductFormProps) {
    const { control, register, handleSubmit, reset, setValue, formState: { errors }} = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: editingProduct || { name: "", code: initialCode, unit: undefined, categoryId: "" }
    });
    
    const isEditing = !!editingProduct;
    //TODO: Put it somewhere else
    const units = [
        { id: "KILOGRAM", name: "KILOGRAMY" },
        { id: "PIECE", name: "SZTUKI"},
        { id: "LITER", name: "LITRY"},
    ];
    
    useEffect(() => {
        reset(editingProduct || { name: "", code: initialCode, unit: undefined, categoryId: "" });
    }, [editingProduct, initialCode, reset]);
    
    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data, isEditing ))} className="space-y-4">
            <div>
                <Label htmlFor="name">Nazwa produktu</Label>
                <Input id="name" placeholder="np. Mięso wołowe" {...register("name")} />
                {errors.name && <span className="text-red-500">{errors.name.message}</span>}
            </div>

            <div>
                <Label htmlFor="code">Kod produktu</Label>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <Input id="code" inputMode="text" autoComplete="off" placeholder="np. EAN 5901234123457" {...register("code")} />
                    <BarcodeScannerButton
                        onDetected={(code) => setValue("code", code, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                        label="Skanuj"
                    />
                </div>
                {errors.code && <span className="text-red-500">{errors.code.message}</span>}
            </div>

            <div>
                <Label htmlFor="unit">Jednostka</Label>
                <Controller
                    name="unit"
                    control={control}
                    rules={{ required: "Wybierz jednostkę" }}
                    render={({ field }) => (
                        <Select
                            value={field.value}
                            onValueChange={field.onChange}
                        >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Wybierz jednostkę" />
                        </SelectTrigger>
                        <SelectContent>
                            {units.map((unit) => (
                                <SelectItem key={unit.id} value={unit.id} className="cursor-pointer">
                                    {unit.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    )}
                />
                {errors.unit && <span className="text-red-500">{errors.unit.message}</span>}
            </div>

            <div>
                <Label htmlFor="category">Kategoria</Label>
                <Controller
                    name="categoryId"
                    control={control}
                    rules={{ required: "Wybierz kategorię" }}
                    render={({ field }) => (
                        <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={categories.length === 0}
                        >
                        <SelectTrigger className="w-full" title={categories.length === 0 ? "Brak kategorii — dodaj ją najpierw" : undefined}>
                            {categories.length === 0 ? <span className="truncate">Brak kategorii</span> : <SelectValue placeholder="Wybierz kategorię" />}
                        </SelectTrigger>
                        <SelectContent isEmpty={categories.length === 0} emptyMessage="Brak kategorii — dodaj ją najpierw">
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id} className="cursor-pointer">
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    )}
                />
                {errors.categoryId && <span className="text-red-500">{errors.categoryId.message}</span>}
            </div>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                    Anuluj
                </Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Zapisywanie…" : isEditing ? "Zapisz zmiany" : "Dodaj produkt"}</Button>
            </div>
        </form>
    )
}
