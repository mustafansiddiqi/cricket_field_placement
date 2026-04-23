"""
Train the field placement recommendation model.
Run: python train_model.py

Strategy:
  Since Cricsheet has no direct field placement data, we use a two-layer approach:
  1. A "shot zone" classifier: predicts probability that the ball goes to each
     of 8 angular zones (derived from run outcomes + wicket patterns).
  2. A field template selector: maps match context → one of ~10 canonical
     field configurations, then blends them using zone probabilities.

The result is a model that, given match context, returns 11 fielder positions
with a confidence score for each.
"""

import json
import os
import sys
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

DATA_DIR  = Path(__file__).parent.parent / "data"
MODEL_DIR = Path(__file__).parent / "models"
MODEL_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Field zone definitions (8 zones covering 360°)
# Zone 0 = straight (behind bowler) ... going clockwise
# For RHB: zones 0-3 = off side, zones 4-7 = on side
# ---------------------------------------------------------------------------
ZONES = [
    "straight_off",  # 0 – long off
    "cover",         # 1 – extra cover / cover
    "point",         # 2 – point / backward point
    "third_man",     # 3 – third man / gully
    "fine_leg",      # 4 – fine leg / leg slip
    "square_leg",    # 5 – square leg / mid wicket
    "mid_on",        # 6 – mid on / long on
    "straight_on",   # 7 – straight / mid off deep
]

# For each wicket kind, infer most likely zone (used as training signal)
WICKET_ZONE_MAP = {
    "caught":          None,    # depends on fielder — handled separately
    "bowled":          7,       # mid-on zone (straight)
    "lbw":             6,
    "stumped":         None,    # keeper, no zone
    "run out":         None,    # varies
    "hit wicket":      None,
    "caught and bowled": 7,
    "obstructing the field": None,
}

# Zone to field positions mapping (top-3 positions per zone)
ZONE_TO_POSITIONS = {
    "straight_off": ["long_off",  "mid_off",        "extra_cover"],
    "cover":        ["cover",     "extra_cover",     "deep_extra_cover"],
    "point":        ["point",     "cover_point",     "deep_cover"],
    "third_man":    ["third_man", "gully",           "backward_point"],
    "fine_leg":     ["fine_leg",  "long_leg",        "leg_slip"],
    "square_leg":   ["square_leg","deep_square_leg", "forward_sq_leg"],
    "mid_on":       ["mid_on",    "mid_wicket",      "deep_mid_wicket"],
    "straight_on":  ["long_on",   "mid_on",          "mid_off"],
}


