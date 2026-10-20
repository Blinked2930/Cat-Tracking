"use client";

import React, { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import JaggedCatSilhouette from "./JaggedCatSilhouette";
import {
  X,
  Check,
  Clock,
  Users,
  FileText
} from "lucide-react";

export interface CatDetailTask {
  _id: string;
  title: string;
  type: string; // "checkbox" | "counter"
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
  simulatedLogs?: Array<{ id: string | number; text: string; time: string; userName: string }>;
}

export default function CatDetailModal({
  cat,
  isOpen,
  onClose,
  userName = "Roommate",
  todayString,
  onToggleTask,
  simulatedLogs = [],
}: CatDetailModalProps) {
  // Safe Convex Query for live task logs
  let liveLogs: any = null;
  let logTaskMutation: any = null;
  let unlogTaskMutation: any = null;

  try {
    const isMock = !cat || cat._id.startsWith("cat-");
    liveLogs = useQuery(
      api.tasks.getDailyLogs,
      !isMock && cat ? { catId: cat._id as any, dateString: todayString } : "skip"
    );
    logTaskMutation = useMutation(api.tasks.logTask);
    unlogTaskMutation = useMutation(api.tasks.unlogTask);
  } catch {
    // Dev fallback
  }

  // Format activity timeline logs (Convex or simulated)
  const timelineLogs = useMemo(() => {
    if (liveLogs && liveLogs.length > 0) {
      return liveLogs.map((log: any) => {
        const timeStr = new Date(log.completedAt).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });
        return {
          id: log._id,
          text: `${log.userName} logged "${log.taskTitle || "Chore"}"`,
          time: timeStr,
          userName: log.userName,
        };
      });
    }
    return simulatedLogs;
  }, [liveLogs, simulatedLogs]);

  if (!isOpen || !cat) return null;

  const pct = Math.max(0, Math.min(100, Math.round(cat.completionPercentage)));

  const handleTaskClick = async (task: CatDetailTask) => {
    // Live Convex Mutation
    if (logTaskMutation && unlogTaskMutation && !cat._id.startsWith("cat-")) {
      try {
        if (task.isDone && task.logs && task.logs.length > 0) {
          const lastLog = task.logs[task.logs.length - 1];
          await unlogTaskMutation({ logId: lastLog._id });
        } else {
          await logTaskMutation({
            taskId: task._id as any,
            catId: cat._id as any,
            dateString: todayString,
            value: task.type === "counter" ? (task.completedCount || 0) + 1 : undefined,
          });
        }
      } catch (err) {
        console.error("Error logging task in modal:", err);
      }
      return;
    }

    // Local Callback
    if (onToggleTask) {
      onToggleTask(cat._id, task);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#A7A6A2] border-4 border-black shadow-[8px_8px_0px_0px_#0d0d0d] p-6 my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b-3 border-black pb-3 mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              {cat.name}
            </h2>
            <span className="font-mono text-xs font-black bg-black text-[#3FD6CA] px-2 py-0.5 border border-black">
              {pct}%
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 bg-black text-[#A7A6A2] font-mono font-bold flex items-center justify-center hover:bg-[#A01AB1] transition-colors border-2 border-black"
          >
            ✕
          </button>
        </div>

        {/* Top Grid: Silhouette + Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          {/* Left: Mini Silhouette */}
          <div className="md:col-span-5 bg-[#B5B4B0] border-2 border-black p-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-[170px]">
              <JaggedCatSilhouette
                catName={cat.name}
                completionPercentage={cat.completionPercentage}
                completedCount={cat.completedCount}
                totalRequired={cat.totalFrequency}
                photoUrl={cat.photoUrl}
              />
            </div>
          </div>

          {/* Right: Tasks List */}
          <div className="md:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-black/20 pb-1.5 mb-2.5 font-mono text-xs">
                <span className="font-bold uppercase text-black">TODAY&apos;S TASKS</span>
                <span className="text-[10px] text-zinc-500">TAP TO LOG</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cat.tasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className={`cursor-pointer border-2 border-black p-2.5 transition-all select-none ${task.isDone
                      ? "bg-[#A7A6A2] text-[#777]"
                      : "bg-white text-black hover:border-black shadow-[2px_2px_0_0_#000]"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 border-2 border-black flex items-center justify-center font-mono font-black text-xs transition-colors shrink-0 ${task.isDone ? "bg-black text-[#3FD6CA]" : "bg-white"
                            }`}
                        >
                          {task.type === "counter" ? (
                            <span className="text-[10px]">
                              {task.completedCount || 0}/{task.frequency}
                            </span>
                          ) : (
                            task.isDone && <Check className="w-3.5 h-3.5 stroke-[4]" />
                          )}
                        </div>

                        <div>
                          <p
                            className={`font-mono text-xs font-bold uppercase tracking-tight ${task.isDone ? "line-through text-zinc-400" : "text-black"
                              }`}
                          >
                            {task.title}
                          </p>

                          {task.lastLoggedBy && (
                            <p className="text-[10px] font-mono font-bold text-[#A01AB1]">
                              {task.lastLoggedBy} • {task.lastLoggedAt}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Clean Medication Instruction Pill if configured */}
                    {task.config && (
                      <div className="mt-1.5 pt-1.5 border-t border-dashed border-black/20 font-mono text-[10px] text-zinc-600">
                        <span className="font-bold text-[#A01AB1]">RX: </span>
                        {typeof task.config === "string"
                          ? task.config
                          : JSON.stringify(task.config)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed for this Cat */}
        <div className="bg-[#B5B4B0] border-2 border-black p-4">
          <div className="flex items-center justify-between border-b border-black/20 pb-1.5 mb-2.5 font-mono text-xs">
            <span className="font-bold uppercase text-black flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#A01AB1]" />
              <span>ACTIVITY TODAY</span>
            </span>
            <span className="text-[10px] text-zinc-400 uppercase">REAL-TIME</span>
          </div>

          {timelineLogs.length > 0 ? (
            <div className="font-mono text-xs space-y-1.5 max-h-36 overflow-y-auto">
              {timelineLogs.map((log: any, idx: number) => (
                <div
                  key={`${log.id}-${idx}`}
                  className="flex items-center justify-between text-zinc-700"
                >
                  <span className="font-bold">• {log.text}</span>
                  <span className="text-[10px] text-zinc-400">{log.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-xs text-zinc-500 text-center py-2">
              No chores logged yet today.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}