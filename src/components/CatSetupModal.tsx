"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MaskingTape, StampBadge, ZineStaple } from "./ZineDecorations";
import { Plus, Trash2, X, Sparkles, Cat } from "lucide-react";

interface RoutineDraft {
  title: string;
  type: "checkbox" | "counter";
  frequency: number;
}

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
  const [catName, setCatName] = useState("");
  const [routines, setRoutines] = useState<RoutineDraft[]>([
    { title: "Morning Feeding", type: "checkbox", frequency: 1 },
    { title: "Evening Wet Food", type: "checkbox", frequency: 1 },
    { title: "Clean Litter Box", type: "checkbox", frequency: 1 },
  ]);
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [newRoutineType, setNewRoutineType] = useState<"checkbox" | "counter">("checkbox");
  const [newRoutineFreq, setNewRoutineFreq] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  let createCatMutation: any = null;
  let createTaskMutation: any = null;
  try {
    createCatMutation = useMutation(api.cats.createCat);
    createTaskMutation = useMutation(api.tasks.createTask);
  } catch {
    // Dev fallback
  }

  if (!isOpen) return null;

  const addRoutine = () => {
    if (!newRoutineTitle.trim()) return;
    setRoutines([
      ...routines,
      {
        title: newRoutineTitle.trim(),
        type: newRoutineType,
        frequency: Math.max(1, newRoutineFreq),
      },
    ]);
    setNewRoutineTitle("");
    setNewRoutineFreq(1);
  };

  const removeRoutine = (index: number) => {
    setRoutines(routines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setIsSubmitting(true);
    try {
      if (createCatMutation && householdId.startsWith("mock-") === false) {
        const catId = await createCatMutation({
          householdId: householdId as any,
          name: catName.trim(),
        });

        for (const routine of routines) {
          await createTaskMutation({
            catId,
            title: routine.title,
            type: routine.type,
            frequency: routine.frequency,
          });
        }

        if (onCatCreated) {
          onCatCreated({
            _id: catId,
            name: catName.trim(),
            tasks: routines,
          });
        }
      } else {
        const mockCat = {
          _id: "cat-" + Date.now(),
          name: catName.trim(),
          tasks: routines.map((r, i) => ({
            _id: `task-${Date.now()}-${i}`,
            title: r.title,
            type: r.type,
            frequency: r.frequency,
            done: false,
          })),
        };
        if (onCatCreated) {
          onCatCreated(mockCat);
        }
      }
      onClose();
    } catch (err: any) {
      console.error("Error creating cat:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-paper border-4 border-black shadow-[10px_10px_0px_0px_var(--ink)] p-6 my-8">
        <div className="flex justify-between items-center mb-3">
          <ZineStaple />
          <MaskingTape text="INTAKE FORM // FELINE UNIT" className="-rotate-1" />
          <button
            onClick={onClose}
            className="w-7 h-7 bg-ink text-paper font-mono font-bold flex items-center justify-center hover:bg-accent transition-colors border-2 border-black"
          >
            ✕
          </button>
        </div>

        <div className="border-b-3 border-black pb-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <StampBadge text="NEW STRAY ENTRY" color="pink" />
            <span className="text-[10px] font-mono font-bold uppercase text-ink-muted">
              SQUAT ROSTER ADDITION
            </span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black">
            REGISTER HOUSEHOLD CAT
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono font-black uppercase text-black mb-1">
              CAT NAME // STREET MONIKER:
            </label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Iggy Pop, Sid, Lucifer"
              required
              className="w-full bg-white border-3 border-black p-3 font-mono font-bold text-sm text-black uppercase focus:outline-none focus:bg-[#D9F5F1] focus:border-accent shadow-[2px_2px_0_0_var(--ink)]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-black uppercase text-black mb-1 flex items-center justify-between">
              <span>DAILY ROUTINES &amp; MEDS ({routines.length}):</span>
              <span className="text-[10px] text-accent">RESETS AT MIDNIGHT</span>
            </label>

            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
              {routines.map((r, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-black p-2.5 flex items-center justify-between text-xs font-mono shadow-[2px_2px_0_0_var(--ink)]"
                >
                  <div>
                    <span className="font-bold text-black uppercase">{r.title}</span>
                    <div className="text-[10px] text-ink-muted flex gap-2">
                      <span className="uppercase">TYPE: {r.type}</span>
                      <span>•</span>
                      <span>FREQ: {r.frequency}x / DAY</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRoutine(index)}
                    className="text-red-600 hover:text-black p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-paper-card border-2 border-dashed border-black p-3 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-black block">
                + ADD CUSTOM CHORE / MEDICATION:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRoutineTitle}
                  onChange={(e) => setNewRoutineTitle(e.target.value)}
                  placeholder="e.g. Insulin, Eye Drops..."
                  className="flex-1 bg-white border-2 border-black p-1.5 text-xs font-mono font-bold uppercase focus:outline-none"
                />
                <select
                  value={newRoutineType}
                  onChange={(e) => setNewRoutineType(e.target.value as any)}
                  className="bg-white border-2 border-black p-1.5 text-xs font-mono font-bold"
                >
                  <option value="checkbox">CHECKBOX</option>
                  <option value="counter">COUNTER</option>
                </select>
                <button
                  type="button"
                  onClick={addRoutine}
                  className="punk-button bg-highlight text-black px-3 py-1 text-xs font-black"
                >
                  ADD
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="punk-button bg-white text-black py-3 px-4 text-xs flex-1"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !catName.trim()}
              className="punk-button bg-ink text-paper py-3 px-4 text-xs font-black flex-2 hover:bg-accent hover:text-white"
            >
              {isSubmitting ? "STAMPING ENTRY..." : "CREATE FELINE PROFILE ➔"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}