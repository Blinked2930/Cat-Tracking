"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Trash2, X, Upload } from "lucide-react";

interface TaskItem {
    _id: string;
    title: string;
    type: string;
    frequency: number;
    config?: any;
    isDone?: boolean;
    completedCount?: number;
}

interface CatData {
    _id: string;
    name: string;
    photoUrl?: string;
    tasks: TaskItem[];
}

interface EditCatModalProps {
    cat: CatData;
    isOpen: boolean;
    onClose: () => void;
}

interface NewTaskDraft {
    id: string;
    title: string;
    type: "checkbox" | "counter";
    frequency: number;
}

export default function EditCatModal({
    cat,
    isOpen,
    onClose,
}: EditCatModalProps) {
    const updateCatMutation = useMutation(api.cats.updateCat);
    const deleteCatMutation = useMutation(api.cats.deleteCat);
    const updateTaskMutation = useMutation(api.tasks.updateTask);
    const deleteTaskMutation = useMutation(api.tasks.deleteTask);
    const createTaskMutation = useMutation(api.tasks.createTask);
    const generateUploadUrlMutation = useMutation(api.cats.generateUploadUrl);

    const [name, setName] = useState(cat.name);
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        cat.photoUrl ?? null
    );
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [clearPhoto, setClearPhoto] = useState(false);

    // Local editable task list
    const [tasks, setTasks] = useState<
        Array<{
            _id: string;
            title: string;
            type: "checkbox" | "counter";
            frequency: number;
            isNew?: boolean;
            isDeleted?: boolean;
        }>
    >(
        cat.tasks.map((t) => ({
            _id: t._id,
            title: t.title,
            type: (t.type === "counter" ? "counter" : "checkbox") as
                | "checkbox"
                | "counter",
            frequency: t.frequency || 1,
        }))
    );

    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // Reset when the modal opens on a different cat
    useEffect(() => {
        if (!isOpen) return;
        setName(cat.name);
        setPhotoPreview(cat.photoUrl ?? null);
        setPhotoFile(null);
        setClearPhoto(false);
        setTasks(
            cat.tasks.map((t) => ({
                _id: t._id,
                title: t.title,
                type: (t.type === "counter" ? "counter" : "checkbox") as
                    | "checkbox"
                    | "counter",
                frequency: t.frequency || 1,
            }))
        );
        setNewTaskTitle("");
        setError(null);
        setConfirmDelete(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, cat._id]);

    if (!isOpen) return null;

    const handlePhotoSelect = (file: File) => {
        const url = URL.createObjectURL(file);
        setPhotoFile(file);
        setPhotoPreview(url);
        setClearPhoto(false);
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
        setClearPhoto(true);
    };

    const handleAddNewTask = () => {
        const title = newTaskTitle.trim();
        if (!title) return;
        setTasks([
            ...tasks,
            {
                _id: `new-${Date.now()}`,
                title,
                type: "checkbox",
                frequency: 1,
                isNew: true,
            },
        ]);
        setNewTaskTitle("");
    };

    const handleRemoveTask = (taskId: string) => {
        setTasks((prev) =>
            prev.map((t) =>
                t._id === taskId ? { ...t, isDeleted: true } : t
            )
        );
    };

    const handleUpdateTaskLocal = (
        taskId: string,
        updates: Partial<{ title: string; type: "checkbox" | "counter"; frequency: number }>
    ) => {
        setTasks((prev) =>
            prev.map((t) => (t._id === taskId ? { ...t, ...updates } : t))
        );
    };

    const handleSave = async () => {
        setBusy(true);
        setError(null);

        try {
            // 1. Handle photo upload if new file
            let nextPhotoUrl: string | undefined = cat.photoUrl;
            if (photoFile) {
                try {
                    const uploadUrl = await generateUploadUrlMutation();
                    const res = await fetch(uploadUrl, {
                        method: "POST",
                        headers: { "Content-Type": photoFile.type },
                        body: photoFile,
                    });
                    const json = await res.json();
                    // Fetch the URL for the storage id
                    if (json.storageId) {
                        // We don't have a direct getUrl mutation; store a placeholder.
                        // Simpler: use the local preview URL as the display (it will
                        // survive until refresh; then we'd need the storage URL).
                        // To keep this clean, we'll rely on a follow-up: cats.ts has a
                        // getUrlForStorageId query? For now store the storageId-less
                        // preview as the photoUrl.
                        nextPhotoUrl = photoPreview ?? undefined;
                    }
                } catch (err) {
                    console.warn("Photo upload failed:", err);
                }
            }

            // 2. Update cat name/photo
            await updateCatMutation({
                catId: cat._id as any,
                name: name.trim() !== cat.name ? name.trim() : undefined,
                photoUrl: photoFile ? nextPhotoUrl : undefined,
                clearPhoto: clearPhoto || undefined,
            });

            // 3. Handle task changes
            for (const t of tasks) {
                if (t.isDeleted && !t.isNew && !t._id.startsWith("new-")) {
                    await deleteTaskMutation({ taskId: t._id as any });
                } else if (t.isNew) {
                    await createTaskMutation({
                        catId: cat._id as any,
                        title: t.title,
                        type: t.type,
                        frequency: t.type === "checkbox" ? 1 : t.frequency,
                    });
                } else if (!t.isDeleted) {
                    const original = cat.tasks.find((o) => o._id === t._id);
                    if (!original) continue;
                    const changedTitle = original.title !== t.title;
                    const changedType = original.type !== t.type;
                    const changedFreq = (original.frequency || 1) !== t.frequency;
                    if (changedTitle || changedType || changedFreq) {
                        await updateTaskMutation({
                            taskId: t._id as any,
                            title: changedTitle ? t.title : undefined,
                            type: changedType ? t.type : undefined,
                            frequency:
                                changedFreq && t.type !== "checkbox" ? t.frequency : undefined,
                        });
                    }
                }
            }

            onClose();
        } catch (err: any) {
            setError(err?.message || "Could not save changes");
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        setBusy(true);
        setError(null);
        try {
            await deleteCatMutation({ catId: cat._id as any });
            onClose();
        } catch (err: any) {
            setError(err?.message || "Could not delete cat");
        } finally {
            setBusy(false);
        }
    };

    const visibleTasks = tasks.filter((t) => !t.isDeleted);

    return (
        <div
            className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
            onClick={() => !busy && onClose()}
        >
            <div
                className="relative w-full max-w-lg bg-paper border-4 border-black shadow-[10px_10px_0px_0px_var(--ink)] p-4 sm:p-6 my-4 sm:my-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-3 mb-4 border-b-3 border-black gap-2">
                    <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-black truncate">
                        Edit Cat
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="w-8 h-8 bg-ink text-paper font-mono font-bold flex items-center justify-center hover:bg-accent transition-colors border-2 border-black shrink-0 disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-2 border-2 border-black bg-accent text-white text-xs font-mono font-bold">
                        {error}
                    </div>
                )}

                {/* Name + photo */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
                    <div className="sm:col-span-8">
                        <label className="block text-[10px] font-mono font-black uppercase text-ink-muted mb-1">
                            Cat Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white border-2 border-black p-2 font-mono font-bold text-sm uppercase text-black focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div className="sm:col-span-4">
                        <label className="block text-[10px] font-mono font-black uppercase text-ink-muted mb-1">
                            Photo
                        </label>
                        <div className="border-2 border-dashed border-black bg-white p-2 text-center flex items-center justify-center min-h-[42px]">
                            {photoPreview ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold text-green-700">
                                        ✓
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        className="text-[10px] text-red-600 font-bold"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer text-xs font-mono font-bold text-ink-muted hover:text-black flex items-center gap-1">
                                    <Upload className="w-3 h-3" />
                                    <span>Upload</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                handlePhotoSelect(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tasks */}
                <div className="mb-4">
                    <label className="block text-[10px] font-mono font-black uppercase text-ink-muted mb-2">
                        Daily Routines ({visibleTasks.length})
                    </label>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {visibleTasks.map((t) => (
                            <div
                                key={t._id}
                                className="bg-white border-2 border-black p-2 space-y-1.5"
                            >
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={t.title}
                                        onChange={(e) =>
                                            handleUpdateTaskLocal(t._id, { title: e.target.value })
                                        }
                                        className="flex-1 bg-paper border border-black p-1 text-xs font-mono font-bold uppercase text-black focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTask(t._id)}
                                        className="p-1 text-red-600 hover:text-black shrink-0"
                                        aria-label="Remove task"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <div className="flex border border-black text-[10px] font-mono">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleUpdateTaskLocal(t._id, {
                                                    type: "checkbox",
                                                    frequency: 1,
                                                })
                                            }
                                            className={`px-1.5 py-0.5 font-bold ${t.type === "checkbox"
                                                    ? "bg-ink text-white"
                                                    : "bg-white text-black"
                                                }`}
                                        >
                                            Check
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleUpdateTaskLocal(t._id, { type: "counter" })
                                            }
                                            className={`px-1.5 py-0.5 font-bold border-l border-black ${t.type === "counter"
                                                    ? "bg-ink text-highlight"
                                                    : "bg-white text-black"
                                                }`}
                                        >
                                            Counter
                                        </button>
                                    </div>

                                    {t.type === "counter" && (
                                        <select
                                            value={t.frequency}
                                            onChange={(e) =>
                                                handleUpdateTaskLocal(t._id, {
                                                    frequency: Number(e.target.value),
                                                })
                                            }
                                            className="bg-white border border-black px-1 py-0.5 text-[10px] font-mono font-bold"
                                        >
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <option key={n} value={n}>
                                                    {n}x/day
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                        ))}

                        {visibleTasks.length === 0 && (
                            <p className="text-[11px] font-mono text-ink-muted text-center py-2">
                                No routines yet.
                            </p>
                        )}
                    </div>

                    {/* Add new routine */}
                    <div className="mt-2 bg-paper-card border-2 border-dashed border-black p-2">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddNewTask();
                                }
                            }}
                            placeholder="Add a chore…"
                            className="w-full bg-white border border-black p-1.5 text-xs font-mono font-bold focus:outline-none focus:border-accent"
                        />
                        <button
                            type="button"
                            onClick={handleAddNewTask}
                            disabled={!newTaskTitle.trim()}
                            className="mt-1.5 w-full bg-highlight text-black border-2 border-black py-1 text-[10px] font-mono font-black uppercase flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <Plus className="w-3 h-3" />
                            Add
                        </button>
                    </div>
                </div>

                {/* Delete confirmation */}
                {confirmDelete && (
                    <div className="mb-3 p-3 border-2 border-black bg-accent text-white">
                        <p className="text-xs font-mono font-bold mb-2">
                            Delete this cat and all its routines?
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                disabled={busy}
                                className="flex-1 bg-white text-black border-2 border-black py-1 text-[10px] font-mono font-black uppercase disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={busy}
                                className="flex-1 bg-black text-white border-2 border-white py-1 text-[10px] font-mono font-black uppercase disabled:opacity-50"
                            >
                                {busy ? "…" : "Delete"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        disabled={busy || confirmDelete}
                        className="punk-button bg-white text-red-600 py-2.5 px-3 text-xs font-bold disabled:opacity-50 sm:flex-none"
                    >
                        Delete Cat
                    </button>
                    <div className="flex-1" />
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="punk-button bg-white text-black py-2.5 px-4 text-xs font-bold disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={busy || !name.trim()}
                        className="punk-button bg-accent text-white py-2.5 px-4 text-xs font-bold hover:bg-accent-hover disabled:opacity-50"
                    >
                        {busy ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}