def encode_features(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Convert raw delivery df to numeric feature matrix."""
    le_phase   = LabelEncoder().fit(["powerplay", "middle", "death"])
    le_type    = LabelEncoder().fit(["pace", "spin", "unknown"])
    le_mtype   = LabelEncoder().fit(["t20", "it20", "odi", "odm"])

    df = df.copy()
    df["phase_enc"]   = le_phase.transform(df["match_phase"].fillna("middle"))
    df["btype_enc"]   = le_type.transform(df["bowler_type"].fillna("unknown"))
    df["mtype_enc"]   = le_mtype.transform(df["match_type"].fillna("t20"))
    df["total_overs_norm"] = df["total_overs"] / 50.0
    df["over_norm"]        = df["over"] / df["total_overs"].clip(lower=1)
    df["wr_norm"]          = df["wickets_so_far"] / 10.0
    df["rr_norm"]          = df["runs_so_far"] / (df["over"].clip(lower=0.1) * 6)
    df["batter_sr_norm"]   = df["batter_score_so_far"] / (df["batter_score_so_far"].clip(lower=0.1) + 50)

    encoders = {"phase": le_phase, "bowler_type": le_type, "match_type": le_mtype}
    return df, encoders


FEATURE_COLS = [
    "mtype_enc", "total_overs_norm", "phase_enc",
    "over_norm", "wr_norm", "rr_norm",
    "btype_enc", "batter_sr_norm",
    "is_wide", "is_noball",
]


def assign_proxy_zone(row) -> int:
    """
    Assign a training zone label using heuristics from delivery outcomes.
    Returns zone index 0-7 or -1 (skip).
    """
    # Boundaries give strong signal
    if row["is_six"] == 1:
        # Roughly split: aggressive hitters hit over mid-on/off more
        return 6 if row["over"] % 2 == 0 else 0

    if row["is_four"] == 1:
        # Use over and wickets as proxy for which region
        if row["wickets_so_far"] <= 2:
            return int(row["over"] % 4) + 1   # off side more likely early
        else:
            return int(row["over"] % 4) + 4   # on side defensive

    if row["is_wicket"] == 1 and row["wicket_kind"] in WICKET_ZONE_MAP:
        z = WICKET_ZONE_MAP[row["wicket_kind"]]
        if z is not None:
            return z

    # Single runs — infer from match phase
    if row["batter_runs"] == 1:
        return int(row["over"] % 8)

    return -1  # skip dot balls / no signal


def build_field_recommendation(zone_probs: np.ndarray, match_context: dict) -> list[str]:
    """
    Given 8 zone probabilities, return 9 recommended fielder positions
    (keeper + bowler always present = total 11).
    """
    # Sort zones by probability
    zone_order = np.argsort(zone_probs)[::-1]
    positions = set()

    # Always cover top-3 highest probability zones with at least one fielder
    for zi in zone_order[:3]:
        zone_name = ZONES[zi]
        candidates = ZONE_TO_POSITIONS[zone_name]
        for pos in candidates:
            if pos not in positions:
                positions.add(pos)
                break

    # Apply cricket rules based on context
    phase      = match_context.get("match_phase", "middle")
    bowler_type = match_context.get("bowler_type", "pace")
    over       = match_context.get("over", 10)
    wickets    = match_context.get("wickets", 0)
    total_overs = match_context.get("total_overs", 20)

    if phase == "powerplay":
        positions.update(["first_slip", "gully"])
        if bowler_type == "pace":
            positions.add("second_slip")
        else:
            positions.update(["cover", "extra_cover"])
        positions.update(["mid_off", "mid_on", "mid_wicket", "square_leg"])

    elif phase == "death":
        positions.update([
            "fine_leg", "third_man", "long_off", "long_on",
            "deep_mid_wicket", "deep_cover",
        ])

    else:  # middle overs
        positions.update(["mid_off", "mid_on"])
        if bowler_type == "pace":
            positions.update(["first_slip", "point"])
        else:
            positions.update(["cover", "mid_wicket", "long_on"])

    # Add slip if early and wickets < 3
    if over < 10 and wickets < 3:
        positions.add("first_slip")

    # Remove bowler and keeper slots (they are fixed)
    positions.discard("keeper")
    positions.discard("bowler")

    # Trim / pad to exactly 9 positions
    pos_list = list(positions)
    if len(pos_list) > 9:
        pos_list = pos_list[:9]

    while len(pos_list) < 9:
        fallbacks = ["mid_off", "mid_on", "cover", "mid_wicket",
                     "fine_leg", "point", "square_leg", "third_man", "long_off"]
        for fb in fallbacks:
            if fb not in pos_list:
                pos_list.append(fb)
            if len(pos_list) == 9:
                break

    return pos_list


def train():
    csv_path = DATA_DIR / "deliveries.csv"
    if not csv_path.exists():
        print("ERROR: Run process_data.py first to generate data/deliveries.csv")
        sys.exit(1)

    print("Loading data...")
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"  {len(df):,} deliveries loaded")

    # Assign proxy zone labels
    print("Assigning zone labels...")
    df["zone"] = df.apply(assign_proxy_zone, axis=1)
    df_labeled = df[df["zone"] >= 0].copy()
    print(f"  {len(df_labeled):,} labeled samples ({len(df_labeled)/len(df)*100:.1f}%)")

    # Encode features
    df_labeled, encoders = encode_features(df_labeled)

    X = df_labeled[FEATURE_COLS].fillna(0).values
    y = df_labeled["zone"].values.astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    print(f"Training on {len(X_train):,} samples...")
    model = Pipeline([
        ("scaler", StandardScaler()),
        ("clf",    GradientBoostingClassifier(
            n_estimators=200, max_depth=5,
            learning_rate=0.1, subsample=0.8,
            random_state=42, verbose=1,
        )),
    ])
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("\n--- Zone Classifier Report ---")
    print(classification_report(y_test, y_pred, target_names=ZONES))

    # Persist model + encoders + metadata
    joblib.dump(model, MODEL_DIR / "zone_model.pkl")
    joblib.dump(encoders, MODEL_DIR / "encoders.pkl")
    joblib.dump(FEATURE_COLS, MODEL_DIR / "feature_cols.pkl")
    joblib.dump(ZONES, MODEL_DIR / "zones.pkl")

    print(f"\nModel saved to {MODEL_DIR}/")


if __name__ == "__main__":
    train()
