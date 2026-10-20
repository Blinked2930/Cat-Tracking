"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import OnboardingFlow from "@/components/OnboardingFlow";
import HouseholdSetupFlow from "@/components/HouseholdSetupFlow";
import CatDashboard from "@/components/CatDashboard";
import { LayoutDashboard, FileText, Settings, LogOut } from "lucide-react";

interface ActiveHousehold {
  id: string;
  name: string;
  inviteCode: string;
}

export default function Home() {
  const { user: clerkUser } = useUser();
  const leaveHouseholdMutation = useMutation(api.households.leaveHousehold);

  const [activeView, setActiveView] = useState<
    "onboarding" | "setup" | "dashboard"
  >("onboarding");
  const [activeHousehold, setActiveHousehold] =
    useState<ActiveHousehold | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const goToDashboard = () => {
    if (activeHousehold) setActiveView("dashboard");
  };

  const handleLeaveHousehold = async () => {
    if (!clerkUser?.id) {
      setLeaveError("You need to be signed in to leave.");
      return;
    }
    const confirmed = window.confirm(
      "Leave this household? You'll lose access until someone re-invites you."
    );
    if (!confirmed) return;

    setIsLeaving(true);
    setLeaveError(null);

    try {
      await leaveHouseholdMutation({ clerkId: clerkUser.id });
      setActiveHousehold(null);
      setActiveView("onboarding");
    } catch (err: any) {
      setLeaveError(err?.message || "Could not leave household");
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between selection:bg-accent selection:text-white pb-8">
      <header className="w-full bg-ink text-paper border-b-4 border-black py-3 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 bg-accent text-white flex items-center justify-center font-black text-sm border-2 border-white shadow-[2px_2px_0_0_var(--highlight)]">
              🐾
            </span>
            <span className="font-black tracking-tight text-lg uppercase text-white">
              STRAYSYNC
            </span>
          </div>

          <nav className="flex items-center gap-1.5 text-xs">
            <button
              onClick={goToDashboard}
              disabled={!activeHousehold}
              className={`px-3 py-1 font-bold border-2 transition-all flex items-center gap-1.5 ${activeView === "dashboard"
                ? "bg-highlight text-black border-black shadow-[2px_2px_0_0_var(--accent)]"
                : "bg-black text-paper border-transparent hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>DASHBOARD</span>
            </button>

            <button
              onClick={() => activeHousehold && setActiveView("setup")}
              disabled={!activeHousehold}
              className={`px-3 py-1 font-bold border-2 transition-all flex items-center gap-1.5 ${activeView === "setup"
                ? "bg-highlight text-black border-black shadow-[2px_2px_0_0_var(--accent)]"
                : "bg-black text-paper border-transparent hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
                }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>SETUP</span>
            </button>

            {!activeHousehold && (
              <button
                onClick={() => setActiveView("onboarding")}
                className={`px-3 py-1 font-bold border-2 transition-all flex items-center gap-1.5 ${activeView === "onboarding"
                  ? "bg-highlight text-black border-black shadow-[2px_2px_0_0_var(--accent)]"
                  : "bg-black text-paper border-transparent hover:border-zinc-700"
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>JOIN</span>
              </button>
            )}
          </nav>
        </div>
      </header>

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

        {activeView === "setup" && activeHousehold && (
          <section className="space-y-6">
            <HouseholdSetupFlow
              householdId={activeHousehold.id}
              householdName={activeHousehold.name}
              inviteCode={activeHousehold.inviteCode}
              onComplete={() => {
                setActiveView("dashboard");
              }}
            />

            <div className="max-w-3xl mx-auto pt-4 border-t-2 border-black/20">
              {leaveError && (
                <div className="mb-3 p-2 border-2 border-black bg-accent text-white text-xs font-mono font-bold">
                  {leaveError}
                </div>
              )}
              <button
                onClick={handleLeaveHousehold}
                disabled={isLeaving}
                className="w-full sm:w-auto punk-button bg-white text-red-600 py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isLeaving ? "Leaving..." : "Leave Household"}</span>
              </button>
              <p className="text-[10px] font-mono text-ink-muted mt-2">
                You&apos;ll be removed from this household. Your cat-care history stays with the crew.
              </p>
            </div>
          </section>
        )}

        {activeView === "dashboard" && activeHousehold && (
          <section>
            <CatDashboard
              householdId={activeHousehold.id}
              householdName={activeHousehold.name}
              inviteCode={activeHousehold.inviteCode}
              userName="Emmett"
              onLeaveHousehold={handleLeaveHousehold}
            />
          </section>
        )}

        {activeView === "dashboard" && !activeHousehold && (
          <section className="max-w-xl mx-auto text-center py-12">
            <p className="font-mono text-sm text-ink-muted">
              No household loaded. Go to <strong>JOIN</strong> to create
              or join one.
            </p>
          </section>
        )}
      </main>

      <footer className="w-full border-t-2 border-black/20 pt-4 px-4 text-center">
        <p className="text-[11px] font-mono font-bold text-ink-muted uppercase tracking-wide">
          STRAYSYNC • REAL-TIME CAT CARE FOR ROOMMATES
        </p>
      </footer>
    </div>
  );
}