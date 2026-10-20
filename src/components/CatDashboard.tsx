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
  Copy,
  Users,
  ExternalLink,
} from "lucide-react";

interface TaskItem {
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

export default function CatDashboard({
  householdId,
  householdName,
  inviteCode,
  userName = "Roommate",
  onLeaveHousehold,
}: {
  householdId: string;
  householdName: string;
  inviteCode: string;
  userName?: string;
  onLeaveHousehold?: () => void;
}) {
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [selectedCatForDetail, setSelectedCatForDetail] =
    useState<CatBlockData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
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

  const [localCats, setLocalCats] = useState<CatBlockData[]>([
    {
      _id: "cat-1",
      name: "IGGY POP",
      photoUrl: undefined,
      totalFrequency: 4,
      completedCount: 2,
      completionPercentage: 50,
      tasks: [
        {
          _id: "t-1",
          title: "MORNING DRY KIBBLE",
          type: "checkbox",
          frequency: 1,
          isDone: true,
          completedCount: 1,
          lastLoggedBy: "Aline",
          lastLoggedAt: "8:15 AM",
        },
        {
          _id: "t-2",
          title: "INSULIN INJECTION",
          type: "counter",
          frequency: 2,
          config: { dosage: "2 units", timing: "after meal" },
          isDone: false,
          completedCount: 1,
          lastLoggedBy: "Dexter",
          lastLoggedAt: "8:42 AM",
        },
        {
          _id: "t-3",
          title: "EVENING WET CAN",
          type: "checkbox",
          frequency: 1,
          isDone: false,
          completedCount: 0,
        },
      ],
    },
    {
      _id: "cat-2",
      name: "LUCIFER",
      photoUrl: undefined,
      totalFrequency: 3,
      completedCount: 1,
      completionPercentage: 33,
      tasks: [
        {
          _id: "t-201",
          title: "CHURU SQUEEZE TREAT",
          type: "checkbox",
          frequency: 1,
          isDone: false,
          completedCount: 0,
        },
        {
          _id: "t-202",
          title: "JOINT SUPPLEMENT",
          type: "checkbox",
          frequency: 1,
          config: { drops: 3 },
          isDone: true,
          completedCount: 1,
          lastLoggedBy: "Aline",
          lastLoggedAt: "9:00 AM",
        },
        {
          _id: "t-203",
          title: "NIGHT BOWL",
          type: "checkbox",
          frequency: 1,
          isDone: false,
          completedCount: 0,
        },
      ],
    },
  ]);

  const [activityFeed, setActivityFeed] = useState<
    Array<{ id: string | number; text: string; time: string }>
  >([
    {
      id: "log-1",
      text: "Aline logged Morning Dry Kibble for Iggy Pop",
      time: "8:15 AM",
    },
    {
      id: "log-2",
      text: "Dexter logged Insulin Injection for Iggy Pop",
      time: "8:42 AM",
    },
    {
      id: "log-3",
      text: "Aline logged Joint Supplement for Lucifer",
      time: "9:00 AM",
    },
  ]);

  const isLiveBackend = useMemo(
    () => Boolean(shouldQueryBackend && dashboardData),
    [shouldQueryBackend, dashboardData]
  );

  const activeCats: CatBlockData[] = useMemo(() => {
    if (isLiveBackend && dashboardData?.cats) {
      return dashboardData.cats as CatBlockData[];
    }
    return localCats;
  }, [isLiveBackend, dashboardData, localCats]);

  const handleToggleTask = async (catId: string, task: TaskItem) => {
    const nowTime = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    if (isLiveBackend) {
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
      return;
    }

    setLocalCats((prev) =>
      prev.map((cat) => {
        if (cat._id !== catId) return cat;

        const updatedTasks = cat.tasks.map((t) => {
          if (t._id !== task._id) return t;

          const currentCount = t.completedCount || 0;
          const req = t.frequency || 1;

          if (t.type === "counter") {
            const nextCount = currentCount >= req ? 0 : currentCount + 1;
            const willBeDone = nextCount >= req;
            if (nextCount > currentCount) {
              setActivityFeed((feed) => [
                {
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                  text: `${userName} logged "${t.title}" for ${cat.name}`,
                  time: nowTime,
                },
                ...feed,
              ]);
            }
            return {
              ...t,
              completedCount: nextCount,
              isDone: willBeDone,
              lastLoggedBy: nextCount > 0 ? userName : undefined,
              lastLoggedAt: nextCount > 0 ? nowTime : undefined,
            };
          } else {
            const willBeDone = !t.isDone;
            if (willBeDone) {
              setActivityFeed((feed) => [
                {
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                  text: `${userName} logged "${t.title}" for ${cat.name}`,
                  time: nowTime,
                },
                ...feed,
              ]);
            }
            return {
              ...t,
              isDone: willBeDone,
              completedCount: willBeDone ? 1 : 0,
              lastLoggedBy: willBeDone ? userName : undefined,
              lastLoggedAt: willBeDone ? nowTime : undefined,
            };
          }
        });

        const totalReq = updatedTasks.reduce(
          (acc, t) => acc + Math.max(1, t.frequency || 1),
          0
        );
        const compCount = updatedTasks.reduce(
          (acc, t) => acc + (t.completedCount || 0),
          0
        );
        const compPct =
          totalReq > 0
            ? Math.min(100, Math.round((compCount / totalReq) * 100))
            : 0;

        return {
          ...cat,
          tasks: updatedTasks,
          totalFrequency: totalReq,
          completedCount: compCount,
          completionPercentage: compPct,
        };
      })
    );
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Clean Household Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-black/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
            {householdName}
          </h1>
          <button
            onClick={copyCode}
            className="text-xs font-mono font-bold text-[#555] hover:text-black flex items-center gap-1.5 mt-0.5"
          >
            <span>CODE:</span>
            <span className="bg-black text-[#3FD6CA] px-1.5 py-0.5 border border-black font-mono">
              {inviteCode}
            </span>
            <span className="text-[10px] text-zinc-500">
              {copiedCode ? "✓ COPIED" : "[COPY]"}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddCatOpen(true)}
            className="punk-button bg-[#3FD6CA] text-black px-3.5 py-1.5 text-xs font-black flex items-center gap-1 hover:bg-[#63E0D5]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD CAT</span>
          </button>
          {onLeaveHousehold && (
            <button
              onClick={onLeaveHousehold}
              className="text-xs font-mono font-bold text-[#777] hover:text-red-600 px-2 py-1"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Vertically split screen: one block per cat */}
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
            className="bg-[#B5B4B0] border-3 border-black shadow-[6px_6px_0px_0px_#0d0d0d] flex flex-col justify-between overflow-hidden"
          >
            <div className="bg-[#A7A6A2] border-b-3 border-black px-4 py-3 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                {cat.name}
              </h2>
              <span className="font-mono text-xs font-black bg-black text-[#3FD6CA] px-2 py-0.5 border border-black">
                {cat.completionPercentage}%
              </span>
            </div>

            <div
              onClick={() => setSelectedCatForDetail(cat)}
              className="p-5 bg-[#A7A6A2] border-b-3 border-black flex flex-col items-center justify-center relative cursor-pointer group hover:bg-[#C2C1BD] transition-colors"
              title="Click to view details and activity log"
            >
              <JaggedCatSilhouette
                catName={cat.name}
                completionPercentage={cat.completionPercentage}
                completedCount={cat.completedCount}
                totalRequired={cat.totalFrequency}
                photoUrl={cat.photoUrl}
              />

              <div className="mt-2 text-[10px] font-mono font-bold text-[#777] group-hover:text-black flex items-center gap-1 transition-colors">
                <span>tap silhouette for profile</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </div>
            </div>

            <div className="p-4 bg-white flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                {cat.tasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleToggleTask(cat._id, task)}
                    className={`cursor-pointer border-2 border-black p-2.5 flex items-center justify-between transition-all select-none ${task.isDone
                        ? "bg-[#A7A6A2] text-[#777]"
                        : "bg-white text-black hover:border-black shadow-[2px_2px_0_0_#000]"
                      }`}
                  >
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
                          task.isDone && (
                            <Check className="w-3.5 h-3.5 stroke-[4]" />
                          )
                        )}
                      </div>

