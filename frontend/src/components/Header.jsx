import React from "react";

export default function Header() {
  return (
    <header className="border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🏏</span>
        <div>
          <h1 className="text-lg font-bold text-white leading-none">
            Cricket Field AI
          </h1>
          <p className="text-xs text-gray-400">ML-powered field placement recommendations</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>
    </header>
  );
}
