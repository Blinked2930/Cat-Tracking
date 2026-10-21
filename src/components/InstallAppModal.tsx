"use client";

import React, { useEffect, useState } from "react";
import {
    X,
    Smartphone,
    Apple,
    Share,
    PlusSquare,
    MoreVertical,
    MoreHorizontal,
    Check,
    Download,
} from "lucide-react";

export default function InstallAppModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [device, setDevice] = useState<"ios" | "android" | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    // Reset device picker whenever the modal closes
    useEffect(() => {
        if (!isOpen) setDevice(null);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-paper border-4 border-black shadow-[10px_10px_0px_0px_var(--ink)] my-4 sm:my-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header bar */}
                <div className="bg-ink text-paper px-4 py-3 border-b-4 border-black flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Download className="w-4 h-4 text-highlight" />
                        <h2 className="font-mono font-black uppercase text-sm tracking-tight">
                            {device ? "Install Steps" : "Install App"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 bg-paper text-ink flex items-center justify-center hover:bg-accent hover:text-white transition-colors border-2 border-black"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 sm:p-6">
                    {!device ? (
                        <>
                            {/* Icon */}
                            <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-highlight border-3 border-black shadow-[4px_4px_0_0_var(--ink)] flex items-center justify-center">
                                    <Smartphone className="w-8 h-8 text-black" />
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <h3 className="font-mono font-black uppercase text-lg text-black tracking-tight mb-1">
                                    Add to Home Screen
                                </h3>
                                <p className="text-xs font-mono text-ink-muted leading-relaxed">
                                    Install StraySync for offline access and one-tap launch. Pick
                                    your device.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2.5">
                                <button
                                    onClick={() => setDevice("ios")}
                                    className="punk-button w-full bg-white text-black py-3 px-4 text-xs font-black flex items-center justify-center gap-2 hover:bg-paper-hover"
                                >
                                    <Apple className="w-4 h-4" />
                                    <span>iPhone / iPad</span>
                                </button>
                                <button
                                    onClick={() => setDevice("android")}
                                    className="punk-button w-full bg-white text-black py-3 px-4 text-xs font-black flex items-center justify-center gap-2 hover:bg-paper-hover"
                                >
                                    <Smartphone className="w-4 h-4" />
                                    <span>Android</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Step list header */}
                            <div className="mb-4">
                                <p
                                    className={`inline-block font-mono font-black uppercase tracking-widest text-[10px] px-2 py-1 border-2 border-black ${device === "ios"
                                            ? "bg-accent text-white"
                                            : "bg-highlight text-black"
                                        }`}
                                >
                                    {device === "ios"
                                        ? "Use Safari"
                                        : "Use Chrome"}
                                </p>
                                <h3 className="font-mono font-black uppercase text-lg text-black tracking-tight mt-2">
                                    {device === "ios" ? "iOS Install" : "Android Install"}
                                </h3>
                            </div>

                            {/* Steps */}
                            <div className="space-y-3 mb-6">
                                {device === "ios" ? (
                                    <>
                                        <Step
                                            icon={<MoreHorizontal className="w-4 h-4" />}
                                            n={1}
                                        >
                                            Tap the <strong className="text-black">3-dot menu</strong>{" "}
                                            in Safari.
                                        </Step>
                                        <Step icon={<Share className="w-4 h-4" />} n={2}>
                                            Tap the <strong className="text-black">Share icon</strong>.
                                        </Step>
                                        <Step icon={<PlusSquare className="w-4 h-4" />} n={3}>
                                            Scroll down and tap{" "}
                                            <strong className="text-black">Add to Home Screen</strong>.
                                        </Step>
                                        <Step icon={<Check className="w-4 h-4" />} n={4}>
                                            Tap <strong className="text-black">Add</strong> in the top
                                            right.
                                        </Step>
                                    </>
                                ) : (
                                    <>
                                        <Step
                                            icon={<MoreVertical className="w-4 h-4" />}
                                            n={1}
                                        >
                                            Tap the <strong className="text-black">3-dot menu</strong>{" "}
                                            in Chrome.
                                        </Step>
                                        <Step icon={<PlusSquare className="w-4 h-4" />} n={2}>
                                            Scroll down and tap{" "}
                                            <strong className="text-black">Add to Home screen</strong>.
                                        </Step>
                                        <Step icon={<Check className="w-4 h-4" />} n={3}>
                                            Tap <strong className="text-black">Install</strong> on the
                                            popup.
                                        </Step>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => setDevice(null)}
                                className="punk-button w-full bg-white text-black py-2.5 px-4 text-xs font-black hover:bg-paper-hover"
                            >
                                Back
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function Step({
    icon,
    n,
    children,
}: {
    icon: React.ReactNode;
    n: number;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 bg-white border-2 border-black p-2.5 shadow-[2px_2px_0_0_var(--ink)]">
            <span className="w-6 h-6 bg-highlight text-black border border-black font-mono font-black text-xs flex items-center justify-center shrink-0">
                {n}
            </span>
            <div className="flex items-start gap-2 min-w-0 flex-1">
                <span className="text-accent shrink-0 mt-0.5">{icon}</span>
                <p className="text-xs font-mono text-black leading-snug">{children}</p>
            </div>
        </div>
    );
}