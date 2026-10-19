import React from "react";

export function MaskingTape({ className = "", text }: { className?: string; text?: string }) {
  return (
    <div
      className={`inline-block bg-[#fff5a0]/90 text-black font-mono text-xs font-bold px-3 py-1 border-y-2 border-black/30 shadow-sm transform -rotate-1 select-none backdrop-blur-xs ${className}`}
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        clipPath: "polygon(2% 0%, 98% 0%, 100% 100%, 0% 100%)",
      }}
    >
      {text || "///"}
    </div>
  );
}

export function ZineStaple({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-6 h-1.5 bg-[#404040] border border-[#1a1a1a] rounded-[1px] shadow-[0_1px_1px_rgba(0,0,0,0.4)] ${className}`}
    />
  );
}

export function StampBadge({
  text,
  color = "pink",
  rotation = "-rotate-3",
  className = "",
}: {
  text: string;
  color?: "pink" | "yellow" | "black" | "cyan";
  rotation?: string;
  className?: string;
}) {
  const bgStyles = {
    pink: "bg-[#ff2a85] text-white border-black",
    yellow: "bg-[#ffe600] text-black border-black",
    black: "bg-[#0d0d0d] text-[#f4f1ea] border-black",
    cyan: "bg-[#00f0ff] text-black border-black",
  };

  return (
    <div
      className={`inline-block uppercase font-mono font-black text-xs px-2.5 py-1 border-[3px] shadow-[3px_3px_0px_0px_#0d0d0d] tracking-wider ${bgStyles[color]} ${rotation} ${className}`}
    >
      {text}
    </div>
  );
}

export function XeroxBarcode({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-end gap-[2px] h-8 select-none ${className}`}>
      <div className="w-[3px] h-full bg-black" />
      <div className="w-[1px] h-full bg-black" />
      <div className="w-[4px] h-full bg-black" />
      <div className="w-[2px] h-full bg-black" />
      <div className="w-[1px] h-full bg-black" />
      <div className="w-[5px] h-full bg-black" />
      <div className="w-[2px] h-full bg-black" />
      <div className="w-[3px] h-full bg-black" />
      <div className="w-[1px] h-full bg-black" />
      <div className="w-[4px] h-full bg-black" />
      <div className="w-[2px] h-full bg-black" />
      <div className="w-[3px] h-full bg-black" />
    </div>
  );
}
