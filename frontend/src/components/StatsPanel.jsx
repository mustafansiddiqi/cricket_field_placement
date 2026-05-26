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

  const phaseConfig = {
    powerplay: { label: "Powerplay",   color: "text-amber-600",  bg: "bg-amber-50  border-amber-200"  },
    middle:    { label: "Middle Overs", color: "text-blue-600",  bg: "bg-blue-50   border-blue-200"   },
    death:     { label: "Death Overs",  color: "text-red-600",   bg: "bg-red-50    border-red-200"    },
  };
  const phase = phaseConfig[match_phase] || { label: match_phase, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" };

  return (
    <div className="card rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm">Analysis</h2>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${phase.bg} ${phase.color}`}>
            {phase.label}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium border border-gray-200">
            {model_used === "ml" ? "ML" : "Rules"}
          </span>
        </div>
      </div>

      {/* Match snapshot */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Over",   value: `${match.over}.0` },
          { label: "Score",  value: `${match.runs}/${match.wickets}` },
          { label: "Format", value: match.match_type.toUpperCase() },
        ].map(stat => (
          <div key={stat.label}
            className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
            <p className="text-base font-bold text-gray-900 leading-none">{stat.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Zone threat analysis */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Zone Threat
        </h3>
        <div className="flex flex-col gap-2">
          {sortedZones.map(([zone, score]) => {
            const pct = (score / maxScore) * 100;
            const isHigh = score === maxScore;
            return (
              <div key={zone} className="flex items-center gap-2">
                <span className="text-[11px] text-gray-500 w-20 shrink-0 font-medium">
                  {ZONE_LABELS[zone] || zone}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
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
                <span className="text-[11px] font-mono text-gray-400 w-8 text-right">
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
              className="text-[11px] px-2 py-0.5 rounded-md border font-medium"
              style={{
                background: p.catching
                  ? "#fef2f2"
                  : p.deep
                  ? "#f5f3ff"
                  : "#f0fdf4",
                borderColor: p.catching
                  ? "#fecaca"
                  : p.deep
                  ? "#ddd6fe"
                  : "#bbf7d0",
                color: p.catching ? "#dc2626" : p.deep ? "#7c3aed" : "#059669",
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
          match.bowler_type === "pace" ? "Pace" : "Spin",
          match.batsman_hand === "left" ? "LHB" : "RHB",
          match.batsman_style,
          match.weather,
        ].map(t => (
          <span key={t}
            className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200 font-medium capitalize">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
