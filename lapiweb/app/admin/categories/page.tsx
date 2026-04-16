"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Tag, Loader2, Check, X } from "lucide-react";
import { useCategories } from "@/hooks/useCatalogue";
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useAdmin";

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    createCategory.mutate({ name: newName.trim(), slug, description: newDesc.trim(), position: (categories?.length ?? 0) + 1 }, {
      onSuccess: () => { setShowNew(false); setNewName(""); setNewDesc(""); },
    });
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    updateCategory.mutate({ id, data: { name: editName.trim() } }, {
      onSuccess: () => setEditId(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold">Categories</h1>
          <p className="mt-1 text-[14px] text-[var(--st-warm-gray)]">{categories?.length ?? 0} categories</p>
        </div>
        <button onClick={() => setShowNew(true)} className="st-btn-primary gap-1.5 text-[13px]">
          <Plus className="h-4 w-4" /> Nouvelle categorie
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* New category form */}
          {showNew && (
            <div className="st-card space-y-3">
              <input
                type="text"
                placeholder="Nom de la categorie"
                className="st-input w-full"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optionnel)"
                className="st-input w-full"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={createCategory.isPending} className="st-btn-primary gap-1 text-[13px]">
                  {createCategory.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Creer
                </button>
                <button onClick={() => { setShowNew(false); setNewName(""); setNewDesc(""); }} className="st-btn-secondary text-[13px]">
                  Annuler
                </button>
              </div>
            </div>
          )}

          {categories?.map((c) => (
            <div key={c.id} className="st-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-st-gold/10">
                  <Tag className="h-5 w-5 text-st-gold" />
                </div>
                {editId === c.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="st-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(c.id)}
                    />
                    <button onClick={() => handleUpdate(c.id)} className="flex h-8 w-8 items-center justify-center rounded-full border border-st-forest text-st-forest hover:bg-st-forest/10">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditId(null)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--st-warm-gray)]">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="font-sans text-[14px] font-bold">{c.name}</p>
                    <p className="text-[12px] text-[var(--st-warm-gray)]">/{c.slug}{c.description ? ` — ${c.description}` : ""}</p>
                  </div>
                )}
              </div>
              {editId !== c.id && (
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.is_active ? "bg-st-forest/10 text-st-forest" : "bg-gray-100 text-gray-500"}`}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => { setEditId(c.id); setEditName(c.name); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--st-warm-gray)] hover:text-st-gold"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer "${c.name}" ?`)) deleteCategory.mutate(c.id);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[var(--st-warm-gray)] hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {!categories?.length && (
            <p className="py-8 text-center text-[14px] text-[var(--st-warm-gray)]">Aucune categorie.</p>
          )}
        </div>
      )}
    </div>
  );
}
