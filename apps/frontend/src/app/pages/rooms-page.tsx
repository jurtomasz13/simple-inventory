import type { Room } from "@/api/rooms";
import { RoomForm, type RoomFormValues } from "@/app/components/forms/room-form";
import { LoadingState } from "@/app/components/loading-state";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { useRoomMutations, useRooms } from "@/hooks/rooms";
import { Edit3, MapPin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function RoomsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const { data: rooms = [], isLoading, error } = useRooms();
  const { createRoomMutation, updateRoomMutation, deleteRoomMutation } = useRoomMutations();
  const isSaving = createRoomMutation.isPending || updateRoomMutation.isPending;

  const closeDialog = () => { setIsDialogOpen(false); setEditingRoom(null); };
  const handleSubmit = (data: RoomFormValues, isEditing: boolean) => {
    if (isEditing && editingRoom) updateRoomMutation.mutate({ id: editingRoom.id, updates: data }, { onSuccess: closeDialog });
    else createRoomMutation.mutate(data, { onSuccess: closeDialog });
  };
  const handleDelete = (room: Room) => {
    if (window.confirm(`Usunąć strefę „${room.name}”?`)) deleteRoomMutation.mutate(room.id);
  };

  return (
    <div className="app-page space-y-6">
      <div className="app-page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Obszary inwentaryzacji</p><h1 className="mt-1 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Strefy sklepu</h1><p className="mt-2 text-muted-foreground">Sala sprzedaży, magazyn, lada i inne miejsca uwzględniane w inwentaryzacji.</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : closeDialog()}>
          <DialogTrigger asChild><Button size="lg" onClick={() => setEditingRoom(null)}><Plus /> Dodaj strefę</Button></DialogTrigger>
          <DialogContent className="rounded-xl sm:max-w-lg"><DialogHeader><DialogTitle className="text-2xl">{editingRoom ? "Edytuj strefę" : "Nowa strefa"}</DialogTitle><DialogDescription>Strefę wybiera się przy każdej pozycji inwentaryzacji.</DialogDescription></DialogHeader><RoomForm editingRoom={editingRoom} onSubmit={handleSubmit} onCancel={closeDialog} isPending={isSaving} /></DialogContent>
        </Dialog>
      </div>
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Nie udało się pobrać stref.</p> : isLoading ? (
        <LoadingState variant="cards" count={3} title="Wczytywanie stref" description="Pobieram miejsca wykorzystywane podczas inwentaryzacji…" />
      ) : rooms.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white px-6 py-14 text-center"><MapPin className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 font-bold">Brak zdefiniowanych stref</p></div>
      ) : (
        <div className="app-entity-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => <article key={room.id} className="app-entity-card rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="grid size-11 place-items-center rounded-2xl bg-[#e8f0fa] text-[#315f96]"><MapPin /></div><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Edytuj ${room.name}`} onClick={() => { setEditingRoom(room); setIsDialogOpen(true); }}><Edit3 /></Button><Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-red-50 hover:text-destructive" aria-label={`Usuń ${room.name}`} onClick={() => handleDelete(room)}><Trash2 /></Button></div></div><h2 className="mt-4 text-lg font-bold">{room.name}</h2><p className="mt-2 min-h-10 text-sm leading-relaxed text-muted-foreground">{room.description || "Bez dodatkowego opisu"}</p></article>)}
        </div>
      )}
    </div>
  );
}

export default RoomsPage;
