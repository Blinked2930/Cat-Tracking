"use client";

import React, { useEffect, useRef, useState } from "react";

interface TaskNoteModalProps {
    isOpen: boolean;
    taskTitle: string;
    catName: string;
    onSkip: () => void;
    onSave: (notes: string) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export default function TaskNoteModal({
    isOpen,
    taskTitle,
    catName,
    onSkip,
    onSave,
    onCancel,
    isSubmitting = false,
}: TaskNoteModalProps) {
    const [notes, setNotes] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setNotes("");
            // Focus the textarea shortly after mount so the modal animation feels smooth
            const t = setTimeout(() => textareaRef.current?.focus(), 50);
            return () => clearTimeout(t);
        }
    }, [isOpen, taskTitle]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSubmitting) onCancel();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, isSubmitting, onCancel]);

    if (!isOpen) return null;

    const handleSkip = () => {
        onSkip();
    };

    const handleSave = () => {
        onSave(notes);
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
            onClick={() => !isSubmitting && onCancel()}
        >
            <div
                className="relative w-full max-w-md bg-paper border-4 border-black shadow-[8px_8px_0px_0px_var(--ink)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-ink text-paper px-4 py-2.5 border-b-4 border-black flex items-center justify-between">
                    <h2 className="font-mono font-black uppercase text-xs tracking-wider">
                        Complete Task
                    </h2>
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="w-6 h-6 bg-paper text-ink flex items-center justify-center hover:bg-accent hover:text-white transition-colors border-2 border-black disabled:opacity-50"
                        aria-label="Cancel"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-4 sm:p-5">
                    <div className="mb-3">
                        <p className="text-[10px] font-mono font-bold uppercase text-ink-muted mb-0.5">
                            {catName}
                        </p>
                        <p className="text-sm font-mono font-black uppercase text-black leading-tight">
                            {taskTitle}
                        </p>
                    </div>

                    <label className="block text-[10px] font-mono font-black uppercase text-ink-muted mb-1.5">
                        Add a note (optional)
                    </label>
                    <textarea
                        ref={textareaRef}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. ate slowly, seemed tired, gave with wet food…"
                        rows={3}
                        maxLength={500}
                        disabled={isSubmitting}
                        className="w-full bg-white border-2 border-black p-2 font-mono text-xs text-black focus:outline-none focus:border-accent resize-none disabled:opacity-50"
                    />
                    <p className="text-[9px] font-mono text-ink-muted text-right mt-1">
                        {notes.length}/500
                    </p>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
                        <button
                            type="button"
                            onClick={handleSkip}
                            disabled={isSubmitting}
                            className="punk-button flex-1 bg-white text-black py-2.5 px-4 text-xs font-bold disabled:opacity-50"
                        >
                            Skip
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="punk-button flex-1 bg-accent text-white py-2.5 px-4 text-xs font-bold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Saving…" : notes.trim() ? "Save & Complete" : "Complete"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}