"""
Cricket field position definitions.
Coordinates are in a 700x700 SVG space, center at (350, 350).
Field boundary radius: 300px
30-yard circle radius: 165px

Coordinate convention (for right-handed batsman):
  - x increases rightward (off side)
  - y increases downward (bowler's end is at bottom)
  - Batsman crease at y ≈ 240 (top of pitch)
  - Bowler crease at y ≈ 460 (bottom of pitch)
"""

# Each position: (x, y, side) where side = 'off', 'on', or 'center'
FIELD_POSITIONS = {
    # Wicket keeper zone
    "keeper":           {"x": 350, "y": 188, "label": "WK",          "full": "Wicket Keeper",    "side": "center", "catching": True,  "deep": False},

    # Slip cordon (off side, behind batsman)
    "first_slip":       {"x": 382, "y": 193, "label": "1S",          "full": "1st Slip",         "side": "off",    "catching": True,  "deep": False},
    "second_slip":      {"x": 408, "y": 200, "label": "2S",          "full": "2nd Slip",         "side": "off",    "catching": True,  "deep": False},
    "third_slip":       {"x": 432, "y": 210, "label": "3S",          "full": "3rd Slip",         "side": "off",    "catching": True,  "deep": False},
    "gully":            {"x": 458, "y": 226, "label": "GU",          "full": "Gully",            "side": "off",    "catching": True,  "deep": False},
    "leg_slip":         {"x": 320, "y": 195, "label": "LS",          "full": "Leg Slip",         "side": "on",     "catching": True,  "deep": False},
    "leg_gully":        {"x": 300, "y": 218, "label": "LG",          "full": "Leg Gully",        "side": "on",     "catching": True,  "deep": False},

    # Off-side inner ring
    "third_man_up":     {"x": 490, "y": 192, "label": "3M",          "full": "Third Man (up)",   "side": "off",    "catching": False, "deep": False},
    "backward_point":   {"x": 512, "y": 278, "label": "BP",          "full": "Backward Point",   "side": "off",    "catching": False, "deep": False},
    "point":            {"x": 512, "y": 318, "label": "PT",          "full": "Point",            "side": "off",    "catching": False, "deep": False},
    "cover_point":      {"x": 490, "y": 260, "label": "CP",          "full": "Cover Point",      "side": "off",    "catching": False, "deep": False},
    "cover":            {"x": 462, "y": 248, "label": "CV",          "full": "Cover",            "side": "off",    "catching": False, "deep": False},
    "extra_cover":      {"x": 432, "y": 242, "label": "EC",          "full": "Extra Cover",      "side": "off",    "catching": False, "deep": False},
    "mid_off":          {"x": 392, "y": 236, "label": "MO",          "full": "Mid Off",          "side": "off",    "catching": False, "deep": False},

    # On-side inner ring
    "mid_on":           {"x": 308, "y": 236, "label": "MN",          "full": "Mid On",           "side": "on",     "catching": False, "deep": False},
    "mid_wicket":       {"x": 268, "y": 262, "label": "MW",          "full": "Mid Wicket",       "side": "on",     "catching": False, "deep": False},
    "square_leg":       {"x": 200, "y": 318, "label": "SL",          "full": "Square Leg",       "side": "on",     "catching": False, "deep": False},
    "forward_sq_leg":   {"x": 220, "y": 290, "label": "FL",          "full": "Fwd Square Leg",   "side": "on",     "catching": False, "deep": False},

    # Silly / short catching positions
    "silly_mid_off":    {"x": 378, "y": 275, "label": "SO",          "full": "Silly Mid Off",    "side": "off",    "catching": True,  "deep": False},
    "silly_mid_on":     {"x": 322, "y": 275, "label": "SN",          "full": "Silly Mid On",     "side": "on",     "catching": True,  "deep": False},
    "short_mid_wicket": {"x": 285, "y": 292, "label": "SM",          "full": "Short Mid Wicket", "side": "on",     "catching": True,  "deep": False},
    "short_cover":      {"x": 430, "y": 265, "label": "SC",          "full": "Short Cover",      "side": "off",    "catching": True,  "deep": False},
    "short_third_man":  {"x": 468, "y": 408, "label": "ST",          "full": "Short Third Man",  "side": "off",    "catching": False, "deep": False},
    "short_fine_leg":   {"x": 268, "y": 418, "label": "SF",          "full": "Short Fine Leg",   "side": "on",     "catching": False, "deep": False},

    # Deep fielders
    "long_off":         {"x": 402, "y": 105, "label": "LO",          "full": "Long Off",         "side": "off",    "catching": False, "deep": True},
    "long_on":          {"x": 298, "y": 105, "label": "LN",          "full": "Long On",          "side": "on",     "catching": False, "deep": True},
    "deep_extra_cover": {"x": 590, "y": 225, "label": "DE",          "full": "Deep Extra Cover", "side": "off",    "catching": False, "deep": True},
    "deep_cover":       {"x": 595, "y": 295, "label": "DC",          "full": "Deep Cover",       "side": "off",    "catching": False, "deep": True},
    "deep_point":       {"x": 595, "y": 340, "label": "DP",          "full": "Deep Point",       "side": "off",    "catching": False, "deep": True},
    "deep_mid_wicket":  {"x": 102, "y": 258, "label": "DM",          "full": "Deep Mid Wicket",  "side": "on",     "catching": False, "deep": True},
    "deep_square_leg":  {"x": 68,  "y": 340, "label": "DS",          "full": "Deep Square Leg",  "side": "on",     "catching": False, "deep": True},
    "third_man":        {"x": 502, "y": 510, "label": "TM",          "full": "Third Man",        "side": "off",    "catching": False, "deep": True},
    "fine_leg":         {"x": 258, "y": 512, "label": "FG",          "full": "Fine Leg",         "side": "on",     "catching": False, "deep": True},
    "long_leg":         {"x": 222, "y": 532, "label": "LL",          "full": "Long Leg",         "side": "on",     "catching": False, "deep": True},
    "mid_off_deep":     {"x": 392, "y": 572, "label": "MD",          "full": "Straight Hit",     "side": "center", "catching": False, "deep": True},
}

