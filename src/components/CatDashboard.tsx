"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import JaggedCatSilhouette from "./JaggedCatSilhouette";
import CatSetupModal from "./CatSetupModal";
import CatDetailModal from "./CatDetailModal";
import {
  Check,
  Plus,
  ExternalLink,
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
  if (id === "squat-bedford") return false;
  return id.length >= 20;
}

/**
 * Converts a Unix-ms timestamp, an ISO string, or a pre-formatted time string
 * into a clean "8:15 AM" display. Falls back to empty string on garbage.
 */
function formatTime(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") {
    // If it already looks like a formatted time (e.g. "8:15 AM"), pass through.
    if (/^\d{1,2}:\d{2}\s?(AM|PM)?$/i.test(value.trim())) return value;
    // Otherwise try to parse as a date / ISO string.
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return "";
    return parsed.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CatDashboard({
  householdId,
  householdName,
  inviteCode,
  userName = "Roommate",
}: {
  householdId: string;
  householdName: string;
  inviteCode: string;
  userName?: string;
}) {
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [selectedCatForDetail, setSelectedCatForDetail] =
    useState<CatBlockData | null>(null);
  const [todayString, setTodayString] = useState("");

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

  // No more mock fallback — empty array means no cats in this household yet.
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-black/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            {householdName}
          </h1>
        </div>

        <button
          onClick={() => setIsAddCatOpen(true)}
          className="punk-button bg-highlight text-black px-3.5 py-1.5 text-xs font-black flex items-center gap-1 hover:bg-highlight-hover"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ADD CAT</span>
        </button>
      </div>

      {activeCats.length === 0 && (
        <div className="text-center py-16 border-3 border-dashed border-black/20 bg-white/50">
          <p className="font-mono text-sm text-ink-muted">
            No cats yet. Tap <strong>ADD CAT</strong> to get started.
          </p>
        </div>
      )}

      <div
        className={`grid gap-6 ${activeCats.length === 1
            ? "grid-cols-1 max-w-xl mx-auto"
            : activeCats.length === 2
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
      >
        {activeCats.map((cat) => (
          <div
            key={cat._id}
            className="bg-paper-card border-3 border-black shadow-[6px_6px_0px_0px_var(--ink)] flex flex-col justify-between overflow-hidden"
          >
            <div className="bg-paper border-b-3 border-black px-4 py-3 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-black truncate">
                {cat.name}
              </h2>
              <span className="font-mono text-xs font-black bg-ink text-highlight px-2 py-0.5 border border-black shrink-0">
                {cat.completionPercentage}%
              </span>
            </div>

            <div
              onClick={() => setSelectedCatForDetail(cat)}
              className="p-5 bg-paper border-b-3 border-black flex flex-col items-center justify-center relative cursor-pointer group hover:bg-paper-hover transition-colors"
              title="Click to view details and activity log"
            >
              <JaggedCatSilhouette
                catName={cat.name}
                completionPercentage={cat.completionPercentage}
                completedCount={cat.completedCount}
                totalRequired={cat.totalFrequency}
                photoUrl={cat.photoUrl}
              />

              <div className="mt-2 text-[10px] font-mono font-bold text-ink-muted group-hover:text-black flex items-center gap-1 transition-colors">
                <span>tap for details</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="p-4 bg-white flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                {cat.tasks.map((task) => {
                  const timeDisplay = formatTime(task.lastLoggedAt);
                  return (
                    <div
                      key={task._id}
                      onClick={() => handleToggleTask(cat._id, task)}
                      className={`cursor-pointer border-2 border-black p-2.5 flex items-center justify-between transition-all select-none ${task.isDone
                          ? "bg-paper text-ink-muted"
                          : "bg-white text-black hover:border-black shadow-[2px_2px_0_0_var(--ink)]"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 border-2 border-black flex items-center justify-center font-mono font-black text-xs transition-colors shrink-0 ${task.isDone ? "bg-ink text-highlight" : "bg-white"
                            }`}
                        >
                          {task.type === "counter" ? (
                            <span className="text-[10px]">
                              {task.completedCount || 0}/{task.frequency}
                            </span>
                          ) : (
                            task.isDone && (
                              <Check className="w-3.5 h-3.5 stroke-[4]" />
                            )
                          )}
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`font-mono text-xs font-bold uppercase tracking-tight truncate ${task.isDone
                                ? "line-through text-zinc-400"
                                : "text-black"
                              }`}
                          >
                            {task.title}
                          </p>
                          {task.lastLoggedBy && (
                            <p className="text-[10px] font-mono text-accent font-bold truncate">
                              {task.lastLoggedBy}
                              {timeDisplay ? ` • ${timeDisplay}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

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