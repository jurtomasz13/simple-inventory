import { CalendarDays, ClipboardList, Edit3, FileText, PackageSearch, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "../../components/ui/dialog";
import type { Inventory } from "@/api/inventories";
import { useInventoryMutations, useInventories } from "@/hooks/inventories";
import { InventoryForm, type InventoryFormValues } from "@/app/components/forms/inventory-form";
import { LoadingState } from "@/app/components/loading-state";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const formatDate = (date: string) =>
    new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(date));

export function InventoryPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get("new") === "true");
    const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
    const { data: inventories = [], isLoading, error } = useInventories();
    const { createInventoryMutation, deleteInventoryMutation, updateInventoryMutation } = useInventoryMutations();
    const isSaving = createInventoryMutation.isPending || updateInventoryMutation.isPending;

    useEffect(() => {
        if (searchParams.get("new") === "true") {
            setEditingInventory(null);
            setIsDialogOpen(true);
        }
    }, [searchParams]);

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingInventory(null);
        if (searchParams.has("new")) {
            const next = new URLSearchParams(searchParams);
            next.delete("new");
            setSearchParams(next, { replace: true });
        }
    };

    const handleSubmit = (data: InventoryFormValues, isEditing: boolean) => {
        if (isEditing && editingInventory) {
            updateInventoryMutation.mutate(
                { id: editingInventory.id, updates: data },
                { onSuccess: closeDialog }
            );
            return;
        }

        createInventoryMutation.mutate(data, {
            onSuccess: (inventory) => navigate(`/inventory/${inventory.id}/positions`),
        });
    };

    const handleDelete = (inventory: Inventory) => {
        const confirmed = window.confirm(`Usunąć „${inventory.name}” wraz ze wszystkimi pozycjami?`);
        if (confirmed) deleteInventoryMutation.mutate(inventory.id);
    };

    return (
        <div className="app-page space-y-6">
            <div className="app-page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Inwentaryzacje</p>
                    <h1 className="mt-1 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Inwentaryzacje</h1>
                    <p className="mt-2 max-w-2xl text-muted-foreground">Wybierz inwentaryzację i kontynuuj dodawanie pozycji albo rozpocznij nową.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : closeDialog()}>
                    <DialogTrigger asChild>
                        <Button size="lg" onClick={() => setEditingInventory(null)}>
                            <Plus className="size-5" />
                            Nowa inwentaryzacja
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-xl sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{editingInventory ? "Edytuj inwentaryzację" : "Nowa inwentaryzacja"}</DialogTitle>
                            <DialogDescription>
                                {editingInventory ? "Zmień nazwę lub datę inwentaryzacji." : "Nadaj nazwę inwentaryzacji. Po zapisaniu od razu przejdziesz do jej pozycji."}
                            </DialogDescription>
                        </DialogHeader>
                        <InventoryForm
                            editingInventory={editingInventory}
                            onSubmit={handleSubmit}
                            onCancel={closeDialog}
                            isPending={isSaving}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
                    Nie udało się pobrać inwentaryzacji. Sprawdź połączenie z serwerem i spróbuj ponownie.
                </div>
            )}

            {isLoading ? (
                <LoadingState variant="cards" count={4} title="Wczytywanie inwentaryzacji" description="Pobieram inwentaryzacje i liczbę zapisanych pozycji…" />
            ) : inventories.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-white px-6 py-16 text-center">
                    <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e8f3ed] text-primary">
                        <ClipboardList className="size-7" />
                    </div>
                    <h2 className="mt-5 text-xl font-bold">Nie ma jeszcze żadnej inwentaryzacji</h2>
                    <p className="mx-auto mt-2 max-w-md text-muted-foreground">Utwórz pierwszą inwentaryzację i zacznij dodawać produkty.</p>
                    <Button className="mt-6" size="lg" onClick={() => setIsDialogOpen(true)}><Plus /> Utwórz inwentaryzację</Button>
                </div>
            ) : (
                <div className="app-inventory-grid grid gap-4 md:grid-cols-2">
                    {inventories.map((inventory, index) => (
                        <article key={inventory.id} className="app-entity-card group rounded-xl border bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e8f3ed] text-primary">
                                    <FileText className="size-6" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" aria-label={`Edytuj ${inventory.name}`} onClick={() => { setEditingInventory(inventory); setIsDialogOpen(true); }}>
                                        <Edit3 />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-red-50 hover:text-destructive" aria-label={`Usuń ${inventory.name}`} onClick={() => handleDelete(inventory)}>
                                        <Trash2 />
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-xl font-bold tracking-tight">{inventory.name}</h2>
                                    {index === 0 && <span className="rounded-md bg-[#fff4be] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#775d00]">Ostatnia</span>}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><CalendarDays className="size-4" /> {formatDate(inventory.date)}</span>
                                    <span className="flex items-center gap-1.5"><PackageSearch className="size-4" /> {inventory.itemCount ?? 0} pozycji</span>
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-[1fr_auto] gap-2">
                                <Button asChild size="lg">
                                    <Link to={`/inventory/${inventory.id}/positions`}>Otwórz pozycje</Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" aria-label={`Podsumowanie ${inventory.name}`}>
                                    <Link to={`/inventory/${inventory.id}/summary`}><FileText /></Link>
                                </Button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

export default InventoryPage;