                      <div>
                        <p
                          className={`font-mono text-xs font-bold uppercase tracking-tight ${task.isDone
                              ? "line-through text-zinc-400"
                              : "text-black"
                            }`}
                        >
                          {task.title}
                        </p>
                        {task.lastLoggedBy && (
                          <p className="text-[10px] font-mono text-[#A01AB1] font-bold">
                            {task.lastLoggedBy} • {task.lastLoggedAt}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Minimal Activity Feed */}
      <div className="bg-[#B5B4B0] border-3 border-black p-4 shadow-[4px_4px_0_0_#000]">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-black/20 font-mono text-xs">
          <span className="font-bold uppercase text-black flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> TODAY&apos;S LOGS
          </span>
          <span className="text-[10px] text-zinc-500 uppercase">REAL-TIME</span>
        </div>

        <div className="font-mono text-xs space-y-1.5 max-h-32 overflow-y-auto">
          {activityFeed.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="flex items-center justify-between text-zinc-700"
            >
              <span className="font-bold">• {item.text}</span>
              <span className="text-[10px] text-zinc-400">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cat Detail Modal */}
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
          simulatedLogs={activityFeed
            .filter((item) =>
              item.text
                .toLowerCase()
                .includes(selectedCatForDetail.name.toLowerCase())
            )
            .map((item, idx) => ({
              id: `${item.id}-${idx}`,
              text: item.text,
              time: item.time,
              userName: item.text.split(" ")[0] || "Roommate",
            }))}
        />
      )}

      {/* Cat Setup Modal */}
      <CatSetupModal
        householdId={householdId}
        isOpen={isAddCatOpen}
        onClose={() => setIsAddCatOpen(false)}
        onCatCreated={(newCat) => {
          setLocalCats((prev) => [
            ...prev,
            {
              _id: newCat._id,
              name: newCat.name,
              photoUrl: newCat.photoUrl,
              totalFrequency: newCat.tasks?.length || 2,
              completedCount: 0,
              completionPercentage: 0,
              tasks: newCat.tasks || [],
            },
          ]);
        }}
      />
    </div>
  );
}