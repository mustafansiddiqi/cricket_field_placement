"""
FastAPI backend for cricket field placement recommendations.
Run: uvicorn api:app --reload --port 8000
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT      = Path(__file__).parent
MODEL_DIR = ROOT / "models"
DATA_DIR  = ROOT.parent / "data"

app = FastAPI(title="Cricket Field Placement API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load model artefacts (graceful fallback if model not yet trained)
# ---------------------------------------------------------------------------
model     = None
encoders  = None
feat_cols = None
zones     = None
player_stats_df: Optional[pd.DataFrame] = None

def load_model():
    global model, encoders, feat_cols, zones, player_stats_df
    try:
        model     = joblib.load(MODEL_DIR / "zone_model.pkl")
        encoders  = joblib.load(MODEL_DIR / "encoders.pkl")
        feat_cols = joblib.load(MODEL_DIR / "feature_cols.pkl")
        zones     = joblib.load(MODEL_DIR / "zones.pkl")
        print("Model loaded successfully")
    except FileNotFoundError:
        print("WARNING: Model not trained yet — using rule-based fallback")

    stats_path = DATA_DIR / "player_stats.csv"
    if stats_path.exists():
        player_stats_df = pd.read_csv(stats_path)
        print(f"Player stats loaded: {len(player_stats_df)} players")

load_model()

# ---------------------------------------------------------------------------
# Field position definitions (imported inline to keep API self-contained)
# ---------------------------------------------------------------------------
from field_positions import FIELD_POSITIONS, DEFAULT_FIELDS

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class FieldRequest(BaseModel):
    match_type:   str = Field("t20",    description="t20 | odi | it20 | odm")
    over:         int = Field(1,        ge=0, le=49)
    wickets:      int = Field(0,        ge=0, le=9)
    runs:         int = Field(0,        ge=0)
    total_overs:  int = Field(20,       ge=10, le=50)
    bowler_type:  str = Field("pace",   description="pace | spin | unknown")
    batsman_hand: str = Field("right",  description="right | left")
    batsman_style:str = Field("balanced", description="aggressive | defensive | balanced")
    required_rr:  Optional[float] = Field(None, ge=0)
    weather:      Optional[str]   = Field(None, description="sunny | overcast | humid | dry")
    batsman_name: Optional[str]   = None
    bowler_name:  Optional[str]   = None


class DeliveryRequest(BaseModel):
    batter:       str
    bowler:       str
    match_type:   str = "t20"
    over:         int = 1
    ball:         int = 0
    wickets:      int = 0
    runs:         int = 0
    total_overs:  int = 20


class PlayerLookupRequest(BaseModel):
    name: str


# ---------------------------------------------------------------------------
# Helper: phase from over
# ---------------------------------------------------------------------------

def get_phase(over: int, total_overs: int) -> str:
    if total_overs == 20:
        if over < 6:  return "powerplay"
        if over < 16: return "middle"
        return "death"
    else:
        if over < 10:  return "powerplay"
        if over < 40: return "middle"
        return "death"


# ---------------------------------------------------------------------------
# Core field recommendation logic
# ---------------------------------------------------------------------------

def rule_based_field(req: FieldRequest) -> dict:
    """
    Heuristic field placement when model is unavailable or to supplement it.
    Returns positions list + zone_scores.
    """
    phase = get_phase(req.over, req.total_overs)
    bt    = req.bowler_type
    style = req.batsman_style
    hand  = req.batsman_hand  # left-hander mirrors off/on

    # Select template
    if phase == "powerplay":
        template = DEFAULT_FIELDS["powerplay_pace"] if bt == "pace" else DEFAULT_FIELDS["powerplay_spin"]
    elif phase == "death":
        template = DEFAULT_FIELDS["death_overs"]
    else:
        if bt == "spin":
            template = DEFAULT_FIELDS["middle_overs_spin"]
        else:
            template = DEFAULT_FIELDS["middle_overs_pace"]

    # Adjustments
    positions = list(template)

    # Aggressive batsman → more catchers, fewer deep
    if style == "aggressive":
        for d in ["deep_cover", "deep_mid_wicket", "long_off", "long_on"]:
            if d in positions:
                positions.remove(d)
        positions = (positions + ["first_slip", "gully", "cover_point"])[:11]

    # Defensive batsman → push fielders up
    if style == "defensive" and phase != "death":
        for s in ["first_slip", "second_slip", "gully"]:
            if s in positions:
                positions.remove(s)
        positions = (positions + ["deep_extra_cover", "deep_mid_wicket"])[:11]

    # Weather adjustments
    if req.weather == "overcast":
        if "first_slip" not in positions:
            positions = ["first_slip"] + positions[:10]
        if "second_slip" not in positions and bt == "pace":
            positions[1] = "second_slip"

    # Left-hander: mirror off/on labels
    if hand == "left":
        mirror = {
            "first_slip": "leg_slip", "second_slip": "leg_gully",
            "gully": "mid_wicket", "point": "square_leg",
            "cover_point": "forward_sq_leg", "cover": "mid_wicket",
            "extra_cover": "mid_wicket", "mid_off": "mid_on",
            "mid_on": "mid_off", "fine_leg": "third_man",
            "third_man": "fine_leg", "deep_cover": "deep_mid_wicket",
            "deep_mid_wicket": "deep_cover",
        }
        positions = [mirror.get(p, p) for p in positions]

    # Ensure keeper always present, deduplicate, trim to 11
    if "keeper" not in positions:
        positions = ["keeper"] + positions
    seen = []
    for p in positions:
        if p not in seen:
            seen.append(p)
    positions = seen[:11]

    # Zone confidence scores (heuristic)
    zone_scores = {
        "straight_off": 0.1, "cover": 0.15, "point": 0.12, "third_man": 0.08,
        "fine_leg": 0.10, "square_leg": 0.15, "mid_on": 0.15, "straight_on": 0.15,
    }
    if phase == "powerplay":
        zone_scores["cover"] = 0.25
        zone_scores["point"] = 0.20
    elif phase == "death":
        zone_scores["straight_off"] = 0.20
        zone_scores["straight_on"]  = 0.20
        zone_scores["mid_on"]       = 0.18
    if bt == "spin":
        zone_scores["cover"]    += 0.10
        zone_scores["mid_on"]   += 0.05
        zone_scores["third_man"] -= 0.05

    return {"positions": positions, "zone_scores": zone_scores}


def ml_field(req: FieldRequest) -> dict:
    """Use the trained model to predict zone probabilities."""
    from train_model import (
        ZONES, ZONE_TO_POSITIONS, build_field_recommendation,
        FEATURE_COLS
    )

    phase = get_phase(req.over, req.total_overs)

    le_phase = encoders["phase"]
    le_btype = encoders["bowler_type"]
    le_mtype = encoders["match_type"]

    mt = req.match_type if req.match_type in le_mtype.classes_ else "t20"
    bt = req.bowler_type if req.bowler_type in le_btype.classes_ else "unknown"

    over_norm   = req.over / max(req.total_overs, 1)
    wr_norm     = req.wickets / 10.0
    rr_norm     = req.runs / max(req.over * 6, 1)
    batter_sr   = 0.5  # default; could be enhanced with player lookup

    x = np.array([[
        le_mtype.transform([mt])[0],
        req.total_overs / 50.0,
        le_phase.transform([phase])[0],
        over_norm,
        wr_norm,
        rr_norm,
        le_btype.transform([bt])[0],
        batter_sr,
        0,  # is_wide
        0,  # is_noball
    ]])

    proba = model.predict_proba(x)[0]
    # Pad/trim to 8 zones if model has fewer classes
    zone_probs = np.zeros(8)
    for i, c in enumerate(model.named_steps["clf"].classes_):
        if c < 8:
            zone_probs[c] = proba[i]

    zone_scores = {ZONES[i]: float(zone_probs[i]) for i in range(8)}

    context = {
        "match_phase": phase,
        "bowler_type": bt,
        "over":        req.over,
        "wickets":     req.wickets,
        "total_overs": req.total_overs,
    }
    positions = build_field_recommendation(zone_probs, context)

    # Always include keeper
    if "keeper" not in positions:
        positions = ["keeper"] + positions

    return {"positions": positions, "zone_scores": zone_scores}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/field")
def get_field_placement(req: FieldRequest):
    """Main endpoint: return recommended field for the given match context."""
    try:
        if model is not None:
            result = ml_field(req)
        else:
            result = rule_based_field(req)

        # Enrich with position metadata
        enriched = []
        for pos_key in result["positions"]:
            if pos_key in FIELD_POSITIONS:
                p = FIELD_POSITIONS[pos_key].copy()
                p["key"] = pos_key
                enriched.append(p)

        return {
            "positions":    enriched,
            "zone_scores":  result["zone_scores"],
            "match_phase":  get_phase(req.over, req.total_overs),
            "model_used":   "ml" if model is not None else "rules",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simulate-delivery")
def simulate_delivery(req: DeliveryRequest):
    """
    Given a delivery context, simulate an outcome and return
    what happened + updated field suggestion.
    """
    import random

    phase = get_phase(req.over, req.total_overs)

    # Weighted outcome probabilities based on phase
    weights = {
        "powerplay": {"dot": 30, "single": 28, "two": 10, "four": 14, "six": 8, "wicket": 10},
        "middle":    {"dot": 35, "single": 30, "two": 10, "four": 10, "six": 5,  "wicket": 10},
        "death":     {"dot": 20, "single": 20, "two": 8,  "four": 18, "six": 15, "wicket": 9},
    }[phase]

    outcomes = list(weights.keys())
    probs    = [weights[o] for o in outcomes]
    total_w  = sum(probs)
    probs    = [p / total_w for p in probs]

    outcome = random.choices(outcomes, weights=probs)[0]

    runs_map = {"dot": 0, "single": 1, "two": 2, "four": 4, "six": 6, "wicket": 0}
    runs = runs_map[outcome]

    wicket_kinds = ["bowled", "caught", "lbw", "run out", "stumped"]
    wicket_kind  = random.choice(wicket_kinds) if outcome == "wicket" else None

    # Random zone for ball direction
    zone_weights = {
        "dot":    [0.2, 0.15, 0.1, 0.1, 0.1, 0.1, 0.1, 0.15],
        "single": [0.1, 0.15, 0.15, 0.1, 0.1, 0.15, 0.15, 0.1],
        "two":    [0.1, 0.2, 0.1, 0.1, 0.1, 0.1, 0.2, 0.1],
        "four":   [0.1, 0.2, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1],
        "six":    [0.15, 0.1, 0.1, 0.05, 0.1, 0.1, 0.25, 0.15],
        "wicket": [0.1, 0.1, 0.1, 0.2, 0.05, 0.1, 0.1, 0.25],
    }[outcome]

    zone_names = ["straight_off","cover","point","third_man","fine_leg","square_leg","mid_on","straight_on"]
    ball_zone  = random.choices(zone_names, weights=zone_weights)[0]

    # Commentary
    commentary_map = {
        "dot":    [f"Tight delivery — {req.batter} defends solidly.", f"Dot ball! Great bowling by {req.bowler}."],
        "single": [f"Pushed to {ball_zone.replace('_',' ')} for a single.", f"Quick single taken by {req.batter}."],
        "two":    [f"Driven well — they run two!", f"Good running between the wickets, two taken."],
        "four":   [f"FOUR! Cracking shot through {ball_zone.replace('_',' ')}!", f"Punched away for four!"],
        "six":    [f"SIX! Massive hit over {ball_zone.replace('_',' ')}!", f"Into the stands! {req.batter} is in form!"],
        "wicket": [f"OUT! {wicket_kind.upper()}! {req.bowler} strikes!", f"Huge wicket! {req.batter} is gone — {wicket_kind}."],
    }

    import random as rnd
    commentary = rnd.choice(commentary_map[outcome])

    return {
        "outcome":      outcome,
        "runs":         runs,
        "wicket":       outcome == "wicket",
        "wicket_kind":  wicket_kind,
        "ball_zone":    ball_zone,
        "commentary":   commentary,
        "phase":        phase,
    }


@app.get("/player-stats/{name}")
def get_player_stats(name: str):
    if player_stats_df is None:
        raise HTTPException(status_code=503, detail="Player stats not loaded (run process_data.py first)")
    row = player_stats_df[player_stats_df["bowler"].str.lower() == name.lower()]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Player '{name}' not found")
    return row.iloc[0].to_dict()


@app.get("/players/search")
def search_players(q: str = "", limit: int = 10):
    if player_stats_df is None:
        return {"players": []}
    mask = player_stats_df["bowler"].str.lower().str.contains(q.lower(), na=False)
    results = player_stats_df[mask].head(limit)["bowler"].tolist()
    return {"players": results}


@app.get("/match-templates")
def get_templates():
    """Return all default field templates with enriched position data."""
    out = {}
    for name, positions in DEFAULT_FIELDS.items():
        enriched = []
        for p in positions:
            if p in FIELD_POSITIONS:
                info = FIELD_POSITIONS[p].copy()
                info["key"] = p
                enriched.append(info)
        out[name] = enriched
    return out


@app.get("/field-positions")
def get_all_positions():
    """Return all defined field positions."""
    return {k: {**v, "key": k} for k, v in FIELD_POSITIONS.items()}
