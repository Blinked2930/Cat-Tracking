"use client";

import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import { Check, ChevronDown, Plus, Trash2, X } from "lucide-react";

export default function DisplayNameDropdown() {
  const { user: clerkUser } = useUser();
  const currentUserData = useQuery(
    api.users.currentUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  const setActiveName = useMutation(api.users.setActiveName);
  const addSavedName = useMutation(api.users.addSavedName);
  const removeSavedName = useMutation(api.users.removeSavedName);

  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setIsAdding(false);
        setNewName("");
        setError(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setIsAdding(false);
        setNewName("");
        setError(null);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!clerkUser) return null;

  const activeName = currentUserData?.name ?? "Roommate";
  const savedNames: string[] = currentUserData?.savedNames ?? [];

  const handleSwitch = async (name: string) => {
    if (name === activeName) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await setActiveName({ clerkId: clerkUser.id, name });
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || "Could not switch name");
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) return;
    setBusy(true);
    setError(null);
    try {
      await addSavedName({ clerkId: clerkUser.id, name: clean });
      setNewName("");
      setIsAdding(false);
      setOpen(false);
    } catch (err: any) {
      setError(err?.message || "Could not add name");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (name: string) => {
    if (name === activeName) return; // disabled in UI anyway
    setBusy(true);
    setError(null);
    try {
      await removeSavedName({ clerkId: clerkUser.id, name });
    } catch (err: any) {
      setError(err?.message || "Could not remove name");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2.5 py-1 text-xs font-mono font-bold text-paper border-2 border-transparent hover:border-zinc-700 flex items-center gap-1.5 max-w-[180px]"
      >
        <span className="truncate">{activeName}</span>
        <ChevronDown
          className={`w-3 h-3 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-paper border-3 border-black shadow-[4px_4px_0_0_var(--ink)]">
          <div className="p-2 border-b-2 border-black/20">
            <p className="text-[10px] font-mono font-black uppercase text-ink-muted">
              Display as
            </p>
          </div>

          <div className="max-h-56 overflow-y-auto">
            {savedNames.length === 0 && (
              <p className="px-3 py-2 text-[11px] font-mono text-ink-muted">
                No saved names yet. Add one below.
              </p>
            )}

            {savedNames.map((name) => {
              const isActive = name === activeName;
              return (
                <div
                  key={name}
                  className={`flex items-center justify-between gap-1 px-2 py-1.5 border-b border-black/10 last:border-b-0 ${
                    isActive ? "bg-highlight/40" : "hover:bg-paper-hover"
                  }`}
                >
                  <button
                    onClick={() => handleSwitch(name)}
                    disabled={busy}
                    className="flex-1 text-left text-xs font-mono font-bold text-black truncate flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isActive && <Check className="w-3 h-3 shrink-0" />}
                    <span className={isActive ? "" : "ml-[18px]"}>{name}</span>
                  </button>
                  {!isActive && (
                    <button
                      onClick={() => handleRemove(name)}
                      disabled={busy}
                      className="p-1 text-red-600 hover:text-black disabled:opacity-50 shrink-0"
                      aria-label={`Remove ${name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="px-2 py-1.5 text-[10px] font-mono font-bold bg-accent text-white border-t-2 border-black">
              {error}
            </div>
          )}

          {isAdding ? (
            <form
              onSubmit={handleAdd}
              className="p-2 border-t-2 border-black space-y-1.5"
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New name"
                autoFocus
                maxLength={40}
                className="w-full bg-white border-2 border-black px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-accent"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewName("");
                    setError(null);
                  }}
                  disabled={busy}
                  className="flex-1 bg-white border-2 border-black py-1 text-[10px] font-mono font-black uppercase disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !newName.trim()}
                  className="flex-1 bg-highlight border-2 border-black py-1 text-[10px] font-mono font-black uppercase disabled:opacity-50"
                >
                  {busy ? "…" : "Add"}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full p-2 border-t-2 border-black text-[11px] font-mono font-black uppercase text-black hover:bg-highlight/40 flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add new name
            </button>
          )}
        </div>
      )}
    </div>
  );
}