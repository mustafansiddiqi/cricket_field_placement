import React from "react";

function Select({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-white border border-gray-200 rounded-lg px-3 py-2
                   text-sm text-gray-900 focus:outline-none focus:border-emerald-400
                   focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Slider({ label, value, onChange, min, max }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </label>
        <span className="text-xs font-bold text-emerald-600 tabular-nums">{value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-500"
        style={{
          background: `linear-gradient(to right, #10b981 ${pct}%, #e5e7eb ${pct}%)`
        }}
      />
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white border border-gray-200 rounded-lg px-3 py-2
                   text-sm text-gray-900 placeholder-gray-400
                   focus:outline-none focus:border-emerald-400
                   focus:ring-2 focus:ring-emerald-100 transition-all"
      />
    </div>
  );
}

function Divider() {
  return <hr className="border-gray-100" />;
}

export default function MatchControls({ match, onChange, onSuggest, loading }) {
  return (
    <div className="card rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-900 text-sm">Match Context</h2>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">
          {match.match_type.toUpperCase()} · {match.total_overs} ov
        </span>
      </div>

      <Select
        label="Format" value={match.match_type}
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

      <Slider
        label="Current Over"
        value={match.over} onChange={v => onChange({ over: v })}
        min={0} max={match.total_overs - 1}
      />

      <Slider
        label="Wickets Fallen"
        value={match.wickets} onChange={v => onChange({ wickets: v })}
        min={0} max={9}
      />

      <Slider
        label="Runs Scored"
        value={match.runs} onChange={v => onChange({ runs: v })}
        min={0} max={match.total_overs === 20 ? 250 : 400}
      />

      <Divider />

      <Select
        label="Bowler Type" value={match.bowler_type}
        onChange={v => onChange({ bowler_type: v })}
        options={[
          { value: "pace",    label: "Pace / Fast" },
          { value: "spin",    label: "Spin" },
          { value: "unknown", label: "Unknown" },
        ]}
      />

      <Select
        label="Batsman Handedness" value={match.batsman_hand}
        onChange={v => onChange({ batsman_hand: v })}
        options={[
          { value: "right", label: "Right-Handed" },
          { value: "left",  label: "Left-Handed"  },
        ]}
      />

      <Select
        label="Batsman Style" value={match.batsman_style}
        onChange={v => onChange({ batsman_style: v })}
        options={[
          { value: "aggressive", label: "Aggressive" },
          { value: "balanced",   label: "Balanced"   },
          { value: "defensive",  label: "Defensive"  },
        ]}
      />

      <Select
        label="Conditions" value={match.weather}
        onChange={v => onChange({ weather: v })}
        options={[
          { value: "sunny",    label: "Sunny / Clear" },
          { value: "overcast", label: "Overcast"      },
          { value: "humid",    label: "Humid"          },
          { value: "dry",      label: "Dry / Spin-friendly" },
        ]}
      />

      <Divider />

      <TextInput
        label="Batsman" value={match.batsman_name}
        onChange={v => onChange({ batsman_name: v })}
        placeholder="e.g. Virat Kohli"
      />
      <TextInput
        label="Bowler" value={match.bowler_name}
        onChange={v => onChange({ bowler_name: v })}
        placeholder="e.g. Jasprit Bumrah"
      />

      <button
        onClick={onSuggest}
        disabled={loading}
        className="mt-1 w-full py-2.5 rounded-xl font-bold text-sm
                   bg-emerald-500 hover:bg-emerald-600 text-white
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all active:scale-95"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Calculating…
          </span>
        ) : (
          "Suggest Field"
        )}
      </button>
    </div>
  );
}
