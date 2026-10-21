"use client";

import React, { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Trash2, Upload, Code, ChevronDown, Check } from "lucide-react";

interface TaskFormItem {
  id: string;
  title: string;
  type: "checkbox" | "counter";
  frequency: number;
  configJson: string;
  isConfigOpen: boolean;
}

interface CatFormItem {
  id: string;
  name: string;
  photoFile?: File | null;
  photoPreview?: string | null;
  photoStorageId?: string | null;
  tasks: TaskFormItem[];
}

const FREQUENCY_OPTIONS = [1, 2, 3, 4, 5] as const;

function PunkDropdown<T extends string | number>({
  value,
  onChange,
  options,
  className = "",
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-white border border-black px-2 py-1 text-xs font-mono font-bold text-black flex items-center justify-between gap-1 hover:bg-paper"
      >
        <span className="truncate">{selected?.label ?? "—"}</span>
        <ChevronDown
          className={`w-3 h-3 shrink-0 transition-transform ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[7rem] bg-white border-2 border-black shadow-[3px_3px_0_0_var(--ink)]">
          {options.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-2 py-1.5 text-xs font-mono font-bold flex items-center justify-between gap-1 hover:bg-highlight ${opt.value === value ? "bg-paper" : ""
                }`}
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && <Check className="w-3 h-3 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HouseholdSetupFlow({
  householdId,
  householdName,
  inviteCode,
  onComplete,
}: {
  householdId: string;
  householdName: string;
  inviteCode: string;
  onComplete?: (catsData: any[]) => void;
}) {
  const [cats, setCats] = useState<CatFormItem[]>([
    {
      id: "cat-setup-1",
      name: "",
      photoFile: null,
      photoPreview: null,
      tasks: [
        {
          id: "t-1",
          title: "Morning Kibble",
          type: "checkbox",
          frequency: 1,
          configJson: "",
          isConfigOpen: false,
        },
        {
          id: "t-2",
          title: "Evening Wet Food",
          type: "checkbox",
          frequency: 1,
          configJson: "",
          isConfigOpen: false,
        },
      ],
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const generateUploadUrlMutation = useMutation(api.cats.generateUploadUrl);
  const saveHouseholdSetupMutation = useMutation(api.cats.saveHouseholdSetup);

  const handleAddCat = () => {
    setCats([
      ...cats,
      {
        id: "cat-setup-" + Date.now(),
        name: "",
        photoFile: null,
        photoPreview: null,
        tasks: [
          {
            id: "t-def-1",
            title: "Morning Feeding",
            type: "checkbox",
            frequency: 1,
            configJson: "",
            isConfigOpen: false,
          },
          {
            id: "t-def-2",
            title: "Night Feeding",
            type: "checkbox",
            frequency: 1,
            configJson: "",
            isConfigOpen: false,
          },
        ],
      },
    ]);
  };

  const handleRemoveCat = (catId: string) => {
    if (cats.length <= 1) {
      setStatusMessage({ text: "At least one cat is required", type: "error" });
      return;
    }
    setCats(cats.filter((c) => c.id !== catId));
  };

  const handleUpdateCatName = (catId: string, name: string) => {
    setCats(cats.map((c) => (c.id === catId ? { ...c, name } : c)));
  };

  const handlePhotoSelect = (catId: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setCats(
      cats.map((c) =>
        c.id === catId
          ? { ...c, photoFile: file, photoPreview: previewUrl }
          : c
      )
    );
  };

  const handleAddTask = (catId: string) => {
    setCats(
      cats.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          tasks: [
            ...c.tasks,
            {
              id: "t-" + Date.now(),
              title: "",
              type: "checkbox",
              frequency: 1,
              configJson: "",
              isConfigOpen: false,
            },
          ],
        };
      })
    );
  };

  const handleRemoveTask = (catId: string, taskId: string) => {
    setCats(
      cats.map((c) => {
        if (c.id !== catId) return c;
        return { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) };
      })
    );
  };

  const handleUpdateTask = (
    catId: string,
    taskId: string,
    updates: Partial<TaskFormItem>
  ) => {
    setCats(
      cats.map((c) => {
        if (c.id !== catId) return c;
        return {
          ...c,
          tasks: c.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
          ),
        };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const namelessCat = cats.find((c) => !c.name.trim());
    if (namelessCat) {
      setStatusMessage({
        text: "Please enter a name for each cat",
        type: "error",
      });
      return;
    }

    for (const cat of cats) {
      for (const task of cat.tasks) {
        if (task.configJson.trim()) {
          try {
            JSON.parse(task.configJson.trim());
          } catch {
            setStatusMessage({
              text: `Invalid JSON format in task "${task.title || "Untitled"}"`,
              type: "error",
            });
            return;
          }
        }
      }
    }

    setIsSubmitting(true);

    try {
      const payloadCats = [];

      for (const cat of cats) {
        let storageId: string | null = null;

        if (cat.photoFile) {
          try {
            const uploadUrl = await generateUploadUrlMutation();
            const uploadRes = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": cat.photoFile.type },
              body: cat.photoFile,
            });
            const resJson = await uploadRes.json();
            storageId = resJson.storageId;
          } catch (uploadErr) {
            console.warn("Photo upload error:", uploadErr);
          }
        }

        const tasksPayload = cat.tasks
          .filter((t) => t.title.trim())
          .map((t) => ({
            title: t.title.trim(),
            type: t.type,
            frequency: t.frequency,
            config: t.configJson.trim()
              ? JSON.parse(t.configJson.trim())
              : undefined,
          }));

        payloadCats.push({
          name: cat.name.trim(),
          photoStorageId: storageId || undefined,
          photoUrl: cat.photoPreview || undefined,
          tasks: tasksPayload,
        });
      }

      await saveHouseholdSetupMutation({
        householdId: householdId as any,
        cats: payloadCats,
      });

      if (onComplete) {
        onComplete(
          payloadCats.map((c, i) => ({
            _id: `cat-${Date.now()}-${i}`,
            name: c.name,
            photoUrl: c.photoUrl,
            tasks: c.tasks.map((t, ti) => ({
              _id: `task-${Date.now()}-${ti}`,
              title: t.title,
              type: t.type,
              frequency: t.frequency,
              config: t.config,
              done: false,
            })),
          }))
        );
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || "Failed to save setup",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="border-b-3 border-black pb-4 mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-black">
            ADD HOUSEHOLD CATS
          </h2>
          <p className="text-[11px] sm:text-xs font-mono text-ink-muted mt-1">
            Register your cats and their daily care routines.
          </p>
        </div>
        <div className="text-[10px] sm:text-xs font-mono font-bold text-ink-muted">
          HOUSEHOLD:{" "}
          <span className="text-black font-mono font-bold">{householdName}</span>
          {" • "}
          <span className="text-black font-mono font-bold">{inviteCode}</span>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-5 p-3 border-2 border-black text-xs font-mono font-bold flex items-center justify-between gap-2 ${statusMessage.type === "error"
              ? "bg-accent text-white"
              : "bg-highlight text-black"
            }`}
        >
          <span className="min-w-0 break-words">{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="shrink-0"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {cats.map((cat, catIdx) => (
          <div
            key={cat.id}
            className="bg-paper-card border-3 border-black p-3 sm:p-5 shadow-[4px_4px_0px_0px_var(--ink)] space-y-3 sm:space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-black/20 pb-3">
              <span className="font-mono font-black text-sm sm:text-base uppercase text-black">
                Cat #{catIdx + 1}
              </span>
              {cats.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveCat(cat.id)}
                  className="text-xs font-mono font-bold text-red-600 hover:text-black flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
              <div className="sm:col-span-8">
                <label className="block text-[10px] font-mono font-bold uppercase text-black mb-1">
                  Cat Name
                </label>
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => handleUpdateCatName(cat.id, e.target.value)}
                  placeholder="e.g. Iggy, Dexter"
                  required
                  className="w-full bg-white border-2 border-black p-2.5 font-mono font-bold text-sm text-black uppercase focus:outline-none focus:border-accent"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-[10px] font-mono font-bold uppercase text-black mb-1">
                  Photo (Optional)
                </label>
                <div className="border-2 border-dashed border-black bg-white p-2 text-center flex items-center justify-center min-h-[46px]">
                  {cat.photoPreview ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-green-700">
                        ✓ Uploaded
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCats(
                            cats.map((c) =>
                              c.id === cat.id
                                ? { ...c, photoFile: null, photoPreview: null }
                                : c
                            )
                          )
                        }
                        className="text-[10px] text-red-600 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-xs font-mono font-bold text-ink-muted hover:text-black flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handlePhotoSelect(cat.id, e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-1 sm:pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] sm:text-xs font-mono font-bold uppercase text-black">
                  Daily Routines
                </span>
                <button
                  type="button"
                  onClick={() => handleAddTask(cat.id)}
                  className="text-[11px] sm:text-xs font-mono font-bold text-black hover:text-accent flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Chore</span>
                </button>
              </div>

              <div className="space-y-2">
                {cat.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white border-2 border-black p-2.5 sm:p-3 space-y-2"
                  >
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) =>
                          handleUpdateTask(cat.id, task.id, {
                            title: e.target.value,
                          })
                        }
                        placeholder="Chore title (e.g. Kibble, Insulin)"
                        required
                        className="w-full bg-paper border border-black p-1.5 font-mono text-xs font-bold uppercase focus:outline-none"
                      />

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex border border-black text-xs font-mono">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateTask(cat.id, task.id, {
                                type: "checkbox",
                              })
                            }
                            className={`px-2 py-1 font-bold ${task.type === "checkbox"
                                ? "bg-ink text-white"
                                : "bg-white text-black"
                              }`}
                          >
                            Check
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateTask(cat.id, task.id, {
                                type: "counter",
                              })
                            }
                            className={`px-2 py-1 font-bold border-l border-black ${task.type === "counter"
                                ? "bg-ink text-highlight"
                                : "bg-white text-black"
                              }`}
                          >
                            Counter
                          </button>
                        </div>

                        <PunkDropdown
                          value={task.frequency}
                          onChange={(v) =>
                            handleUpdateTask(cat.id, task.id, {
                              frequency: v,
                            })
                          }
                          options={FREQUENCY_OPTIONS.map((f) => ({
                            value: f,
                            label: `${f}x / day`,
                          }))}
                          className="w-28"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveTask(cat.id, task.id)}
                          className="p-1.5 text-red-600 hover:text-black ml-auto"
                          aria-label="Remove chore"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateTask(cat.id, task.id, {
                            isConfigOpen: !task.isConfigOpen,
                          })
                        }
                        className="text-[10px] font-mono text-ink-muted hover:text-black font-bold flex items-center gap-1"
                      >
                        <Code className="w-2.5 h-2.5" />
                        <span>
                          {task.isConfigOpen
                            ? "Hide Instructions"
                            : "+ Add Instructions / Rx"}
                        </span>
                      </button>

                      {task.isConfigOpen && (
                        <textarea
                          value={task.configJson}
                          onChange={(e) =>
                            handleUpdateTask(cat.id, task.id, {
                              configJson: e.target.value,
                            })
                          }
                          placeholder='{"dosage": "2 units", "notes": "After eating"}'
                          rows={2}
                          className="w-full mt-1.5 bg-paper border border-black p-2 font-mono text-xs focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleAddCat}
            className="punk-button bg-white text-black py-2.5 px-4 text-xs font-bold flex items-center justify-center sm:justify-start gap-1.5 hover:bg-zinc-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Cat</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="punk-button bg-accent text-white py-2.5 px-6 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>
              {isSubmitting ? "Saving..." : "Save & Open Dashboard ➔"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}