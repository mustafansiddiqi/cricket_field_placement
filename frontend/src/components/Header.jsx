import React from "react";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-sm font-black">
            C
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">
            Cricket Field AI
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500 font-medium">Live</span>
        </div>
      </div>
    </header>
  );
}
