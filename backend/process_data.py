"""
Parse Cricsheet JSON files and extract ML-ready features.
Run once: python process_data.py
Outputs: data/deliveries.csv, data/player_stats.csv
"""

import json
import os
import re
import glob
import pandas as pd
import numpy as np
from pathlib import Path
from collections import defaultdict

DATA_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = DATA_ROOT / "data"
OUTPUT_DIR.mkdir(exist_ok=True)

FOLDERS = {
    "t20":  DATA_ROOT / "t20s_json",
    "it20": DATA_ROOT / "it20s_json",
    "odi":  DATA_ROOT / "odis_json",
    "odm":  DATA_ROOT / "odms_json",
}

# Known bowler types (curated list for common players)
# We'll build a broader list from data patterns
KNOWN_BOWLER_TYPES = {
    # Pace
    "SL Malinga": "fast", "JJ Bumrah": "fast", "MA Starc": "fast",
    "KJ Abbott": "fast", "DW Steyn": "fast", "M Morkel": "fast",
    "Mohammad Amir": "fast", "Wahab Riaz": "fast", "Hasan Ali": "fast",
    "TG Southee": "fast", "NL McCullum": "fast", "TA Boult": "fast",
    "JM Anderson": "fast", "SCJ Broad": "fast", "BA Stokes": "medium",
    "CR Woakes": "medium", "DJ Willey": "medium", "MA Wood": "fast",
    "MJ Henry": "fast", "LH Ferguson": "fast",
    # Spin
    "R Ashwin": "off-spin", "Harbhajan Singh": "off-spin",
    "JO Holder": "medium", "Shakib Al Hasan": "left-arm-spin",
    "Imran Tahir": "leg-spin", "YS Chahal": "leg-spin",
    "KYK Warsame": "off-spin", "AC Agar": "left-arm-spin",
    "MJ Santner": "left-arm-spin", "I Sodhi": "leg-spin",
    "Rashid Khan": "leg-spin", "Mujeeb Ur Rahman": "off-spin",
    "Tabraiz Shamsi": "left-arm-spin", "PP Chawla": "leg-spin",
}

PACE_KEYWORDS = ["fast", "medium", "pace"]
SPIN_KEYWORDS = ["spin", "off-spin", "leg-spin", "left-arm-spin"]


def classify_bowler_type(name: str) -> str:
    if name in KNOWN_BOWLER_TYPES:
        t = KNOWN_BOWLER_TYPES[name]
        if any(k in t for k in PACE_KEYWORDS):
            return "pace"
        return "spin"
    return "unknown"


def get_match_phase(over: int, total_overs: int) -> str:
    if total_overs == 20:
        if over < 6:
            return "powerplay"
        elif over < 16:
            return "middle"
        else:
            return "death"
    else:  # ODI
        if over < 10:
            return "powerplay"
        elif over < 40:
            return "middle"
        else:
            return "death"


