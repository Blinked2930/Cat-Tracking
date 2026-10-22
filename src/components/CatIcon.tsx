"use client";

import React, { useId } from "react";
import { StampBadge } from "./ZineDecorations";
import { getPersonality } from "@/lib/personalities";

interface CatIconProps {
  catName: string;
  personality?: string;
  completionPercentage: number;
  completedCount: number;
  totalRequired: number;
  photoUrl?: string;
  className?: string;
}

export default function CatIcon({
  catName,
  personality,
  completionPercentage,
  completedCount,
  totalRequired,
  photoUrl,
  className = "",
}: CatIconProps) {
  const uniqueId = useId().replace(/:/g, "_");
  const pct = Math.max(0, Math.min(100, Math.round(completionPercentage)));
  const p = getPersonality(personality);

  const baseHeight = 270;
  const fillHeight = (baseHeight * pct) / 100;

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <div className="relative w-full max-w-[280px] aspect-[200/310] flex items-center justify-center p-2">
        <svg
          viewBox={p.viewBox}
          className="w-full h-full filter drop-shadow-[4px_4px_0px_var(--ink)] overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id={`cat-clip-${uniqueId}`}>
              <path d={p.path} fill="#000" />
            </clipPath>

            <pattern
              id={`ink-scribble-${uniqueId}`}
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(24)"
            >
              <rect width="40" height="40" fill="var(--ink)" />
              <line x1="0" y1="4" x2="40" y2="8" stroke="#1f1f1f" strokeWidth="2.5" />
              <line x1="2" y1="14" x2="38" y2="18" stroke="#000000" strokeWidth="3" />
              <line x1="0" y1="24" x2="40" y2="28" stroke="#2a2a2a" strokeWidth="2" />
              <line x1="4" y1="34" x2="36" y2="38" stroke="#141414" strokeWidth="3.5" />
              <line
                x1="6"
                y1="0"
                x2="14"
                y2="40"
                stroke={p.accent}
                strokeWidth="1"
                strokeOpacity="0.4"
              />
              <line
                x1="26"
                y1="0"
                x2="34"
                y2="40"
                stroke="var(--highlight)"
                strokeWidth="0.8"
                strokeOpacity="0.3"
              />
              <circle cx="10" cy="10" r="1.5" fill="var(--paper)" opacity="0.3" />
              <circle cx="28" cy="24" r="1.2" fill="var(--paper)" opacity="0.35" />
              <circle cx="18" cy="32" r="1.8" fill="var(--paper)" opacity="0.25" />
            </pattern>

            <pattern
              id={`paper-speckle-${uniqueId}`}
              width="12"
              height="12"
              patternUnits="userSpaceOnUse"
            >
              <rect width="12" height="12" fill="var(--paper)" />
              <circle cx="2" cy="2" r="0.75" fill="#3a3a3a" opacity="0.15" />
              <circle cx="8" cy="8" r="0.75" fill="#3a3a3a" opacity="0.15" />
            </pattern>
          </defs>

          <g clipPath={`url(#cat-clip-${uniqueId})`}>
            <rect
              x="0"
              y="0"
              width="200"
              height="310"
              fill={`url(#paper-speckle-${uniqueId})`}
            />

            {photoUrl && (
              <image
                href={photoUrl}
                x="20"
                y="50"
                width="160"
                height="220"
                preserveAspectRatio="xMidYMid slice"
                opacity="0.18"
                className="filter grayscale contrast-200"
              />
            )}

            <g
              className="transition-all duration-700 ease-out"
              style={{
                transform: `translateY(${290 - fillHeight}px)`,
                transformOrigin: "bottom",
              }}
            >
              <rect
                x="0"
                y="0"
                width="200"
                height="310"
                fill={`url(#ink-scribble-${uniqueId})`}
              />
              <path
                d="M 0 0 L 25 -4 L 50 3 L 75 -6 L 100 2 L 125 -5 L 150 4 L 175 -3 L 200 0 L 200 8 L 0 8 Z"
                fill={p.accent}
                opacity="0.9"
              />
              <path
                d="M 0 2 L 30 -2 L 60 4 L 90 -4 L 120 3 L 150 -3 L 180 4 L 200 1"
                stroke="var(--highlight)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </g>

          {/* Outline */}
          <path
            d={p.path}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="5.5"
            strokeLinejoin="miter"
            strokeMiterlimit="4"
          />

          {/* Personality eyes and features */}
          <g dangerouslySetInnerHTML={{ __html: p.eyes }} />
        </svg>

        {pct === 100 && (
          <div className="absolute inset-0 flex items-center justify-center p-2 z-20 pointer-events-none animate-in fade-in zoom-in duration-300">
            <StampBadge
              text="ALL CHORES COMPLETE!"
              color="pink"
              rotation="-rotate-6"
              className="text-xs sm:text-sm px-4 py-2 border-4 border-black shadow-[5px_5px_0_0_var(--highlight)]"
            />
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2 font-mono text-xs">
        <span className="font-bold bg-ink text-paper px-2.5 py-0.5 border border-black shadow-[2px_2px_0_0_var(--highlight)]">
          {pct}%
        </span>
        <span className="font-bold text-ink-muted">
          {completedCount}/{totalRequired} done
        </span>
      </div>
    </div>
  );
}