# Default field for each format/situation
DEFAULT_FIELDS = {
    "powerplay_pace": [
        "keeper", "first_slip", "second_slip", "gully",
        "point", "cover", "mid_off", "mid_on", "mid_wicket",
        "square_leg", "fine_leg"
    ],
    "powerplay_spin": [
        "keeper", "first_slip", "cover_point",
        "cover", "extra_cover", "mid_off", "mid_on",
        "mid_wicket", "square_leg", "short_fine_leg", "long_on"
    ],
    "middle_overs_pace": [
        "keeper", "first_slip", "gully",
        "point", "cover", "mid_off", "mid_on",
        "mid_wicket", "square_leg", "fine_leg", "third_man"
    ],
    "middle_overs_spin": [
        "keeper", "cover_point", "cover",
        "extra_cover", "mid_off", "mid_on",
        "mid_wicket", "long_on", "long_off", "fine_leg", "deep_square_leg"
    ],
    "death_overs": [
        "keeper", "fine_leg", "third_man",
        "long_off", "long_on", "deep_mid_wicket",
        "deep_cover", "mid_off", "mid_wicket",
        "deep_square_leg", "deep_extra_cover"
    ],
    "spin_attack": [
        "keeper", "first_slip", "silly_mid_off",
        "extra_cover", "cover", "mid_off",
        "mid_on", "mid_wicket", "square_leg",
        "long_on", "long_off"
    ],
    "aggressive_attack": [
        "keeper", "first_slip", "second_slip", "gully",
        "silly_mid_off", "cover", "mid_off",
        "mid_on", "mid_wicket", "square_leg", "fine_leg"
    ],
}

# Fielder color palette by role
FIELDER_COLORS = {
    "catching": "#ef4444",   # red
    "run_save":  "#3b82f6",  # blue
    "deep":      "#8b5cf6",  # purple
    "keeper":    "#f59e0b",  # amber
}
