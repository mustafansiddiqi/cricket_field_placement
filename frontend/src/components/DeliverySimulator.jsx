import React, { useState } from "react";
import CricketField from "./CricketField";

const OUTCOME_STYLES = {
  dot:    { bg: "bg-gray-700/60",   text: "text-gray-300",  icon: "•",   border: "border-gray-600/40" },
  single: { bg: "bg-blue-900/40",   text: "text-blue-300",  icon: "1",   border: "border-blue-600/40" },
  two:    { bg: "bg-cyan-900/40",   text: "text-cyan-300",  icon: "2",   border: "border-cyan-600/40" },
  four:   { bg: "bg-emerald-900/40",text: "text-emerald-300",icon:"4",   border: "border-emerald-600/40" },
  six:    { bg: "bg-yellow-900/40", text: "text-yellow-300", icon: "6",  border: "border-yellow-600/40" },
  wicket: { bg: "bg-red-900/50",    text: "text-red-300",   icon: "W",   border: "border-red-600/40" },
};

function ScoreCard({ match, history }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-white text-sm">Scorecard</h2>
        <span className="text-xs text-gray-500">{match.match_type.toUpperCase()} · {match.total_overs} ov</span>
      </div>

      {/* Big score */}
      <div className="text-center py-3">
        <div className="text-5xl font-black text-white tracking-tight">
          {match.runs}
          <span className="text-2xl text-gray-500 font-bold">/{match.wickets}</span>
        </div>
        <div className="text-sm text-gray-400 mt-1">
          Ov {match.over}.0 — {match.match_type.toUpperCase()}
        </div>
        {match.required_rr && (
          <div className="mt-1 text-xs text-yellow-400">
            RRR: {match.required_rr.toFixed(2)}
          </div>
        )}
      </div>

      {/* CRR */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
          <p className="text-sm font-bold text-emerald-400">
            {match.over > 0 ? ((match.runs / match.over) * 6 / 6).toFixed(2) : "—"}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Run Rate</p>
        </div>
        <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
          <p className="text-sm font-bold text-blue-400">{10 - match.wickets}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Wickets Left</p>
        </div>
      </div>

      {/* Ball history */}
      {history.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1.5">This Over</p>
          <div className="flex gap-1.5 flex-wrap">
            {history.slice(-12).map((d, i) => {
              const s = OUTCOME_STYLES[d.outcome] || OUTCOME_STYLES.dot;
              return (
                <div key={i}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                              border ${s.bg} ${s.text} ${s.border}`}>
                  {s.icon}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CommentaryFeed({ history }) {
  if (!history.length) return null;
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-2 max-h-48 overflow-y-auto">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider sticky top-0 bg-transparent">
        Commentary
      </h3>
      {[...history].reverse().map((d, i) => {
        const s = OUTCOME_STYLES[d.outcome] || OUTCOME_STYLES.dot;
        return (
          <div key={i}
            className={`flex items-start gap-2 p-2 rounded-lg border text-xs ${s.bg} ${s.border}`}>
            <span className={`font-black text-base leading-none w-6 text-center ${s.text}`}>
              {s.icon}
            </span>
            <p className="text-gray-300 leading-snug">{d.commentary}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function DeliverySimulator({
  match, lastDelivery, onSimulate, fieldData, ballAnimation
}) {
  const [history, setHistory] = useState([]);

  const handleSimulate = async () => {
    await onSimulate();
    if (lastDelivery) {
      setHistory(prev => [...prev, lastDelivery]);
    }
  };

  // Trigger after parent updates lastDelivery
  React.useEffect(() => {
    if (lastDelivery) {
      setHistory(prev => {
        // Avoid duplicate
        if (prev.length && prev[prev.length - 1] === lastDelivery) return prev;
        return [...prev, lastDelivery];
      });
    }
  }, [lastDelivery]);

  return (
    <div className="w-full max-w-[700px] flex flex-col gap-4">
      <ScoreCard match={match} history={history} />

      {/* Field during simulation */}
      <CricketField
        fieldData={fieldData}
        loading={false}
        ballAnimation={ballAnimation}
        matchPhase={fieldData?.match_phase}
      />

      {/* Simulate button */}
      <button
        onClick={handleSimulate}
        className="w-full py-4 rounded-2xl font-black text-lg
                   bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500
                   hover:from-red-400 hover:via-orange-400 hover:to-yellow-400
                   shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98]"
      >
        Bowl Next Delivery
      </button>

      {lastDelivery && (
        <div className={`rounded-2xl p-4 border text-center
          ${OUTCOME_STYLES[lastDelivery.outcome]?.bg || "bg-gray-800"}
          ${OUTCOME_STYLES[lastDelivery.outcome]?.border || "border-gray-600"}`}>
          <div className={`text-5xl font-black mb-1 ${OUTCOME_STYLES[lastDelivery.outcome]?.text}`}>
            {lastDelivery.outcome === "wicket"
              ? `W! (${lastDelivery.wicket_kind})`
              : lastDelivery.outcome === "six"
              ? "SIX!"
              : lastDelivery.outcome === "four"
              ? "FOUR!"
              : lastDelivery.runs > 0
              ? `${lastDelivery.runs} run${lastDelivery.runs > 1 ? "s" : ""}`
              : "DOT"
            }
          </div>
          <p className="text-sm text-gray-300">{lastDelivery.commentary}</p>
          <p className="text-xs text-gray-500 mt-1 capitalize">
            Direction: {lastDelivery.ball_zone?.replace(/_/g, " ")}
          </p>
        </div>
      )}

      <CommentaryFeed history={history} />
    </div>
  );
}
