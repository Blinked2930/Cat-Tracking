"use client";

import React from "react";
import { PERSONALITY_LIST, PersonalityKey } from "@/lib/personalities";

export default function PersonalityPicker({
  value,
  onChange,
}: {
  value: PersonalityKey;
  onChange: (key: PersonalityKey) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-black uppercase text-ink-muted mb-1.5">
        Personality
      </label>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {PERSONALITY_LIST.map((p) => {
          const isSelected = p.key === value;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => onChange(p.key)}
              className={`relative p-1.5 border-2 flex flex-col items-center gap-1 transition-all ${
                isSelected
                  ? "bg-highlight border-black shadow-[2px_2px_0_0_var(--ink)]"
                  : "bg-white border-black/30 hover:border-black"
              }`}
              title={p.description}
            >
              <svg
                viewBox={p.viewBox}
                className="w-full h-auto max-w-[36px]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={p.path}
                  fill={isSelected ? "var(--ink)" : "var(--paper)"}
                  stroke="var(--ink)"
                  strokeWidth="6"
                  strokeLinejoin="miter"
                />
              </svg>
              <span
                className={`text-[8px] font-mono font-black uppercase leading-none truncate w-full text-center ${
                  isSelected ? "text-black" : "text-ink-muted"
                }`}
              >
                {p.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}