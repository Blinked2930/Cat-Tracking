"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import JaggedCatSilhouette from "./JaggedCatSilhouette";
import CatSetupModal from "./CatSetupModal";
import CatDetailModal from "./CatDetailModal";
import {
  Plus,
  ExternalLink,
  AlertTriangle,
  LogOut,
  Copy,
} from "lucide-react";

interface TaskItem {
  _id: string;
  title: string;
  type: string;
  frequency: number;
  config?: any;
  isDone?: boolean;
  completedCount?: number;
  lastLoggedBy?: string;
  lastLoggedAt?: number | string;
  logs?: any[];
}

interface CatBlockData {
  _id: string;
  name: string;
  photoUrl?: string;
  tasks: TaskItem[];
  totalFrequency: number;
  completedCount: number;
  completionPercentage: number;
}

function isRealConvexId(id: string | undefined | null): boolean {
  if (!id) return false;
  if (id.startsWith("mock-")) return false;
  return id.length >= 20;
}

export default function CatDashboard({
  householdId,
  householdName,
  inviteCode,
  userName = "Roommate",
  onRequestLeave,
}: {
  householdId: string;
  householdName: string;
  inviteCode: string;
  userName?: string;
  onRequestLeave?: () => void;
}) {
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [selectedCatForDetail, setSelectedCatForDetail] =
    useState<CatBlockData | null>(null);
  const [todayString, setTodayString] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setTodayString(new Date().toISOString().split("T")[0]);
  }, []);

  const shouldQueryBackend = isRealConvexId(householdId);

  const dashboardData = useQuery(
    api.tasks.getDashboardData,
    shouldQueryBackend
      ? { householdId: householdId as any, dateString: todayString }
      : "skip"
  );

  const logTaskMutation = useMutation(api.tasks.logTask);
  const unlogTaskMutation = useMutation(api.tasks.unlogTask);

  const isLiveBackend = useMemo(
    () => Boolean(shouldQueryBackend && dashboardData),
    [shouldQueryBackend, dashboardData]
  );

  const activeCats: CatBlockData[] = useMemo(() => {
    if (isLiveBackend && dashboardData?.cats) {
      return dashboardData.cats as CatBlockData[];
    }
    return [];
  }, [isLiveBackend, dashboardData]);

  const handleToggleTask = async (catId: string, task: TaskItem) => {
    if (!isLiveBackend) return;

    try {
      if (task.isDone && task.logs && task.logs.length > 0) {
        const lastLog = task.logs[task.logs.length - 1];
        await unlogTaskMutation({ logId: lastLog._id as any });
      } else {
        await logTaskMutation({
          taskId: task._id as any,
          catId: catId as any,
          dateString: todayString,
          value:
            task.type === "counter"
              ? (task.completedCount || 0) + 1
              : undefined,
        });
      }
    } catch (err) {
      console.error("Task log error:", err);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-5">
      {/* Household row */}
      <div className="bg-white border-2 sm:border-3 border-black shadow-[3px_3px_0_0_var(--ink)] px-2.5 sm:px-3.5 py-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2 sm:gap-3 flex-1">
          <h1 className="text-sm sm:text-lg font-black uppercase tracking-tight text-black truncate">
            {householdName}
          </h1>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1 bg-ink text-highlight px-1.5 py-0.5 border border-black font-mono font-black text-[9px] sm:text-[10px] tracking-wider hover:bg-accent hover:text-white transition-colors"
              title="Copy invite code"
            >
              <span>{inviteCode || "——————"}</span>
              <Copy className="w-2.5 h-2.5" />
            </button>
            {copiedCode && (
              <span className="text-[9px] font-mono text-accent font-bold">
                ✓
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsAddCatOpen(true)}
          className="punk-button bg-highlight text-black px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-black flex items-center gap-1 hover:bg-highlight-hover shrink-0"
        >
          <Plus className="w-3 h-3" />
          <span>ADD CAT</span>
        </button>
      </div>

      {/* Cats — tap to view tasks */}
      <div className="space-y-2.5 sm:space-y-4">
        {activeCats.length === 0 && (
          <div className="text-center py-10 px-4 border-2 border-dashed border-black/20 bg-white/50">
            <p className="font-mono text-xs sm:text-sm text-ink-muted">
              No cats yet. Tap <strong>ADD CAT</strong> to get started.
            </p>
          </div>
        )}

        <div
          className={`grid gap-3 sm:gap-5 ${activeCats.length === 1
              ? "grid-cols-1 max-w-md mx-auto"
              : activeCats.length === 2
                ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
        >
          {activeCats.map((cat) => {
            const pending = Math.max(
              0,
              cat.totalFrequency - cat.completedCount
            );
            return (
              <button
                key={cat._id}
                onClick={() => setSelectedCatForDetail(cat)}
                className="group text-left bg-paper-card border-3 border-black shadow-[4px_4px_0px_0px_var(--ink)] sm:shadow-[6px_6px_0px_0px_var(--ink)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--ink)] sm:hover:shadow-[8px_8px_0px_0px_var(--ink)] active:translate-y-0 active:shadow-[3px_3px_0px_0px_var(--ink)] transition-all overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="bg-paper border-b-3 border-black px-3 py-2 flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-black truncate">
                    {cat.name}
                  </h2>
                  <span className="font-mono text-[10px] sm:text-xs font-black bg-ink text-highlight px-2 py-0.5 border border-black shrink-0">
                    {cat.completionPercentage}%
                  </span>
                </div>

                {/* Silhouette hero */}
                <div className="p-3 sm:p-5 bg-paper flex flex-col items-center justify-center flex-1">
                  <div className="w-full max-w-[180px] sm:max-w-[220px]">
                    <JaggedCatSilhouette
                      catName={cat.name}
                      completionPercentage={cat.completionPercentage}
                      completedCount={cat.completedCount}
                      totalRequired={cat.totalFrequency}
                      photoUrl={cat.photoUrl}
                    />
                  </div>
                </div>

                {/* Bottom strip — progress summary */}
                <div className="bg-white border-t-3 border-black px-3 py-2 flex items-center justify-between gap-2 group-hover:bg-paper-hover transition-colors">
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono font-bold uppercase text-black leading-tight">
                      {cat.completedCount}/{cat.totalFrequency} done
                      {pending > 0 && (
                        <span className="text-accent">
                          {" "}· {pending} left
                        </span>
                      )}
                    </p>
                    <p className="text-[9px] font-mono text-ink-muted leading-tight flex items-center gap-1">
                      <span>tap to view tasks</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </p>
                  </div>
                  <ChevronRightIcon />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Danger zone — compact */}
      {onRequestLeave && (
        <div className="pt-1">
          <div className="bg-paper-card border-2 border-black shadow-[2px_2px_0_0_var(--ink)]">
            <button
              onClick={onRequestLeave}
              className="w-full px-2.5 py-2 flex items-center justify-between gap-2 hover:bg-paper-hover transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1 self-stretch bg-accent shrink-0" />
                <AlertTriangle className="w-3 h-3 text-accent shrink-0" />
                <span className="font-mono font-black uppercase text-black text-[10px] sm:text-[11px] tracking-tight truncate">
                  Leave Household
                </span>
              </div>
              <LogOut className="w-3 h-3 text-accent shrink-0" />
            </button>
          </div>
        </div>
      )}

      {selectedCatForDetail && (
        <CatDetailModal
          cat={
            activeCats.find((c) => c._id === selectedCatForDetail._id) ||
            selectedCatForDetail
          }
          isOpen={Boolean(selectedCatForDetail)}
          onClose={() => setSelectedCatForDetail(null)}
          userName={userName}
          todayString={todayString}
          onToggleTask={handleToggleTask}
        />
      )}

      <CatSetupModal
        householdId={householdId}
        isOpen={isAddCatOpen}
        onClose={() => setIsAddCatOpen(false)}
      />
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0 text-ink-muted group-hover:text-black transition-colors"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth="3"
      strokeLinecap="square"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}