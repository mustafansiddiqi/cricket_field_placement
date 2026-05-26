import React, { useState, useRef } from "react";

// SVG field dimensions
const CX = 350, CY = 350;    // center
const OR = 298;               // outer boundary radius
const IR = 163;               // 30-yard circle radius
const PW = 22;                // pitch width (half)
const PH = 120;               // pitch half-height (from center)

// Phase color themes
const PHASE_THEMES = {
  powerplay: { ring: "#fbbf24", label: "Powerplay",  glow: "rgba(251,191,36,0.2)" },
  middle:    { ring: "#60a5fa", label: "Middle Overs",glow: "rgba(96,165,250,0.2)" },
  death:     { ring: "#f87171", label: "Death Overs", glow: "rgba(248,113,113,0.2)" },
};

function FielderDot({ pos, isKeeper, isNew }) {
  const [hovered, setHovered] = useState(false);
  const color = isKeeper ? "#f59e0b" : pos.deep ? "#a78bfa" : pos.catching ? "#f87171" : "#34d399";

  return (
    <g
      style={{ cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow ring on hover */}
      {hovered && (
        <circle cx={pos.x} cy={pos.y} r={16} fill="none"
          stroke={color} strokeWidth={2} opacity={0.5}
          style={{ animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite" }}
        />
      )}
      {/* Shadow */}
      <ellipse cx={pos.x} cy={pos.y + 2} rx={9} ry={4}
        fill="rgba(0,0,0,0.3)" />
      {/* Fielder circle */}
      <circle
        cx={pos.x} cy={pos.y} r={isKeeper ? 11 : 9}
        fill={color}
        stroke="white" strokeWidth={isKeeper ? 2 : 1.5}
        opacity={isNew ? 1 : 0.92}
        className="fielder-dot"
      />
      {/* Label */}
      <text
        x={pos.x} y={pos.y + 1}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={isKeeper ? 7 : 6.5}
        fontWeight="700"
        fill="white"
        style={{ userSelect: "none" }}
      >
        {pos.label || "F"}
      </text>

      {/* Tooltip */}
      {hovered && (
        <g>
          <rect
            x={pos.x - 45} y={pos.y - 34} width={90} height={22}
            rx={5} fill="rgba(0,0,0,0.85)" stroke={color} strokeWidth={1}
          />
          <text x={pos.x} y={pos.y - 20}
            textAnchor="middle" fontSize={9} fill="white" fontWeight="600">
            {pos.full || pos.label}
          </text>
        </g>
      )}
    </g>
  );
}

function ZoneHeatmap({ zoneScores }) {
  if (!zoneScores) return null;

  // 8 zones as wedge paths
  const zones = [
    { name: "straight_off", startAngle: -60,  endAngle: -30 },
    { name: "cover",        startAngle: -30,  endAngle:  0  },
    { name: "point",        startAngle: 0,    endAngle:  30 },
    { name: "third_man",    startAngle: 30,   endAngle:  70 },
    { name: "fine_leg",     startAngle: 110,  endAngle: 150 },
    { name: "square_leg",   startAngle: 150,  endAngle: 180 },
    { name: "mid_on",       startAngle: 180,  endAngle: 210 },
    { name: "straight_on",  startAngle: 210,  endAngle: 240 },
  ];

  return (
    <g opacity={0.25}>
      {zones.map(z => {
        const score = zoneScores[z.name] || 0;
        if (score < 0.05) return null;
        const intensity = Math.min(score * 4, 1);
        const color = `rgba(255, ${Math.round(200 - intensity * 150)}, 0, ${intensity * 0.8})`;

        const a1 = (z.startAngle - 90) * Math.PI / 180;
        const a2 = (z.endAngle   - 90) * Math.PI / 180;
        const x1 = CX + OR * Math.cos(a1);
        const y1 = CY + OR * Math.sin(a1);
        const x2 = CX + OR * Math.cos(a2);
        const y2 = CY + OR * Math.sin(a2);
        const large = (z.endAngle - z.startAngle) > 180 ? 1 : 0;

        return (
          <path
            key={z.name}
            d={`M ${CX} ${CY} L ${x1} ${y1} A ${OR} ${OR} 0 ${large} 1 ${x2} ${y2} Z`}
            fill={color}
          />
        );
      })}
    </g>
  );
}

export default function CricketField({ fieldData, loading, ballAnimation, matchPhase }) {
  const theme = PHASE_THEMES[matchPhase] || PHASE_THEMES.middle;
  const positions = fieldData?.positions || [];
  const zoneScores = fieldData?.zone_scores;

  return (
    <div className="relative w-full max-w-[700px] mx-auto">
      {/* Phase badge */}
      {matchPhase && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{ background: theme.glow, border: `1px solid ${theme.ring}`, color: theme.ring }}
          >
            {theme.label}
          </span>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-emerald-600 font-medium">Calculating field…</span>
          </div>
        </div>
      )}

      <svg
        viewBox="0 0 700 700"
        className="w-full"
        style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.12))" }}
      >
        {/* ── Definitions ── */}
        <defs>
          <radialGradient id="fieldGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#2d6a1a" />
            <stop offset="60%"  stopColor="#245815" />
            <stop offset="100%" stopColor="#1a4010" />
          </radialGradient>
          <radialGradient id="phaseGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor={theme.glow} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.5)" />
          </filter>
          <clipPath id="fieldClip">
            <circle cx={CX} cy={CY} r={OR + 2} />
          </clipPath>
          <pattern id="grassStripe" patternUnits="userSpaceOnUse" width="40" height="40" patternTransform="rotate(35)">
            <rect width="40" height="40" fill="#245815" />
            <rect width="20" height="40" fill="#2b6b1a" />
          </pattern>
        </defs>

        {/* ── Background ── */}
        <rect width="700" height="700" fill="#f9fafb" />

        {/* ── Outer field (clipped oval) ── */}
        <circle cx={CX} cy={CY} r={OR + 4} fill="url(#grassStripe)" />
        <circle cx={CX} cy={CY} r={OR + 4} fill="url(#fieldGrad)" opacity={0.6} />

        {/* ── Phase glow overlay ── */}
        <circle cx={CX} cy={CY} r={OR} fill="url(#phaseGlow)" opacity={0.4} />

        {/* ── Zone heatmap ── */}
        <ZoneHeatmap zoneScores={zoneScores} />

        {/* ── Boundary rope ── */}
        <circle cx={CX} cy={CY} r={OR}
          fill="none" stroke="white" strokeWidth={3} opacity={0.6}
          strokeDasharray="8 6"
        />
        <circle cx={CX} cy={CY} r={OR + 1}
          fill="none" stroke={theme.ring} strokeWidth={1} opacity={0.4} />

        {/* ── 30-yard circle ── */}
        <circle cx={CX} cy={CY} r={IR}
          fill="none" stroke="white" strokeWidth={1.5} opacity={0.35}
          strokeDasharray="5 8"
        />

        {/* ── Pitch rectangle ── */}
        <rect
          x={CX - PW} y={CY - PH}
          width={PW * 2} height={PH * 2}
          rx={3}
          fill="#c8a96e"
          stroke="#a07840" strokeWidth={1}
          filter="url(#shadow)"
        />
        {/* Crease lines */}
        <line x1={CX - PW} y1={CY - PH + 18} x2={CX + PW} y2={CY - PH + 18}
          stroke="white" strokeWidth={1.5} opacity={0.9} />
        <line x1={CX - PW} y1={CY + PH - 18} x2={CX + PW} y2={CY + PH - 18}
          stroke="white" strokeWidth={1.5} opacity={0.9} />
        {/* Stumps at batsman end */}
        {[-5, 0, 5].map(dx => (
          <line key={dx}
            x1={CX + dx} y1={CY - PH + 3}
            x2={CX + dx} y2={CY - PH + 18}
            stroke="#ef4444" strokeWidth={2} opacity={0.9}
          />
        ))}
        {/* Stumps at bowler end */}
        {[-5, 0, 5].map(dx => (
          <line key={dx}
            x1={CX + dx} y1={CY + PH - 3}
            x2={CX + dx} y2={CY + PH - 18}
            stroke="#6b7280" strokeWidth={2} opacity={0.7}
          />
        ))}

        {/* ── Batsman marker ── */}
        <circle cx={CX} cy={CY - PH + 25} r={6} fill="#fcd34d"
          stroke="white" strokeWidth={1.5} />
        <text x={CX} y={CY - PH + 25} textAnchor="middle"
          dominantBaseline="middle" fontSize={8} fill="#1a1a1a" fontWeight="bold">
          B
        </text>

        {/* ── Cardinal direction labels ── */}
        {[
          { x: CX, y: 28,       label: "LONG OFF / ON" },
          { x: 28,  y: CY + 6,  label: "DEEP SQ LEG" },
          { x: 672, y: CY + 6,  label: "DEEP COVER" },
          { x: CX, y: 678,      label: "THIRD MAN / FINE LEG" },
        ].map((d, i) => (
          <text key={i} x={d.x} y={d.y}
            textAnchor="middle" fontSize={7} fill="rgba(0,0,0,0.2)"
            fontWeight="600" letterSpacing="1" style={{ userSelect: "none" }}>
            {d.label}
          </text>
        ))}

        {/* ── Fielders ── */}
        {positions.map((pos, i) => (
          <FielderDot
            key={pos.key || i}
            pos={pos}
            isKeeper={pos.key === "keeper"}
            isNew={true}
          />
        ))}

        {/* ── Ball animation ── */}
        {ballAnimation && <BallTracer zone={ballAnimation} />}

        {/* ── Empty state ── */}
        {!fieldData && !loading && (
          <g>
            <circle cx={CX} cy={CY} r={60} fill="rgba(0,0,0,0.06)" />
            <text x={CX} y={CY - 12} textAnchor="middle" fontSize={28} fill="rgba(0,0,0,0.2)">🏏</text>
            <text x={CX} y={CY + 16} textAnchor="middle" fontSize={11}
              fill="rgba(0,0,0,0.3)" fontWeight="600">
              Set match context →
            </text>
            <text x={CX} y={CY + 32} textAnchor="middle" fontSize={9}
              fill="rgba(0,0,0,0.2)">
              Suggest Field
            </text>
          </g>
        )}

        {/* ── Fielder count badge ── */}
        {positions.length > 0 && (
          <g>
            <rect x={CX - 30} y={CY + PH + 8} width={60} height={18} rx={9}
              fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.12)" strokeWidth={1} />
            <text x={CX} y={CY + PH + 20} textAnchor="middle" fontSize={9}
              fill="rgba(0,0,0,0.5)" fontWeight="600">
              {positions.length} / 11 set
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
        {[
          { color: "#f59e0b", label: "Keeper" },
          { color: "#f87171", label: "Catcher" },
          { color: "#34d399", label: "Run Saver" },
          { color: "#a78bfa", label: "Deep" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Zone center coordinates for ball animation target
const ZONE_TARGETS = {
  straight_off: { x: 400, y: 80  },
  cover:        { x: 580, y: 200 },
  point:        { x: 600, y: 330 },
  third_man:    { x: 530, y: 530 },
  fine_leg:     { x: 220, y: 530 },
  square_leg:   { x: 80,  y: 340 },
  mid_on:       { x: 100, y: 240 },
  straight_on:  { x: 295, y: 80  },
};

function BallTracer({ zone }) {
  const target = ZONE_TARGETS[zone] || { x: CX, y: 80 };

  return (
    <g>
      {/* Ball path line */}
      <line x1={CX} y1={CY - 90} x2={target.x} y2={target.y}
        stroke="#fbbf24" strokeWidth={2} opacity={0.5} strokeDasharray="4 4">
        <animate attributeName="opacity" from="0.8" to="0" dur="0.8s" fill="freeze" />
      </line>
      {/* Ball circle */}
      <circle r={8} fill="#ef4444" stroke="#fbbf24" strokeWidth={2}>
        <animateMotion
          dur="0.7s"
          path={`M ${CX} ${CY - 90} Q ${(CX + target.x) / 2} ${Math.min(CY - 90, target.y) - 60} ${target.x} ${target.y}`}
          fill="freeze"
        />
        <animate attributeName="r" values="8;12;6" dur="0.7s" fill="freeze" />
      </circle>
      {/* Impact ring */}
      <circle cx={target.x} cy={target.y} r={4} fill="#fbbf24">
        <animate attributeName="r" from="4" to="20" dur="0.5s" begin="0.65s" fill="freeze" />
        <animate attributeName="opacity" from="0.8" to="0" dur="0.5s" begin="0.65s" fill="freeze" />
      </circle>
    </g>
  );
}
