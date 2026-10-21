"use client";

import React, { useState, useEffect } from "react";
import { useUser, UserButton, SignInButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Copy, Check, ArrowRight } from "lucide-react";

export default function OnboardingFlow({
  onEnterDashboard,
}: {
  onEnterDashboard?: (household: {
    id: string;
    name: string;
    inviteCode: string;
  }) => void;
}) {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const syncUserMutation = useMutation(api.users.syncUser);
  const createHouseholdMutation = useMutation(api.households.createHousehold);
  const joinHouseholdMutation = useMutation(api.households.joinHousehold);

  const effectiveUserId = clerkUser?.id;
  const effectiveUserName =
    clerkUser?.fullName || clerkUser?.firstName || "Roommate";

  const liveCurrentUserData = useQuery(
    api.users.currentUser,
    effectiveUserId ? { clerkId: effectiveUserId } : "skip"
  );

  useEffect(() => {
    if (effectiveUserId && syncUserMutation) {
      syncUserMutation({
        clerkId: effectiveUserId,
        name: effectiveUserName,
      }).catch((err: any) => {
        console.warn("Convex user sync:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId]);

  const currentHousehold = liveCurrentUserData?.household || null;

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdName.trim()) {
      setStatusMessage({ text: "Please enter a household name", type: "error" });
      return;
    }
    if (!effectiveUserId) {
      setStatusMessage({ text: "Sign in first.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await createHouseholdMutation({
        name: householdName.trim(),
        clerkId: effectiveUserId,
      });
      setStatusMessage({
        text: `Household created! Invite Code: ${res.inviteCode}`,
        type: "success",
      });
      setHouseholdName("");
    } catch (err: any) {
      setStatusMessage({
        text: err.message || "Failed to create household",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setStatusMessage({
        text: "Code must be exactly 6 characters",
        type: "error",
      });
      return;
    }
    if (!effectiveUserId) {
      setStatusMessage({ text: "Sign in first.", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await joinHouseholdMutation({
        inviteCode: cleanCode,
        clerkId: effectiveUserId,
      });
      setStatusMessage({
        text: `Joined "${res.name}" successfully!`,
        type: "success",
      });
      setInviteCode("");
    } catch (err: any) {
      setStatusMessage({
        text: err.message || "Failed to join household",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isClerkLoaded) {
    return <div className="p-6 font-mono text-sm text-ink-muted">Loading…</div>;
  }

  return (
    <div className="w-full bg-paper border-4 border-ink shadow-[6px_6px_0px_0px_var(--ink)] p-6 sm:p-8">
      <div className="border-b-3 border-black pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            HOUSEHOLD SETUP
          </h2>
          <p className="text-xs font-mono text-ink-muted mt-1">
            Create a shared household or join an existing one with an invite
            code.
          </p>
        </div>

        <div className="text-xs font-mono font-bold text-ink-muted flex items-center gap-2">
          <span>
            USER: <strong className="text-black">{effectiveUserName}</strong>
          </span>
          {effectiveUserId ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="punk-button bg-highlight text-black px-3 py-1 text-xs font-bold border-2 border-black shadow-[2px_2px_0_0_var(--accent)]">
                SIGN UP / SIGN IN
              </button>
            </SignInButton>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-5 p-3 border-2 border-black text-xs font-mono font-bold flex items-center justify-between ${statusMessage.type === "error"
              ? "bg-accent text-white"
              : "bg-highlight text-black"
            }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)}>✕</button>
        </div>
      )}

      {currentHousehold ? (
        <div className="space-y-4">
          <div className="bg-white border-3 border-black p-5 shadow-[4px_4px_0_0_var(--ink)]">
            <span className="text-[10px] font-mono font-bold uppercase text-ink-muted">
              ACTIVE HOUSEHOLD
            </span>
            <h3 className="text-2xl font-black uppercase text-black mt-0.5 mb-3">
              {currentHousehold.name}
            </h3>

            <div className="bg-paper border-2 border-black p-3 flex items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-ink-muted uppercase block">
                  ROOMMATE INVITE CODE
                </span>
                <span className="font-mono font-black text-2xl tracking-wider text-black">
                  {currentHousehold.inviteCode}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(currentHousehold.inviteCode)}
                className="punk-button bg-highlight text-black px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? "COPIED" : "COPY"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onEnterDashboard) {
                  onEnterDashboard({
                    id: currentHousehold._id,
                    name: currentHousehold.name,
                    inviteCode: currentHousehold.inviteCode,
                  });
                }
              }}
              className="punk-button w-full bg-ink text-paper py-3 text-xs font-bold flex items-center justify-center gap-2 hover:bg-accent"
            >
              <span>OPEN DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("create");
                setStatusMessage(null);
              }}
              className={`punk-button py-2.5 px-3 text-xs font-bold transition-all ${activeTab === "create"
                  ? "bg-ink text-paper shadow-[3px_3px_0px_0px_var(--accent)]"
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
              className={`punk-button py-2.5 px-3 text-xs font-bold transition-all ${activeTab === "join"
                  ? "bg-ink text-paper shadow-[3px_3px_0px_0px_var(--highlight)]"
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
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="e.g. Apt 4B, The Alley Loft"
                  required
                  className="w-full bg-white border-3 border-black p-3 font-mono font-bold text-sm text-black focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="punk-button w-full bg-accent text-white py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 hover:bg-accent-hover"
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
                  placeholder="A1B2C3"
                  required
                  className="w-full bg-white border-3 border-black py-3 px-4 text-center font-mono font-bold text-2xl tracking-[0.3em] uppercase text-black focus:outline-none focus:border-highlight"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || inviteCode.length !== 6}
                className={`punk-button w-full py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 ${inviteCode.length === 6
                    ? "bg-highlight text-black hover:bg-highlight-hover"
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