import type { Category } from "@/api/categories";
import { CategoryForm, type CategoryFormValues } from "@/app/components/forms/category-form";
import { LoadingState } from "@/app/components/loading-state";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { useCategories, useCategoryMutations } from "@/hooks/categories";
import { Edit3, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";

export function CategoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { data: categories = [], isLoading, error } = useCategories();
  const { createCategoryMutation, updateCategoryMutation, deleteCategoryMutation } = useCategoryMutations();
  const isSaving = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  const closeDialog = () => { setIsDialogOpen(false); setEditingCategory(null); };
  const handleSubmit = (data: CategoryFormValues, isEditing: boolean) => {
    if (isEditing && editingCategory) updateCategoryMutation.mutate({ id: editingCategory.id, updates: data }, { onSuccess: closeDialog });
    else createCategoryMutation.mutate(data, { onSuccess: closeDialog });
  };
  const handleDelete = (category: Category) => {
    if (window.confirm(`Usunąć kategorię „${category.name}”? Produkty pozostaną bez kategorii.`)) deleteCategoryMutation.mutate(category.id);
  };

  return (
    <div className="app-page space-y-6">
      <div className="app-page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Porządek w katalogu</p><h1 className="mt-1 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Kategorie</h1><p className="mt-2 text-muted-foreground">Grupy produktów używane w filtrach i raporcie.</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : closeDialog()}>
          <DialogTrigger asChild><Button size="lg" onClick={() => setEditingCategory(null)}><Plus /> Dodaj kategorię</Button></DialogTrigger>
          <DialogContent className="rounded-xl sm:max-w-lg"><DialogHeader><DialogTitle className="text-2xl">{editingCategory ? "Edytuj kategorię" : "Nowa kategoria"}</DialogTitle><DialogDescription>Nazwa będzie widoczna przy produktach i w podsumowaniu.</DialogDescription></DialogHeader><CategoryForm editingCategory={editingCategory} onSubmit={handleSubmit} onCancel={closeDialog} isPending={isSaving} /></DialogContent>
        </Dialog>
      </div>
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Nie udało się pobrać kategorii.</p> : isLoading ? (
        <LoadingState variant="cards" count={3} title="Wczytywanie kategorii" description="Pobieram grupy produktów…" />
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white px-6 py-14 text-center"><Tag className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 font-bold">Brak kategorii</p></div>
      ) : (
        <div className="app-entity-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => <article key={category.id} className="app-entity-card flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm"><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff4be] text-[#775d00]"><Tag /></div><div className="min-w-0 flex-1"><h2 className="truncate font-bold">{category.name}</h2><p className="mt-1 text-xs text-muted-foreground">Dodano {new Date(category.createdAt).toLocaleDateString("pl-PL")}</p></div><Button variant="ghost" size="icon" aria-label={`Edytuj ${category.name}`} onClick={() => { setEditingCategory(category); setIsDialogOpen(true); }}><Edit3 /></Button><Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-red-50 hover:text-destructive" aria-label={`Usuń ${category.name}`} onClick={() => handleDelete(category)}><Trash2 /></Button></article>)}
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;
