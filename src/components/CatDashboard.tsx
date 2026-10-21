"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import JaggedCatSilhouette from "./JaggedCatSilhouette";
import CatSetupModal from "./CatSetupModal";
import CatDetailModal from "./CatDetailModal";
import { formatTime } from "@/lib/formatTime";
import {
  Check,
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

      {/* Cats with tasks */}
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
              ? "grid-cols-1 max-w-xl mx-auto"
              : activeCats.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
        >
          {activeCats.map((cat) => (
            <div
              key={cat._id}
              className="bg-paper-card border-3 border-black shadow-[4px_4px_0px_0px_var(--ink)] sm:shadow-[6px_6px_0px_0px_var(--ink)] flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="bg-paper border-b-3 border-black px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
                <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-black truncate">
                  {cat.name}
                </h2>
                <span className="font-mono text-[10px] sm:text-xs font-black bg-ink text-highlight px-1.5 sm:px-2 py-0.5 border border-black shrink-0">
                  {cat.completionPercentage}%
                </span>
              </div>

              {/* Silhouette — desktop only, hero position */}
              <div
                onClick={() => setSelectedCatForDetail(cat)}
                className="hidden md:flex p-4 bg-paper border-b-3 border-black flex-col items-center justify-center relative cursor-pointer group hover:bg-paper-hover transition-colors"
                title="Click to view details and activity log"
              >
                <JaggedCatSilhouette
                  catName={cat.name}
                  completionPercentage={cat.completionPercentage}
                  completedCount={cat.completedCount}
                  totalRequired={cat.totalFrequency}
                  photoUrl={cat.photoUrl}
                />
                <div className="mt-1.5 text-[10px] font-mono font-bold text-ink-muted group-hover:text-black flex items-center gap-1 transition-colors">
                  <span>tap for details</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </div>

              {/* Tasks */}
              <div className="p-2 sm:p-3 bg-white flex-1 flex flex-col justify-between">
                <div className="space-y-1 sm:space-y-1.5">
                  {cat.tasks.map((task) => {
                    const completed = task.completedCount || 0;
                    const isCounter = task.type === "counter";
                    const started = isCounter && completed > 0 && !task.isDone;
                    const timeDisplay = formatTime(task.lastLoggedAt);

                    return (
                      <div
                        key={task._id}
                        onClick={() => handleToggleTask(cat._id, task)}
                        className={`cursor-pointer border-2 border-black px-2 py-1.5 flex items-center justify-between transition-all select-none relative min-h-[40px] ${task.isDone
                            ? "bg-paper text-ink-muted"
                            : started
                              ? "bg-highlight/20 hover:border-black shadow-[2px_2px_0_0_var(--ink)]"
                              : "bg-white text-black hover:border-black shadow-[2px_2px_0_0_var(--ink)]"
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isCounter ? (
                            <div
                              className={`min-w-[36px] sm:min-w-[40px] h-6 px-1.5 border-2 border-black flex items-center justify-center font-mono font-black text-[10px] transition-colors shrink-0 ${task.isDone
                                  ? "bg-ink text-highlight"
                                  : started
                                    ? "bg-highlight text-black"
                                    : "bg-white text-black"
                                }`}
                            >
                              <span className="leading-none">
                                {completed}/{task.frequency}
                              </span>
                            </div>
                          ) : (
                            <div
                              className={`w-5 h-5 border-2 border-black flex items-center justify-center font-mono font-black text-xs transition-colors shrink-0 ${task.isDone ? "bg-ink text-highlight" : "bg-white"
                                }`}
                            >
                              {task.isDone && (
                                <Check className="w-3.5 h-3.5 stroke-[4]" />
                              )}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p
                              className={`font-mono text-[11px] sm:text-xs font-bold uppercase tracking-tight truncate leading-tight ${task.isDone
                                  ? "line-through text-zinc-400"
                                  : "text-black"
                                }`}
                            >
                              {task.title}
                            </p>
                            {task.lastLoggedBy && (
                              <p className="text-[9px] font-mono text-accent font-bold truncate leading-tight">
                                {task.lastLoggedBy}
                                {timeDisplay ? ` • ${timeDisplay}` : ""}
                              </p>
                            )}
                          </div>
                        </div>

                        {started && (
                          <span className="shrink-0 ml-1.5 font-mono text-[8px] font-black uppercase bg-highlight text-black border border-black px-1 py-0.5">
                            In&nbsp;progress
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Compact progress strip — mobile only */}
              <div
                onClick={() => setSelectedCatForDetail(cat)}
                className="md:hidden bg-paper border-t-2 border-black px-2.5 py-1.5 flex items-center justify-between cursor-pointer hover:bg-paper-hover transition-colors active:bg-paper-card"
                title="Tap for details and activity log"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 shrink-0 bg-ink border-2 border-black flex flex-col items-center justify-center">
                    <span className="font-mono font-black text-highlight text-[10px] leading-none">
                      {cat.completionPercentage}%
                    </span>
                    <span className="font-mono font-black text-paper text-[7px] leading-none mt-0.5">
                      {cat.completedCount}/{cat.totalFrequency}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono font-bold uppercase text-black leading-tight">
                      View details
                    </p>
                    <p className="text-[9px] font-mono text-ink-muted leading-tight">
                      Tap for activity log
                    </p>
                  </div>
                </div>
                <ChevronRightIcon />
              </div>
            </div>
          ))}
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
      className="w-3.5 h-3.5 shrink-0 text-ink-muted"
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