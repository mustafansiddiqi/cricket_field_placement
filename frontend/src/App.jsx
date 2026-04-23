import React, { useState, useCallback } from "react";
import CricketField from "./components/CricketField";
import MatchControls from "./components/MatchControls";
import DeliverySimulator from "./components/DeliverySimulator";
import StatsPanel from "./components/StatsPanel";
import Header from "./components/Header";

const API = "/api";

const DEFAULT_MATCH = {
  match_type:    "t20",
  total_overs:   20,
  over:          0,
  wickets:       0,
  runs:          0,
  bowler_type:   "pace",
  batsman_hand:  "right",
  batsman_style: "balanced",
  weather:       "sunny",
  batsman_name:  "",
  bowler_name:   "",
  required_rr:   null,
};

export default function App() {
  const [match, setMatch]           = useState(DEFAULT_MATCH);
  const [fieldData, setFieldData]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [tab, setTab]               = useState("field");  // "field" | "simulate"
  const [lastDelivery, setLastDelivery] = useState(null);
  const [ballAnimation, setBallAnimation] = useState(null);

  // Fetch field placement from API
  const fetchField = useCallback(async (ctx = match) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/field`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(ctx),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFieldData(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [match]);

  // Simulate a delivery
  const simulateDelivery = useCallback(async () => {
    try {
      const res = await fetch(`${API}/simulate-delivery`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          batter:      match.batsman_name || "Batsman",
          bowler:      match.bowler_name  || "Bowler",
          match_type:  match.match_type,
          over:        match.over,
          ball:        0,
          wickets:     match.wickets,
          runs:        match.runs,
          total_overs: match.total_overs,
        }),
      });
      const result = await res.json();
      setLastDelivery(result);
      setBallAnimation(result.ball_zone);

      // Update match state
      const newMatch = {
        ...match,
        runs:    match.runs    + result.runs,
        wickets: match.wickets + (result.wicket ? 1 : 0),
      };
      setMatch(newMatch);
      setTimeout(() => {
        setBallAnimation(null);
        fetchField(newMatch);
      }, 1000);
    } catch (e) {
      setError(e.message);
    }
  }, [match, fetchField]);

  const handleMatchChange = (updates) => {
    const newMatch = { ...match, ...updates };
    setMatch(newMatch);
  };

  const handleSuggestField = () => fetchField(match);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col xl:flex-row gap-4 p-4 max-w-[1600px] mx-auto w-full">

        {/* Left: Controls */}
        <aside className="xl:w-80 flex flex-col gap-4 shrink-0">
          <MatchControls
            match={match}
            onChange={handleMatchChange}
            onSuggest={handleSuggestField}
            loading={loading}
          />
          {fieldData && (
            <StatsPanel
              fieldData={fieldData}
              match={match}
            />
          )}
        </aside>

        {/* Center: Field */}
        <section className="flex-1 flex flex-col items-center gap-4 min-w-0">

          {/* Tab bar */}
          <div className="flex gap-1 glass rounded-xl p-1 self-start">
            {["field", "simulate"].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {t === "field" ? "🏏 Field" : "⚡ Simulate"}
              </button>
            ))}
          </div>

          {error && (
            <div className="glass border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm w-full max-w-2xl">
              ⚠ {error} — Make sure the backend is running (<code>uvicorn api:app --reload</code>)
            </div>
          )}

          {tab === "field" ? (
            <CricketField
              fieldData={fieldData}
              loading={loading}
              ballAnimation={ballAnimation}
              matchPhase={fieldData?.match_phase}
            />
          ) : (
            <DeliverySimulator
              match={match}
              lastDelivery={lastDelivery}
              onSimulate={simulateDelivery}
              fieldData={fieldData}
              ballAnimation={ballAnimation}
            />
          )}
        </section>
      </main>
    </div>
  );
}
