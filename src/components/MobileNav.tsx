"use client";

import React, { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active: boolean;
  disabled?: boolean;
}

export default function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden w-9 h-9 bg-black text-paper border-2 border-zinc-700 flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute top-0 right-0 w-64 h-full bg-ink text-paper border-l-4 border-black p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-zinc-700">
              <span className="font-mono font-black text-sm uppercase">
                Menu
              </span>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 bg-paper text-ink font-mono font-bold flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick();
                    setOpen(false);
                  }
                }}
                disabled={item.disabled}
                className={`w-full py-3 px-3 font-mono font-bold text-xs uppercase flex items-center gap-2 border-2 ${
                  item.active
                    ? "bg-highlight text-black border-black"
                    : "bg-black text-paper border-zinc-700 hover:border-zinc-500 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
