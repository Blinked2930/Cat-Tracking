"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function PunkDropdown<T extends string | number>({
    value,
    onChange,
    options,
    className = "",
    buttonClassName = "",
    placeholder = "—",
}: {
    value: T;
    onChange: (value: T) => void;
    options: ReadonlyArray<{ value: T; label: string }>;
    className?: string;
    buttonClassName?: string;
    placeholder?: string;
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
                className={`w-full bg-white border-2 border-black px-2 py-1 text-xs font-mono font-bold text-black flex items-center justify-between gap-1 hover:bg-paper ${buttonClassName}`}
            >
                <span className="truncate">{selected?.label ?? placeholder}</span>
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