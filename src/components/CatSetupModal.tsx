"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import PunkDropdown from "./PunkDropdown";
import PersonalityPicker from "./PersonalityPicker";
import { DEFAULT_PERSONALITY, PersonalityKey } from "@/lib/personalities";
import { Plus, Trash2, X } from "lucide-react";

interface RoutineDraft {
  title: string;
  type: "checkbox" | "counter";
  frequency: number;
}

const TASK_TYPES = [
  { value: "checkbox", label: "Checkbox" },
  { value: "counter", label: "Counter" },
] as const;

const FREQ_OPTIONS = [1, 2, 3, 4, 5] as const;

export default function CatSetupModal({
  householdId,
  isOpen,
  onClose,
  onCatCreated,
}: {
  householdId: string;
  isOpen: boolean;
  onClose: () => void;
  onCatCreated?: (cat: any) => void;
}) {
  const createCatMutation = useMutation(api.cats.createCat);
  const createTaskMutation = useMutation(api.tasks.createTask);

  const [catName, setCatName] = useState("");
  const [personality, setPersonality] = useState<PersonalityKey>(
    DEFAULT_PERSONALITY
  );
  const [routines, setRoutines] = useState<RoutineDraft[]>([
    { title: "Morning Feeding", type: "checkbox", frequency: 1 },
    { title: "Evening Wet Food", type: "checkbox", frequency: 1 },
  ]);
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [newRoutineType, setNewRoutineType] = useState<"checkbox" | "counter">(
    "checkbox"
  );
  const [newRoutineFreq, setNewRoutineFreq] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (newRoutineType === "checkbox" && newRoutineFreq !== 1) {
      setNewRoutineFreq(1);
    }
  }, [newRoutineType, newRoutineFreq]);

  const addRoutine = () => {
    if (!newRoutineTitle.trim()) return;
    setRoutines([
      ...routines,
      {
        title: newRoutineTitle.trim(),
        type: newRoutineType,
        frequency:
          newRoutineType === "checkbox" ? 1 : Math.max(1, newRoutineFreq),
      },
    ]);
    setNewRoutineTitle("");
    setNewRoutineFreq(1);
    setNewRoutineType("checkbox");
  };

  const removeRoutine = (index: number) => {
    setRoutines(routines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const catId = await createCatMutation({
        householdId: householdId as any,
        name: catName.trim(),
        personality,
      });

      for (const routine of routines) {
        await createTaskMutation({
          catId,
          title: routine.title,
          type: routine.type,
          frequency:
            routine.type === "checkbox" ? 1 : routine.frequency,
        });
      }

      onCatCreated?.({
        _id: catId,
        name: catName.trim(),
        personality,
        tasks: routines,
      });

      setCatName("");
      setPersonality(DEFAULT_PERSONALITY);
      setRoutines([
        { title: "Morning Feeding", type: "checkbox", frequency: 1 },
        { title: "Evening Wet Food", type: "checkbox", frequency: 1 },
      ]);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Could not create cat");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={() => !isSubmitting && onClose()}
    >
      <div
        className="relative w-full max-w-lg bg-paper border-4 border-black shadow-[10px_10px_0px_0px_var(--ink)] p-5 sm:p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b-3 border-black">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
            New Cat
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-7 h-7 bg-ink text-paper font-mono font-bold flex items-center justify-center hover:bg-accent transition-colors border-2 border-black disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono font-black uppercase text-ink-muted mb-1">
              Cat Name
            </label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Iggy"
              required
              autoFocus
              className="w-full bg-white border-3 border-black p-3 font-mono font-bold text-sm text-black focus:outline-none focus:border-accent"
            />
          </div>

          <PersonalityPicker value={personality} onChange={setPersonality} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-mono font-black uppercase text-ink-muted">
                Daily Routines ({routines.length})
              </label>
            </div>

            {routines.length > 0 && (
              <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto pr-1">
                {routines.map((r, index) => (
                  <div
                    key={index}
                    className="bg-white border-2 border-black p-2.5 flex items-center justify-between gap-2 text-xs font-mono shadow-[2px_2px_0_0_var(--ink)]"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-black uppercase truncate">
                        {r.title}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        {r.type === "counter" ? "Counter" : "Checkbox"} ·{" "}
                        {r.type === "checkbox"
                          ? "1x/day"
                          : `${r.frequency}x/day`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRoutine(index)}
                      className="text-red-600 hover:text-black p-1 shrink-0"
                      aria-label="Remove routine"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-paper-card border-2 border-dashed border-black p-3 space-y-2">
              <input
                type="text"
                value={newRoutineTitle}
                onChange={(e) => setNewRoutineTitle(e.target.value)}
                placeholder="Add a chore or medication…"
                className="w-full bg-white border-2 border-black p-2 text-xs font-mono font-bold focus:outline-none focus:border-accent"
              />
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7">
                  <PunkDropdown
                    value={newRoutineType}
                    onChange={(v) => setNewRoutineType(v)}
                    options={TASK_TYPES}
                  />
                </div>
                {newRoutineType === "counter" && (
                  <div className="sm:col-span-3">
                    <PunkDropdown
                      value={newRoutineFreq}
                      onChange={(v) => setNewRoutineFreq(v)}
                      options={FREQ_OPTIONS.map((f) => ({
                        value: f,
                        label: `${f}x`,
                      }))}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={addRoutine}
                  disabled={!newRoutineTitle.trim()}
                  className={`punk-button bg-highlight text-black px-3 py-1.5 text-xs font-black flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    newRoutineType === "counter"
                      ? "sm:col-span-2"
                      : "sm:col-span-5"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-2 border-2 border-black bg-accent text-white text-xs font-mono font-bold">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="punk-button flex-1 bg-white text-black py-2.5 px-4 text-xs font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !catName.trim()}
              className="punk-button flex-1 bg-ink text-paper py-2.5 px-4 text-xs font-black hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving…" : "Create Cat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}