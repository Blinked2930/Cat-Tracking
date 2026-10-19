"use client";

import React, { useState } from "react";
import OnboardingFlow from "@/components/OnboardingFlow";
import HouseholdSetupFlow from "@/components/HouseholdSetupFlow";
import CatDashboard from "@/components/CatDashboard";
import { LayoutDashboard, FileText, Settings } from "lucide-react";

export default function Home() {
  const [activeView, setActiveView] = useState<"onboarding" | "setup" | "dashboard">("dashboard");
  const [activeHousehold, setActiveHousehold] = useState<{
    id: string;
    name: string;
    inviteCode: string;
  }>({
    id: "squat-bedford",
    name: "THE NO-WAVE SQUAT",
    inviteCode: "PUNK69",
  });

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#0d0d0d] flex flex-col justify-between selection:bg-[#ff2a85] selection:text-white pb-8">
      {/* Sleek Minimal Header */}
      <header className="w-full bg-[#0d0d0d] text-[#f4f1ea] border-b-4 border-black py-3 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 bg-[#ff2a85] text-white flex items-center justify-center font-black text-sm border-2 border-white shadow-[2px_2px_0_0_#ffe600]">
              🐾
            </span>
            <span className="font-black tracking-tight text-lg uppercase text-white">
              STRAYSYNC
            </span>
          </div>

          {/* Clean Segmented Control */}
          <nav className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveView("dashboard")}
              className={`px-3 py-1 font-bold border-2 transition-all flex items-center gap-1.5 ${activeView === "dashboard"
                ? "bg-[#ffe600] text-black border-black shadow-[2px_2px_0_0_#ff2a85]"
                : "bg-black text-[#f4f1ea] border-transparent hover:border-zinc-700"
                }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>DASHBOARD</span>
            </button>

            <button
              onClick={() => setActiveView("setup")}
              className={`px-3 py-1 font-bold border-2 transition-all flex items-center gap-1.5 ${activeView === "setup"
                ? "bg-[#ffe600] text-black border-black shadow-[2px_2px_0_0_#ff2a85]"
                : "bg-black text-[#f4f1ea] border-transparent hover:border-zinc-700"
                }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>SETUP</span>
            </button>

            <button
              onClick={() => setActiveView("onboarding")}
              className={`px-3 py-1 font-bold border-2 transition-all flex items-center gap-1.5 ${activeView === "onboarding"
                ? "bg-[#ffe600] text-black border-black shadow-[2px_2px_0_0_#ff2a85]"
                : "bg-black text-[#f4f1ea] border-transparent hover:border-zinc-700"
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>JOIN / SQUAT</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeView === "onboarding" && (
          <section className="max-w-xl mx-auto">
            <OnboardingFlow
              onEnterDashboard={(hh) => {
                setActiveHousehold(hh);
                setActiveView("dashboard");
              }}
            />
          </section>
        )}

        {activeView === "setup" && (
          <section>
            <HouseholdSetupFlow
              householdId={activeHousehold.id}
              householdName={activeHousehold.name}
              inviteCode={activeHousehold.inviteCode}
              onComplete={(catsData) => {
                setActiveView("dashboard");
              }}
            />
          </section>
        )}

        {activeView === "dashboard" && (
          <section>
            <CatDashboard
              householdId={activeHousehold.id}
              householdName={activeHousehold.name}
              inviteCode={activeHousehold.inviteCode}
              userName="Emmett"
              onLeaveHousehold={() => setActiveView("onboarding")}
            />
          </section>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t-2 border-black/20 pt-4 px-4 text-center">
        <p className="text-[11px] font-mono font-bold text-[#777] uppercase tracking-wide">
          STRAYSYNC • REAL-TIME CAT CARE FOR ROOMMATES
        </p>
      </footer>
    </div>
  );
}
