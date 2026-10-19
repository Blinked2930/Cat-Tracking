"use client";

import React, { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  Home, 
  KeyRound, 
  Copy, 
  Check, 
  ArrowRight, 
  PlusCircle,
  RotateCcw
} from "lucide-react";

export default function OnboardingFlow({
  onEnterDashboard,
}: {
  onEnterDashboard?: (household: { id: string; name: string; inviteCode: string }) => void;
}) {
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [squatName, setSquatName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulated state for dev mode
  const [simulatedUser, setSimulatedUser] = useState<{
    clerkId: string;
    name: string;
    household?: { id: string; name: string; inviteCode: string; members: string[] } | null;
  } | null>(null);

  // Safe Clerk hook reading
  let clerkUser: any = null;
  let isClerkLoaded = false;
  try {
    const clerk = useUser();
    clerkUser = clerk.user;
    isClerkLoaded = clerk.isLoaded;
  } catch {
    isClerkLoaded = true;
  }

  const isLiveClerkActive = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && clerkUser);
  const effectiveUserId = clerkUser?.id || simulatedUser?.clerkId || "punk-dev-guest";
  const effectiveUserName = clerkUser?.fullName || clerkUser?.firstName || simulatedUser?.name || "Roommate";

  // Safe Convex mutation & query hooks
  let syncUserMutation: any = null;
  let createHouseholdMutation: any = null;
  let joinHouseholdMutation: any = null;
  let leaveHouseholdMutation: any = null;
  let liveCurrentUserData: any = null;

  try {
    syncUserMutation = useMutation(api.users.syncUser);
    createHouseholdMutation = useMutation(api.households.createHousehold);
    joinHouseholdMutation = useMutation(api.households.joinHousehold);
    leaveHouseholdMutation = useMutation(api.households.leaveHousehold);
    liveCurrentUserData = useQuery(
      api.users.currentUser,
      isLiveClerkActive ? { clerkId: effectiveUserId } : "skip"
    );
  } catch {
    // Dev fallback
  }

  // Automatic Clerk -> Convex Sync
  useEffect(() => {
    if (isLiveClerkActive && syncUserMutation) {
      syncUserMutation({
        clerkId: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || "Roommate",
      }).catch((err: any) => {
        console.warn("Convex user sync:", err);
      });
    }
  }, [isLiveClerkActive, clerkUser?.id, syncUserMutation]);

  const currentHousehold = liveCurrentUserData?.household || simulatedUser?.household;

  // Handle Household Creation
  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!squatName.trim()) {
      setStatusMessage({ text: "Please enter a household name", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      if (createHouseholdMutation && isLiveClerkActive) {
        const res = await createHouseholdMutation({
          name: squatName.trim(),
          clerkId: effectiveUserId,
        });
        setStatusMessage({ text: `Household created! Invite Code: ${res.inviteCode}`, type: "success" });
      } else {
        const mockChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let mockCode = "";
        for (let i = 0; i < 6; i++) mockCode += mockChars.charAt(Math.floor(Math.random() * mockChars.length));

        setSimulatedUser({
          clerkId: effectiveUserId,
          name: effectiveUserName,
          household: {
            id: "mock-hh-" + Date.now(),
            name: squatName.trim(),
            inviteCode: mockCode,
            members: [effectiveUserName, "Spike", "Aline"],
          },
        });
        setStatusMessage({ text: `Household created! Code: ${mockCode}`, type: "success" });
      }
      setSquatName("");
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to create household", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Joining Household
  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setStatusMessage({ text: "Code must be exactly 6 characters", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      if (joinHouseholdMutation && isLiveClerkActive) {
        const res = await joinHouseholdMutation({
          inviteCode: cleanCode,
          clerkId: effectiveUserId,
        });
        setStatusMessage({ text: `Joined "${res.name}" successfully!`, type: "success" });
      } else {
        setSimulatedUser({
          clerkId: effectiveUserId,
          name: effectiveUserName,
          household: {
            id: "mock-joined-" + Date.now(),
            name: "THE NO-WAVE SQUAT",
            inviteCode: cleanCode,
            members: ["Iggy", "Dexter", effectiveUserName],
          },
        });
        setStatusMessage({ text: `Joined household with code: ${cleanCode}`, type: "success" });
      }
      setInviteCode("");
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to join crew", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-[#f4f1ea] border-4 border-[#0d0d0d] shadow-[6px_6px_0px_0px_#0d0d0d] p-6 sm:p-8">
      {/* Clean Header */}
      <div className="border-b-3 border-black pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            HOUSEHOLD SETUP
          </h2>
          <p className="text-xs font-mono text-[#555] mt-1">
            Create a shared household or join an existing one with an invite code.
          </p>
        </div>

        <div className="text-xs font-mono font-bold text-[#555] flex items-center gap-2">
          <span>USER: <strong className="text-black">{effectiveUserName}</strong></span>
          {isLiveClerkActive && <UserButton />}
        </div>
      </div>

      {/* Alerts */}
      {statusMessage && (
        <div
          className={`mb-5 p-3 border-2 border-black text-xs font-mono font-bold flex items-center justify-between ${
            statusMessage.type === "error" ? "bg-[#ff2a85] text-white" : "bg-[#ffe600] text-black"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>✕</button>
        </div>
      )}

      {/* VIEW A: ALREADY IN A HOUSEHOLD */}
      {currentHousehold ? (
        <div className="space-y-4">
          <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0_0_#000]">
            <span className="text-[10px] font-mono font-bold uppercase text-[#777]">
              ACTIVE HOUSEHOLD
            </span>
            <h3 className="text-2xl font-black uppercase text-black mt-0.5 mb-3">
              {currentHousehold.name}
            </h3>

            {/* Invite code */}
            <div className="bg-[#f4f1ea] border-2 border-black p-3 flex items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#666] uppercase block">
                  ROOMMATE INVITE CODE
                </span>
                <span className="font-mono font-black text-2xl tracking-wider text-black">
                  {currentHousehold.inviteCode}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(currentHousehold.inviteCode)}
                className="punk-button bg-[#ffe600] text-black px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "COPIED" : "COPY"}</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onEnterDashboard && currentHousehold) {
                    onEnterDashboard({
                      id: currentHousehold.id || currentHousehold._id || "hh-1",
                      name: currentHousehold.name,
                      inviteCode: currentHousehold.inviteCode,
                    });
                  }
                }}
                className="punk-button flex-1 bg-black text-[#f4f1ea] py-3 text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#ff2a85]"
              >
                <span>OPEN DASHBOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSimulatedUser(null)}
                className="text-xs font-mono font-bold text-red-600 hover:text-black py-2 px-3 text-center"
              >
                Switch Household
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW B: CREATE OR JOIN */
        <div>
          {/* 2 Tabs */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("create");
                setStatusMessage(null);
              }}
              className={`punk-button py-2.5 px-3 text-xs font-bold transition-all ${
                activeTab === "create"
                  ? "bg-black text-[#f4f1ea] shadow-[3px_3px_0px_0px_#ff2a85]"
                  : "bg-white text-black hover:bg-zinc-100"
              }`}
            >
              CREATE HOUSEHOLD
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("join");
                setStatusMessage(null);
              }}
              className={`punk-button py-2.5 px-3 text-xs font-bold transition-all ${
                activeTab === "join"
                  ? "bg-black text-[#f4f1ea] shadow-[3px_3px_0px_0px_#ffe600]"
                  : "bg-white text-black hover:bg-zinc-100"
              }`}
            >
              JOIN WITH CODE
            </button>
          </div>

          {activeTab === "create" ? (
            <form onSubmit={handleCreateHousehold} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-black mb-1">
                  HOUSEHOLD NAME
                </label>
                <input
                  type="text"
                  value={squatName}
                  onChange={(e) => setSquatName(e.target.value)}
                  placeholder="e.g. Apt 4B, The Alley Squat"
                  required
                  className="w-full bg-white border-3 border-black p-3 font-mono font-bold text-sm text-black focus:outline-none focus:border-[#ff2a85]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="punk-button w-full bg-[#ff2a85] text-white py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#e01e72]"
              >
                <span>{isSubmitting ? "CREATING..." : "CREATE HOUSEHOLD ➔"}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinHousehold} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-black mb-1">
                  6-CHARACTER INVITE CODE
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="PUNK69"
                  required
                  className="w-full bg-white border-3 border-black py-3 px-4 text-center font-mono font-bold text-2xl tracking-[0.3em] uppercase text-black focus:outline-none focus:border-[#ffe600]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || inviteCode.length !== 6}
                className={`punk-button w-full py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 ${
                  inviteCode.length === 6
                    ? "bg-[#ffe600] text-black hover:bg-[#ffea33]"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                }`}
              >
                <span>{isSubmitting ? "JOINING..." : "JOIN HOUSEHOLD ➔"}</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
