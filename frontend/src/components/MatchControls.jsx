import React from "react";

function Select({ label, value, onChange, options, icon }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {icon} {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2
                   text-sm text-white focus:outline-none focus:border-emerald-500
                   focus:ring-1 focus:ring-emerald-500/50 transition-all cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-gray-900">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, icon }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide flex justify-between">
        <span>{icon} {label}</span>
        <span className="text-emerald-400 font-bold">{value}</span>
      </label>
      <input
        type="range"
        min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                   bg-white/10 accent-emerald-500"
        style={{
          background: `linear-gradient(to right, #10b981 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`
        }}
      />
      <div className="flex justify-between text-[10px] text-gray-600">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, icon }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {icon} {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2
                   text-sm text-white placeholder-gray-600
                   focus:outline-none focus:border-emerald-500
                   focus:ring-1 focus:ring-emerald-500/50 transition-all"
      />
    </div>
  );
}

export default function MatchControls({ match, onChange, onSuggest, loading }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white text-sm">Match Context</h2>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
          {match.match_type.toUpperCase()} · {match.total_overs} ov
        </span>
      </div>

      {/* Format */}
      <Select
        label="Format" icon="🏆" value={match.match_type}
        onChange={v => {
          const overs = v.includes("20") || v === "t20" || v === "it20" ? 20 : 50;
          onChange({ match_type: v, total_overs: overs });
        }}
        options={[
          { value: "t20",  label: "T20 International" },
          { value: "it20", label: "T20 Domestic" },
          { value: "odi",  label: "ODI" },
          { value: "odm",  label: "One-Day Match" },
        ]}
      />

      {/* Over */}
      <Slider
        label="Current Over" icon="⚡"
        value={match.over} onChange={v => onChange({ over: v })}
        min={0} max={match.total_overs - 1}
      />

      {/* Wickets */}
      <Slider
        label="Wickets Fallen" icon="❌"
        value={match.wickets} onChange={v => onChange({ wickets: v })}
        min={0} max={9}
      />

      {/* Runs */}
      <Slider
        label="Runs Scored" icon="🏃"
        value={match.runs} onChange={v => onChange({ runs: v })}
        min={0} max={match.total_overs === 20 ? 250 : 400}
      />

      <hr className="border-white/10" />

      {/* Bowler Type */}
      <Select
        label="Bowler Type" icon="🎯" value={match.bowler_type}
        onChange={v => onChange({ bowler_type: v })}
        options={[
          { value: "pace",  label: "Pace / Fast" },
          { value: "spin",  label: "Spin" },
          { value: "unknown", label: "Unknown" },
        ]}
      />

      {/* Batsman Hand */}
      <Select
        label="Batsman Handedness" icon="🦾" value={match.batsman_hand}
        onChange={v => onChange({ batsman_hand: v })}
        options={[
          { value: "right", label: "Right-Handed" },
          { value: "left",  label: "Left-Handed"  },
        ]}
      />

      {/* Batsman Style */}
      <Select
        label="Batsman Style" icon="💥" value={match.batsman_style}
        onChange={v => onChange({ batsman_style: v })}
        options={[
          { value: "aggressive", label: "Aggressive" },
          { value: "balanced",   label: "Balanced"   },
          { value: "defensive",  label: "Defensive"  },
        ]}
      />

      {/* Weather */}
      <Select
        label="Conditions" icon="🌤" value={match.weather}
        onChange={v => onChange({ weather: v })}
        options={[
          { value: "sunny",    label: "Sunny / Clear" },
          { value: "overcast", label: "Overcast"      },
          { value: "humid",    label: "Humid"          },
          { value: "dry",      label: "Dry / Spin-friendly" },
        ]}
      />

      <hr className="border-white/10" />

      {/* Player names */}
      <TextInput
        label="Batsman" icon="🏏" value={match.batsman_name}
        onChange={v => onChange({ batsman_name: v })}
        placeholder="e.g. Virat Kohli"
      />
      <TextInput
        label="Bowler" icon="⚾" value={match.bowler_name}
        onChange={v => onChange({ bowler_name: v })}
        placeholder="e.g. Jasprit Bumrah"
      />

      {/* CTA */}
      <button
        onClick={onSuggest}
        disabled={loading}
        className="mt-1 w-full py-3 rounded-xl font-bold text-sm
                   bg-gradient-to-r from-emerald-500 to-teal-500
                   hover:from-emerald-400 hover:to-teal-400
                   disabled:opacity-50 disabled:cursor-not-allowed
                   shadow-lg shadow-emerald-500/25
                   transition-all active:scale-95"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Calculating…
          </span>
        ) : (
          "⚡ Suggest Field"
        )}
      </button>
    </div>
  );
}