def extract_deliveries(filepath: str, match_type: str) -> list:
    try:
        with open(filepath) as f:
            data = json.load(f)
    except Exception:
        return []

    info = data.get("info", {})
    innings_list = data.get("innings", [])
    total_overs = info.get("overs", 20)
    match_date = info.get("dates", [""])[0]
    venue = info.get("venue", "unknown")
    gender = info.get("gender", "male")

    rows = []
    for inning_idx, inning in enumerate(innings_list):
        batting_team = inning.get("team", "")
        overs = inning.get("overs", [])

        # Running score trackers
        runs_so_far = 0
        wickets_so_far = 0
        batter_runs = defaultdict(int)
        bowler_wickets = defaultdict(int)
        bowler_runs = defaultdict(int)
        bowler_balls = defaultdict(int)

        for over_data in overs:
            over_num = over_data.get("over", 0)
            deliveries = over_data.get("deliveries", [])

            for ball_idx, delivery in enumerate(deliveries):
                batter = delivery.get("batter", "")
                bowler = delivery.get("bowler", "")
                non_striker = delivery.get("non_striker", "")
                runs_obj = delivery.get("runs", {})
                batter_run = runs_obj.get("batter", 0)
                total_run = runs_obj.get("total", 0)
                extras_obj = delivery.get("extras", {})
                wickets = delivery.get("wickets", [])

                is_wicket = len(wickets) > 0
                wicket_kind = wickets[0].get("kind", "") if is_wicket else ""

                # Fielders involved in dismissal
                fielders = []
                if is_wicket and wickets:
                    fielders = [f.get("name", "") for f in wickets[0].get("fielders", [])]

                is_wide = "wides" in extras_obj
                is_noball = "noballs" in extras_obj
                is_boundary = batter_run in [4, 6]

                bowler_type = classify_bowler_type(bowler)

                rows.append({
                    "match_id": Path(filepath).stem,
                    "match_type": match_type,
                    "date": match_date,
                    "venue": venue,
                    "gender": gender,
                    "inning": inning_idx + 1,
                    "over": over_num,
                    "ball": ball_idx,
                    "match_phase": get_match_phase(over_num, total_overs),
                    "total_overs": total_overs,
                    "batter": batter,
                    "bowler": bowler,
                    "non_striker": non_striker,
                    "batter_runs": batter_run,
                    "total_runs": total_run,
                    "is_boundary": int(is_boundary),
                    "is_six": int(batter_run == 6),
                    "is_four": int(batter_run == 4),
                    "is_dot": int(batter_run == 0 and not is_wicket),
                    "is_wicket": int(is_wicket),
                    "wicket_kind": wicket_kind,
                    "fielders": "|".join(fielders),
                    "is_wide": int(is_wide),
                    "is_noball": int(is_noball),
                    "runs_so_far": runs_so_far,
                    "wickets_so_far": wickets_so_far,
                    "batter_score_so_far": batter_runs[batter],
                    "bowler_wickets_so_far": bowler_wickets[bowler],
                    "bowler_economy_so_far": (
                        (bowler_runs[bowler] / (bowler_balls[bowler] / 6))
                        if bowler_balls[bowler] >= 6 else -1
                    ),
                    "bowler_type": bowler_type,
                })

                # Update trackers
                runs_so_far += total_run
                batter_runs[batter] += batter_run
                bowler_runs[bowler] += total_run
                bowler_balls[bowler] += 1
                if is_wicket:
                    wickets_so_far += 1
                    bowler_wickets[bowler] += 1

    return rows


def build_player_stats(df: pd.DataFrame) -> pd.DataFrame:
    """Compute per-player bowling stats to infer bowler type for unknowns."""
    bowler_df = df.groupby("bowler").agg(
        total_balls=("ball", "count"),
        total_runs=("total_runs", "sum"),
        total_wickets=("is_wicket", "sum"),
        boundaries_conceded=("is_boundary", "sum"),
        dots=("is_dot", "sum"),
    ).reset_index()
    bowler_df["economy"] = bowler_df["total_runs"] / (bowler_df["total_balls"] / 6)
    bowler_df["dot_pct"] = bowler_df["dots"] / bowler_df["total_balls"]
    bowler_df["wicket_rate"] = bowler_df["total_wickets"] / bowler_df["total_balls"]
    return bowler_df


def main():
    all_rows = []
    total_files = 0
    processed = 0

    for match_type, folder in FOLDERS.items():
        if not folder.exists():
            print(f"  Skipping {folder} (not found)")
            continue
        files = list(folder.glob("*.json"))
        total_files += len(files)
        print(f"Processing {len(files)} {match_type} files...")

        for i, fp in enumerate(files):
            rows = extract_deliveries(str(fp), match_type)
            all_rows.extend(rows)
            processed += 1
            if (i + 1) % 500 == 0:
                print(f"  {i+1}/{len(files)} done ({len(all_rows):,} deliveries so far)")

    print(f"\nTotal: {processed} files, {len(all_rows):,} deliveries")

    df = pd.DataFrame(all_rows)

    # Save deliveries
    out_path = OUTPUT_DIR / "deliveries.csv"
    df.to_csv(out_path, index=False)
    print(f"Saved deliveries → {out_path}")

    # Save player stats
    stats = build_player_stats(df)
    stats_path = OUTPUT_DIR / "player_stats.csv"
    stats.to_csv(stats_path, index=False)
    print(f"Saved player stats → {stats_path}")

    # Quick summary
    print("\n--- Summary ---")
    print(df["match_type"].value_counts().to_string())
    print(f"Unique batters: {df['batter'].nunique()}")
    print(f"Unique bowlers: {df['bowler'].nunique()}")
    print(f"Total wickets: {df['is_wicket'].sum():,}")
    print(f"Total boundaries: {df['is_boundary'].sum():,}")


if __name__ == "__main__":
    main()
