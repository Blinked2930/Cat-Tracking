"use client";

import React, { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import OnboardingFlow from "@/components/OnboardingFlow";
import CatDashboard from "@/components/CatDashboard";
import DisplayNameDropdown from "@/components/DisplayNameDropdown";
import MobileNav from "@/components/MobileNav";
import InstallAppModal from "@/components/InstallAppModal";
import {
  LayoutDashboard,
  FileText,
  LogOut,
  AlertTriangle,
  Download,
} from "lucide-react";

interface ActiveHousehold {
  id: string;
  name: string;
  inviteCode: string;
}

export default function Home() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const leaveHouseholdMutation = useMutation(api.households.leaveHousehold);

  const [activeView, setActiveView] = useState<
    "onboarding" | "dashboard"
  >("onboarding");
  const [activeHousehold, setActiveHousehold] =
    useState<ActiveHousehold | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const currentUserData = useQuery(
    api.users.currentUser,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  );

  useEffect(() => {
    if (!currentUserData) return;

    const household = currentUserData.household;

    if (household) {
      setActiveHousehold({
        id: household._id,
        name: household.name,
        inviteCode: household.inviteCode,
      });
      setActiveView("dashboard");
    } else {
      setActiveHousehold(null);
      setActiveView("onboarding");
    }
  }, [currentUserData]);

  const goToDashboard = () => {
    if (activeHousehold) setActiveView("dashboard");
  };

  const confirmLeaveHousehold = async () => {
    if (!clerkUser?.id) {
      setLeaveError("You need to be signed in to leave.");
      return;
    }

    setIsLeaving(true);
    setLeaveError(null);

    try {
      await leaveHouseholdMutation({ clerkId: clerkUser.id });
      setActiveHousehold(null);
      setActiveView("onboarding");
      setShowLeaveConfirm(false);
    } catch (err: any) {
      setLeaveError(err?.message || "Could not leave household");
    } finally {
      setIsLeaving(false);
    }
  };

  if (!isClerkLoaded) {
    return (
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center font-mono text-sm">
        Loading…
      </div>
    );
  }

  if (clerkUser && currentUserData === undefined) {
    return (
      <div className="min-h-screen bg-paper text-ink flex items-center justify-center font-mono text-sm">
        Loading…
      </div>
    );
  }

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
      onClick: goToDashboard,
      active: activeView === "dashboard",
      disabled: !activeHousehold,
    },
    ...(activeHousehold
      ? []
      : [
        {
          key: "join",
          label: "Join",
          icon: <FileText className="w-3.5 h-3.5" />,
          onClick: () => setActiveView("onboarding"),
          active: activeView === "onboarding",
        },
      ]),
  ];

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between selection:bg-accent selection:text-white pb-8">
      <header className="w-full bg-ink text-paper border-b-4 border-black py-3 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 bg-accent text-white flex items-center justify-center font-black text-sm border-2 border-white shadow-[2px_2px_0_0_var(--highlight)] shrink-0">
              🐾
            </span>
            <span className="font-black tracking-tight text-lg uppercase text-white truncate">
              STRAYSYNC
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1.5 text-xs">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`px-3 py-1 font-bold border-2 transition-all flex items-center gap-1.5 ${item.active
                    ? "bg-highlight text-black border-black shadow-[2px_2px_0_0_var(--accent)]"
                    : "bg-black text-paper border-transparent hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  }`}
              >
                {item.icon}
                <span>{item.label.toUpperCase()}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {clerkUser && (
              <>
                <DisplayNameDropdown />
                <UserButton />
                <MobileNav items={navItems} />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
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

        {activeView === "dashboard" && activeHousehold && (
          <section>
            <CatDashboard
              householdId={activeHousehold.id}
              householdName={activeHousehold.name}
              inviteCode={activeHousehold.inviteCode}
              userName={currentUserData?.name || "Roommate"}
              onRequestLeave={() => setShowLeaveConfirm(true)}
            />
          </section>
        )}

        {activeView === "dashboard" && !activeHousehold && (
          <section className="max-w-xl mx-auto text-center py-12">
            <p className="font-mono text-sm text-ink-muted">
              No household loaded. Go to <strong>JOIN</strong> to create or join
              one.
            </p>
          </section>
        )}
      </main>

      <footer className="w-full border-t-2 border-black/20 pt-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] font-mono font-bold text-ink-muted uppercase tracking-wide text-center sm:text-left">
            STRAYSYNC • REAL-TIME CAT CARE FOR ROOMMATES
          </p>
          <button
            onClick={() => setShowInstallModal(true)}
            className="text-[11px] font-mono font-bold uppercase text-ink-muted hover:text-black flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Install App
          </button>
        </div>
      </footer>

      {showLeaveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={() => !isLeaving && setShowLeaveConfirm(false)}
        >
          <div
            className="relative w-full max-w-md bg-paper border-4 border-black shadow-[8px_8px_0px_0px_var(--ink)] p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent text-white flex items-center justify-center border-2 border-black shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-black">
                Leave Household?
              </h3>
            </div>

            <p className="text-xs font-mono text-ink-muted mb-6 leading-relaxed">
              You&apos;ll lose access to this household until someone re-invites
              you with the code. Your past cat-care logs stay with the crew.
            </p>

            {leaveError && (
              <div className="mb-3 p-2 border-2 border-black bg-accent text-white text-xs font-mono font-bold">
                {leaveError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                disabled={isLeaving}
                className="punk-button flex-1 bg-white text-black py-2.5 px-4 text-xs font-bold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeaveHousehold}
                disabled={isLeaving}
                className="punk-button flex-1 bg-accent text-white py-2.5 px-4 text-xs font-bold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLeaving ? "Leaving..." : "Yes, Leave"}
              </button>
            </div>
          </div>
        </div>
      )}

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}