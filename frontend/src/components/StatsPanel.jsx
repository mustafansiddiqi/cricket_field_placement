import React from "react";

const ZONE_LABELS = {
  straight_off: "Long Off",
  cover:        "Cover",
  point:        "Point",
  third_man:    "Third Man",
  fine_leg:     "Fine Leg",
  square_leg:   "Sq. Leg",
  mid_on:       "Mid On",
  straight_on:  "Long On",
};

export default function StatsPanel({ fieldData, match }) {
  if (!fieldData) return null;

  const { zone_scores, model_used, match_phase, positions } = fieldData;

  const sortedZones = Object.entries(zone_scores || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const maxScore = sortedZones[0]?.[1] || 1;

  const phaseColors = {
    powerplay: "text-yellow-400",
    middle:    "text-blue-400",
    death:     "text-red-400",
  };

  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white text-sm">Analysis</h2>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase ${phaseColors[match_phase] || "text-gray-400"}`}>
            {match_phase}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
            {model_used === "ml" ? "🤖 ML Model" : "📐 Rules"}
          </span>
        </div>
      </div>

      {/* Match snapshot */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Over",     value: `${match.over}.0` },
          { label: "Score",    value: `${match.runs}/${match.wickets}` },
          { label: "Format",   value: match.match_type.toUpperCase() },
        ].map(stat => (
          <div key={stat.label}
            className="bg-white/5 rounded-xl p-2.5 text-center border border-white/5">
            <p className="text-lg font-bold text-white leading-none">{stat.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Zone threat analysis */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Zone Threat
        </h3>
        <div className="flex flex-col gap-1.5">
          {sortedZones.map(([zone, score]) => {
            const pct = (score / maxScore) * 100;
            const isHigh = score === maxScore;
            return (
              <div key={zone} className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 w-20 shrink-0">
                  {ZONE_LABELS[zone] || zone}
                </span>
                <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: isHigh
                        ? "linear-gradient(to right, #ef4444, #f97316)"
                        : "linear-gradient(to right, #10b981, #06b6d4)",
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono text-gray-500 w-8 text-right">
                  {(score * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active positions list */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Field Set ({positions.length})
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {positions.map(p => (
            <span key={p.key}
              className="text-[11px] px-2 py-0.5 rounded-lg border font-medium"
              style={{
                background: p.catching
                  ? "rgba(248,113,113,0.1)"
                  : p.deep
                  ? "rgba(167,139,250,0.1)"
                  : "rgba(52,211,153,0.1)",
                borderColor: p.catching
                  ? "rgba(248,113,113,0.3)"
                  : p.deep
                  ? "rgba(167,139,250,0.3)"
                  : "rgba(52,211,153,0.3)",
                color: p.catching ? "#f87171" : p.deep ? "#a78bfa" : "#34d399",
              }}
            >
              {p.full || p.label}
            </span>
          ))}
        </div>
      </div>

      {/* Context tags */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { label: match.bowler_type === "pace" ? "🚀 Pace" : "🔄 Spin" },
          { label: match.batsman_hand === "left" ? "🦾 LHB" : "🦾 RHB" },
          { label: `💥 ${match.batsman_style}` },
          { label: `🌤 ${match.weather}` },
        ].map(t => (
          <span key={t.label}
            className="text-[11px] px-2 py-0.5 rounded-lg bg-white/5 text-gray-400 border border-white/10">
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
