"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Plus,
  Trash2,
  Upload,
  Code,
} from "lucide-react";

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
  // -------- Hooks at the top, unconditionally --------
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

  // -------- Handlers --------
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

  // -------- Render --------
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="border-b-3 border-black pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            ADD HOUSEHOLD CATS
          </h2>
          <p className="text-xs font-mono text-[#555] mt-1">
            Register your cats and their daily care routines.
          </p>
        </div>

        <div className="text-xs font-mono font-bold text-[#555]">
          HOUSEHOLD:{" "}
          <span className="text-black font-mono font-bold">{householdName}</span>
          {" • "}
          <span className="text-black font-mono font-bold">{inviteCode}</span>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-5 p-3 border-2 border-black text-xs font-mono font-bold flex items-center justify-between ${statusMessage.type === "error"
              ? "bg-[#ff2a85] text-white"
              : "bg-[#ffe600] text-black"
            }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {cats.map((cat, catIdx) => (
          <div
            key={cat.id}
            className="bg-[#faf8f5] border-3 border-black p-5 shadow-[4px_4px_0px_0px_#0d0d0d] space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-black/20 pb-3">
              <span className="font-mono font-black text-base uppercase text-black">
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

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <label className="block text-xs font-mono font-bold uppercase text-black mb-1">
                  Cat Name
                </label>
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => handleUpdateCatName(cat.id, e.target.value)}
                  placeholder="e.g. Iggy Pop, Dexter"
                  required
                  className="w-full bg-white border-2 border-black p-2.5 font-mono font-bold text-sm text-black uppercase focus:outline-none focus:border-[#ff2a85]"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-mono font-bold uppercase text-black mb-1">
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
                    <label className="cursor-pointer text-xs font-mono font-bold text-[#555] hover:text-black flex items-center gap-1">
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

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase text-black">
                  Daily Routines
                </span>
                <button
                  type="button"
                  onClick={() => handleAddTask(cat.id)}
                  className="text-xs font-mono font-bold text-black hover:text-[#ff2a85] flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Chore</span>
                </button>
              </div>

              <div className="space-y-2">
                {cat.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white border-2 border-black p-3 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
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
                        className="w-full sm:flex-1 bg-[#f4f1ea] border border-black p-1.5 font-mono text-xs font-bold uppercase focus:outline-none"
                      />

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="flex border border-black text-xs font-mono">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateTask(cat.id, task.id, {
                                type: "checkbox",
                              })
                            }
                            className={`px-2 py-0.5 font-bold ${task.type === "checkbox"
                                ? "bg-black text-white"
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
                            className={`px-2 py-0.5 font-bold border-l border-black ${task.type === "counter"
                                ? "bg-black text-[#ffe600]"
                                : "bg-white text-black"
                              }`}
                          >
                            Counter
                          </button>
                        </div>

                        <select
                          value={task.frequency}
                          onChange={(e) =>
                            handleUpdateTask(cat.id, task.id, {
                              frequency: Number(e.target.value),
                            })
                          }
                          className="border border-black bg-white p-1 text-xs font-mono font-bold"
                        >
                          <option value={1}>1x / day</option>
                          <option value={2}>2x / day</option>
                          <option value={3}>3x / day</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleRemoveTask(cat.id, task.id)}
                          className="p-1 text-red-600 hover:text-black"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateTask(cat.id, task.id, {
                            isConfigOpen: !task.isConfigOpen,
                          })
                        }
                        className="text-[10px] font-mono text-zinc-500 hover:text-black font-bold flex items-center gap-1"
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
                          className="w-full mt-1.5 bg-[#f4f1ea] border border-black p-2 font-mono text-xs focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleAddCat}
            className="punk-button bg-white text-black py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-100"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Cat</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="punk-button bg-[#ff2a85] text-white py-2.5 px-6 text-xs font-bold flex items-center gap-1.5 hover:bg-[#e01e72]"
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