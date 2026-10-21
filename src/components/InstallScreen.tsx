"use client";

import React, { useState } from "react";
import {
    Smartphone,
    Apple,
    Share,
    PlusSquare,
    MoreVertical,
    MoreHorizontal,
    X,
    Check,
    Download,
} from "lucide-react";

export default function InstallScreen({
    onBypass,
}: {
    onBypass: () => void;
}) {
    const [device, setDevice] = useState<"ios" | "android" | null>(null);

    return (
        <div className="min-h-[100dvh] w-full bg-paper text-ink flex flex-col items-center justify-center p-5 sm:p-6 relative overflow-hidden font-mono">
            <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                    backgroundImage:
                        "radial-gradient(#1a1a1a 0.75px, transparent 0.75px), radial-gradient(#1a1a1a 0.75px, var(--paper) 0.75px)",
                    backgroundSize: "30px 30px",
                    backgroundPosition: "0 0, 15px 15px",
                }}
            />

            {!device ? (
                <div className="max-w-sm w-full space-y-7 relative z-10">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-highlight border-4 border-black shadow-[6px_6px_0_0_var(--ink)] flex items-center justify-center">
                            <Download className="w-9 h-9 text-black" strokeWidth={2.5} />
                        </div>
                    </div>

                    <div className="text-center space-y-3">
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black leading-none">
                            Install CatSync
                        </h1>
                        <p className="text-[13px] leading-relaxed text-ink-muted">
                            Add CatSync to your home screen for offline access and one-tap
                            launch — no app store needed.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <button
                            onClick={() => setDevice("ios")}
                            className="punk-button w-full bg-white text-black py-3.5 px-4 text-sm font-black flex items-center justify-center gap-2.5 hover:bg-paper-hover"
                        >
                            <Apple className="w-5 h-5" />
                            <span>I have an iPhone</span>
                        </button>
                        <button
                            onClick={() => setDevice("android")}
                            className="punk-button w-full bg-white text-black py-3.5 px-4 text-sm font-black flex items-center justify-center gap-2.5 hover:bg-paper-hover"
                        >
                            <Smartphone className="w-5 h-5" />
                            <span>I have an Android</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-sm bg-paper border-4 border-black shadow-[10px_10px_0_0_var(--ink)] relative z-10">
                    <div className="bg-ink text-paper px-3 py-2.5 flex items-center justify-between border-b-4 border-black">
                        <h2 className="text-sm font-black uppercase tracking-tight">
                            {device === "ios" ? "iOS Install" : "Android Install"}
                        </h2>
                        <button
                            onClick={() => setDevice(null)}
                            className="w-7 h-7 bg-paper text-ink flex items-center justify-center hover:bg-accent hover:text-white transition-colors border-2 border-black"
                            aria-label="Back"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="p-5 sm:p-6">
                        <div
                            className={`inline-block mb-5 px-2 py-1 border-2 border-black font-mono font-black text-[10px] uppercase tracking-widest ${device === "ios"
                                    ? "bg-accent text-white"
                                    : "bg-highlight text-black"
                                }`}
                        >
                            {device === "ios" ? "Use Safari" : "Use Chrome"}
                        </div>

                        <div className="space-y-3 mb-6">
                            {device === "ios" ? (
                                <>
                                    <InstallStep
                                        n={1}
                                        icon={<MoreHorizontal className="w-4 h-4" />}
                                    >
                                        Tap the <strong className="text-black">3-dot menu</strong>{" "}
                                        in Safari.
                                    </InstallStep>
                                    <InstallStep n={2} icon={<Share className="w-4 h-4" />}>
                                        Tap the <strong className="text-black">Share icon</strong>.
                                    </InstallStep>
                                    <InstallStep n={3} icon={<PlusSquare className="w-4 h-4" />}>
                                        Scroll down and tap{" "}
                                        <strong className="text-black">Add to Home Screen</strong>.
                                    </InstallStep>
                                    <InstallStep n={4} icon={<Check className="w-4 h-4" />}>
                                        Tap <strong className="text-black">Add</strong> in the top
                                        right.
                                    </InstallStep>
                                </>
                            ) : (
                                <>
                                    <InstallStep
                                        n={1}
                                        icon={<MoreVertical className="w-4 h-4" />}
                                    >
                                        Tap the <strong className="text-black">3-dot menu</strong>{" "}
                                        in Chrome.
                                    </InstallStep>
                                    <InstallStep n={2} icon={<PlusSquare className="w-4 h-4" />}>
                                        Scroll down and tap{" "}
                                        <strong className="text-black">Add to Home screen</strong>.
                                    </InstallStep>
                                    <InstallStep n={3} icon={<Check className="w-4 h-4" />}>
                                        Tap <strong className="text-black">Install</strong> on the
                                        popup.
                                    </InstallStep>
                                </>
                            )}
                        </div>

                        <button
                            onClick={() => setDevice(null)}
                            className="w-full bg-white text-black border-2 border-black py-2.5 text-xs font-mono font-black uppercase hover:bg-paper-hover"
                        >
                            Back
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={onBypass}
                className="mt-8 text-[10px] font-mono font-bold text-ink-muted hover:text-black transition-colors uppercase tracking-widest underline underline-offset-4 relative z-10"
            >
                Continue in browser
            </button>
        </div>
    );
}

function InstallStep({
    n,
    icon,
    children,
}: {
    n: number;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-2.5 bg-white border-2 border-black p-2.5 shadow-[2px_2px_0_0_var(--ink)]">
            <span className="w-6 h-6 bg-highlight text-black border-2 border-black font-mono font-black text-xs flex items-center justify-center shrink-0">
                {n}
            </span>
            <div className="flex items-start gap-2 min-w-0 flex-1">
                <span className="text-accent shrink-0 mt-0.5">{icon}</span>
                <p className="text-xs font-mono text-black leading-snug">{children}</p>
            </div>
        </div>
    );
}