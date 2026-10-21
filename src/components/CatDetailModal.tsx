"use client";

import React, { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import JaggedCatSilhouette from "./JaggedCatSilhouette";
import { formatTime } from "@/lib/formatTime";
import { Check, Clock } from "lucide-react";

export interface CatDetailTask {
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

export interface CatDetailData {
  _id: string;
  name: string;
  photoUrl?: string;
  tasks: CatDetailTask[];
  totalFrequency: number;
  completedCount: number;
  completionPercentage: number;
}

interface CatDetailModalProps {
  cat: CatDetailData | null;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  todayString: string;
  onToggleTask?: (catId: string, task: CatDetailTask) => void;
}

export default function CatDetailModal({
  cat,
  isOpen,
  onClose,
  userName = "Roommate",
  todayString,
  onToggleTask,
}: CatDetailModalProps) {
  const isMock = !cat || cat._id.startsWith("cat-");
  const liveLogs = useQuery(
    api.tasks.getDailyLogs,
    !isMock && cat
      ? { catId: cat._id as any, dateString: todayString }
      : "skip"
  );
  const logTaskMutation = useMutation(api.tasks.logTask);
  const unlogTaskMutation = useMutation(api.tasks.unlogTask);

  const timelineLogs = useMemo(() => {
    if (!liveLogs || liveLogs.length === 0) return [];
    return liveLogs.map((log: any) => ({
      id: log._id,
      text: `${log.userName || "Roommate"} logged "${log.taskTitle || "Chore"}"`,
      time: formatTime(log.completedAt),
    }));
  }, [liveLogs]);

  if (!isOpen || !cat) return null;

  const pct = Math.max(
    0,
    Math.min(100, Math.round(cat.completionPercentage))
  );

  const handleTaskClick = async (task: CatDetailTask) => {
    if (!logTaskMutation || !unlogTaskMutation || cat._id.startsWith("cat-")) {
      onToggleTask?.(cat._id, task);
      return;
    }

    try {
      if (task.isDone && task.logs && task.logs.length > 0) {
        const lastLog = task.logs[task.logs.length - 1];
        await unlogTaskMutation({ logId: lastLog._id });
      } else {
        await logTaskMutation({
          taskId: task._id as any,
          catId: cat._id as any,
          dateString: todayString,
          value:
            task.type === "counter"
              ? (task.completedCount || 0) + 1
              : undefined,
        });
      }
    } catch (err) {
      console.error("Error logging task in modal:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-paper border-4 border-black shadow-[8px_8px_0px_0px_var(--ink)] p-4 sm:p-6 my-4 sm:my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-3 border-black pb-3 mb-4 sm:mb-5 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-black truncate">
              {cat.name}
            </h2>
            <span className="font-mono text-xs font-black bg-ink text-highlight px-2 py-0.5 border border-black shrink-0">
              {pct}%
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-ink text-paper font-mono font-bold flex items-center justify-center hover:bg-accent transition-colors border-2 border-black shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="md:col-span-5 bg-paper-card border-2 border-black p-3 sm:p-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-[150px] sm:max-w-[170px]">
              <JaggedCatSilhouette
                catName={cat.name}
                completionPercentage={cat.completionPercentage}
                completedCount={cat.completedCount}
                totalRequired={cat.totalFrequency}
                photoUrl={cat.photoUrl}
              />
            </div>
          </div>

          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-black/20 pb-1.5 mb-2.5 font-mono text-xs">
                <span className="font-bold uppercase text-black">
                  Today&apos;s Tasks
                </span>
                <span className="text-[10px] text-ink-muted">tap to log</span>
              </div>

              <div className="space-y-2">
                {cat.tasks.map((task) => {
                  const completed = task.completedCount || 0;
                  const isCounter = task.type === "counter";
                  const started = isCounter && completed > 0 && !task.isDone;
                  const timeDisplay = formatTime(task.lastLoggedAt);

                  return (
                    <div
                      key={task._id}
                      onClick={() => handleTaskClick(task)}
                      className={`cursor-pointer border-2 border-black p-2.5 transition-all select-none min-h-[44px] ${task.isDone
                          ? "bg-paper text-ink-muted"
                          : started
                            ? "bg-highlight/20 shadow-[2px_2px_0_0_var(--ink)]"
                            : "bg-white text-black shadow-[2px_2px_0_0_var(--ink)]"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-5 h-5 border-2 border-black flex items-center justify-center font-mono font-black text-xs transition-colors shrink-0 ${task.isDone
                                ? "bg-ink text-highlight"
                                : started
                                  ? "bg-highlight text-black"
                                  : "bg-white"
                              }`}
                          >
                            {isCounter ? (
                              <span className="text-[10px]">
                                {completed}/{task.frequency}
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
                              <p className="text-[10px] font-mono font-bold text-accent truncate">
                                {task.lastLoggedBy}
                                {timeDisplay ? ` • ${timeDisplay}` : ""}
                              </p>
                            )}
                          </div>
                        </div>

                        {started && (
                          <span className="shrink-0 font-mono text-[9px] font-black uppercase bg-highlight text-black border border-black px-1.5 py-0.5">
                            In progress
                          </span>
                        )}
                      </div>

                      {task.config && (
                        <div className="mt-1.5 pt-1.5 border-t border-dashed border-black/20 font-mono text-[10px] text-ink-muted">
                          <span className="font-bold text-accent">Rx: </span>
                          {typeof task.config === "string"
                            ? task.config
                            : JSON.stringify(task.config)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Activity feed — no max-height, the whole modal scrolls instead */}
        <div className="bg-paper-card border-2 border-black p-3 sm:p-4">
          <div className="flex items-center justify-between border-b border-black/20 pb-1.5 mb-2.5 font-mono text-xs">
            <span className="font-bold uppercase text-black flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-accent" />
              <span>Activity Today</span>
            </span>
            <span className="text-[10px] text-ink-muted uppercase">
              real-time
            </span>
          </div>

          {timelineLogs.length > 0 ? (
            <div className="font-mono text-xs space-y-1.5">
              {timelineLogs.map((log, idx) => (
                <div
                  key={`${log.id}-${idx}`}
                  className="flex items-center justify-between gap-2 text-zinc-700"
                >
                  <span className="font-bold truncate">• {log.text}</span>
                  <span className="text-[10px] text-zinc-400 shrink-0">
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-ink-muted text-center py-2">
              No chores logged yet today.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}