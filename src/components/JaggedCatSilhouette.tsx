"use client";

import React, { useId } from "react";
import { StampBadge } from "./ZineDecorations";

interface JaggedCatSilhouetteProps {
  catName: string;
  completionPercentage: number;
  completedCount: number;
  totalRequired: number;
  photoUrl?: string;
  className?: string;
}

export default function JaggedCatSilhouette({
  catName,
  completionPercentage,
  completedCount,
  totalRequired,
  photoUrl,
  className = "",
}: JaggedCatSilhouetteProps) {
  const uniqueId = useId().replace(/:/g, "_");
  const pct = Math.max(0, Math.min(100, Math.round(completionPercentage)));

  const baseHeight = 270;
  const fillHeight = (baseHeight * pct) / 100;

  const catSilhouettePath = `
    M 100 85
    L 125 22
    L 142 82
    L 172 108
    L 158 135
    L 182 155
    L 162 180
    L 178 215
    L 180 290
    L 20 290
    L 22 215
    L 38 180
    L 18 155
    L 42 135
    L 28 108
    L 58 82
    L 75 22
    Z
  `;

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <div className="relative w-full max-w-[280px] aspect-[200/310] flex items-center justify-center p-2">
        <svg
          viewBox="0 0 200 310"
          className="w-full h-full filter drop-shadow-[4px_4px_0px_var(--ink)] overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id={`cat-clip-${uniqueId}`}>
              <path d={catSilhouettePath} fill="#000" />
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
              <line x1="6" y1="0" x2="14" y2="40" stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.4" />
              <line x1="26" y1="0" x2="34" y2="40" stroke="var(--highlight)" strokeWidth="0.8" strokeOpacity="0.3" />
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
            <rect x="0" y="0" width="200" height="310" fill={`url(#paper-speckle-${uniqueId})`} />

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
                fill="var(--accent)"
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

          <path
            d={catSilhouettePath}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="5.5"
            strokeLinejoin="miter"
            strokeMiterlimit="4"
          />

          <g stroke="var(--ink)" strokeWidth="4.5" strokeLinecap="square">
            <line x1="5" y1="165" x2="42" y2="168" />
            <line x1="2" y1="185" x2="45" y2="182" />
            <line x1="8" y1="205" x2="38" y2="198" />
            <line x1="195" y1="165" x2="158" y2="168" />
            <line x1="198" y1="185" x2="155" y2="182" />
            <line x1="192" y1="205" x2="162" y2="198" />
          </g>

          <g className="transition-transform duration-300 hover:rotate-3">
            <line x1="62" y1="52" x2="82" y2="38" stroke="var(--highlight)" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="62" cy="52" r="5" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="2.5" />
            <circle cx="82" cy="38" r="3.5" fill="var(--ink)" />
          </g>

          <g className="mix-blend-difference">
            <polygon points="68,125 90,136 78,148" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="2.5" />
            <polygon points="132,125 110,136 122,148" fill="var(--highlight)" stroke="var(--ink)" strokeWidth="2.5" />
            <line x1="79" y1="128" x2="79" y2="145" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
            <line x1="121" y1="128" x2="121" y2="145" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
          </g>

          <polygon points="100,165 92,175 108,175" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
          <line x1="100" y1="175" x2="100" y2="188" stroke="var(--ink)" strokeWidth="3" />
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