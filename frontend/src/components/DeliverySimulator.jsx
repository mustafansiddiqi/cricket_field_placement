import React, { useState } from "react";
import CricketField from "./CricketField";

const OUTCOME_STYLES = {
  dot:    { bg: "bg-gray-50",    text: "text-gray-600",   icon: "•", border: "border-gray-200"  },
  single: { bg: "bg-blue-50",   text: "text-blue-700",   icon: "1", border: "border-blue-200"  },
  two:    { bg: "bg-cyan-50",   text: "text-cyan-700",   icon: "2", border: "border-cyan-200"  },
  four:   { bg: "bg-emerald-50",text: "text-emerald-700",icon: "4", border: "border-emerald-200"},
  six:    { bg: "bg-amber-50",  text: "text-amber-700",  icon: "6", border: "border-amber-200" },
  wicket: { bg: "bg-red-50",    text: "text-red-700",    icon: "W", border: "border-red-200"   },
};

function ScoreCard({ match, history }) {
  return (
    <div className="card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900 text-sm">Scorecard</h2>
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
          {match.match_type.toUpperCase()} · {match.total_overs} ov
        </span>
      </div>

      {/* Big score */}
      <div className="text-center py-4">
        <div className="text-5xl font-black text-gray-900 tracking-tight">
          {match.runs}
          <span className="text-2xl text-gray-400 font-bold">/{match.wickets}</span>
        </div>
        <div className="text-sm text-gray-400 mt-1">
          Ov {match.over}.0 — {match.match_type.toUpperCase()}
        </div>
        {match.required_rr && (
          <div className="mt-1 text-xs text-amber-600 font-semibold">
            RRR: {match.required_rr.toFixed(2)}
          </div>
        )}
      </div>

      {/* CRR */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
          <p className="text-sm font-bold text-emerald-600">
            {match.over > 0 ? ((match.runs / match.over) * 6 / 6).toFixed(2) : "—"}
          </p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Run Rate</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
          <p className="text-sm font-bold text-blue-600">{10 - match.wickets}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Wickets Left</p>
        </div>
      </div>

      {/* Ball history */}
      {history.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 font-semibold">This Over</p>
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
    <div className="card rounded-2xl p-4 flex flex-col gap-2 max-h-48 overflow-y-auto">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Commentary
      </h3>
      {[...history].reverse().map((d, i) => {
        const s = OUTCOME_STYLES[d.outcome] || OUTCOME_STYLES.dot;
        return (
          <div key={i}
            className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${s.bg} ${s.border}`}>
            <span className={`font-black text-base leading-none w-5 text-center ${s.text}`}>
              {s.icon}
            </span>
            <p className="text-gray-600 leading-snug">{d.commentary}</p>
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

  React.useEffect(() => {
    if (lastDelivery) {
      setHistory(prev => {
        if (prev.length && prev[prev.length - 1] === lastDelivery) return prev;
        return [...prev, lastDelivery];
      });
    }
  }, [lastDelivery]);

  return (
    <div className="w-full max-w-[700px] flex flex-col gap-4">
      <ScoreCard match={match} history={history} />

      <CricketField
        fieldData={fieldData}
        loading={false}
        ballAnimation={ballAnimation}
        matchPhase={fieldData?.match_phase}
      />

      <button
        onClick={handleSimulate}
        className="w-full py-3.5 rounded-xl font-bold text-sm
                   bg-gray-900 hover:bg-gray-800 text-white
                   transition-all active:scale-[0.98]"
      >
        Bowl Next Delivery
      </button>

      {lastDelivery && (
        <div className={`card rounded-2xl p-5 text-center
          ${OUTCOME_STYLES[lastDelivery.outcome]?.bg || "bg-gray-50"}
          border ${OUTCOME_STYLES[lastDelivery.outcome]?.border || "border-gray-200"}`}>
          <div className={`text-4xl font-black mb-1.5 ${OUTCOME_STYLES[lastDelivery.outcome]?.text}`}>
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
          <p className="text-sm text-gray-600">{lastDelivery.commentary}</p>
          <p className="text-xs text-gray-400 mt-1 capitalize">
            Direction: {lastDelivery.ball_zone?.replace(/_/g, " ")}
          </p>
        </div>
      )}

      <CommentaryFeed history={history} />
    </div>
  );
}
