# Cricket Field Placement Model

An ML-powered tool that recommends cricket field placements based on match context.
It combines a machine-learning model trained on real Cricsheet ball-by-ball data with a rule-based fallback, and presents everything through an interactive React frontend.

---

## How it works

### Data pipeline

Cricsheet JSON match files (T20s, IT20s, ODIs, ODMs) are parsed by `process_data.py` into two CSVs:

- `data/deliveries.csv` — one row per ball with match context, bowler type, run outcomes, wicket kind, extras, running score/wickets
- `data/player_stats.csv` — aggregated bowling stats per player (economy, dot %, wicket rate)

### ML model

`train_model.py` trains a **Gradient Boosting Classifier** (scikit-learn) to predict which of 8 field zones a ball is most likely to go to:

| Zone | Description |
|------|-------------|
| `straight_off` | Long off region |
| `cover` | Extra cover / cover |
| `point` | Point / backward point |
| `third_man` | Third man / gully |
| `fine_leg` | Fine leg / leg slip |
| `square_leg` | Square leg / mid wicket |
| `mid_on` | Mid on / long on |
| `straight_on` | Straight / mid off deep |

Because Cricsheet has no direct field placement data, zone labels are derived as a proxy from ball outcomes (boundaries, wicket kinds, singles) — a two-layer heuristic described in `train_model.py`.

Features used: match type, match phase (powerplay/middle/death), over number, wickets fallen, run rate, bowler type, batter strike rate, wides/no-balls.

### API

`backend/api.py` exposes:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Status + whether the ML model is loaded |
| `/field` | POST | Main recommendation — returns 11 fielder positions + zone confidence scores |
| `/simulate-delivery` | POST | Simulates a delivery outcome with weighted probabilities per phase |
| `/player-stats/{name}` | GET | Bowling stats for a named player |
| `/players/search` | GET | Fuzzy player name search |
| `/match-templates` | GET | All default field templates |
| `/field-positions` | GET | All defined field positions with coordinates |

If the ML model hasn't been trained yet, the API falls back to a rule-based engine that selects from canonical field templates and adjusts for batsman style, bowler type, left/right hand, and weather.

### Frontend (React + Vite)

Five components:

- **`MatchControls`** — inputs for match type, over, wickets, runs, bowler type, batsman hand/style, weather, player names
- **`CricketField`** — SVG cricket oval rendering all 11 fielder positions, colour-coded by role (keeper, catching, run-saving, deep)
- **`DeliverySimulator`** — step through deliveries one at a time; updates score and refreshes the field after each ball
- **`StatsPanel`** — shows zone confidence scores and match phase
- **`Header`** — title bar

---

## Project structure

```
cricket_field_placement/
├── backend/
│   ├── api.py               # FastAPI app
│   ├── field_positions.py   # All field position coordinates + default templates
│   ├── process_data.py      # Cricsheet JSON → deliveries.csv + player_stats.csv
│   ├── train_model.py       # Train zone classifier
│   ├── models/              # Saved model artefacts (after training)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── CricketField.jsx
│           ├── DeliverySimulator.jsx
│           ├── Header.jsx
│           ├── MatchControls.jsx
│           └── StatsPanel.jsx
├── t20s_json/               # Cricsheet T20 match files
├── it20s_json/              # Cricsheet IT20 match files
├── odis_json/               # Cricsheet ODI match files
├── odms_json/               # Cricsheet ODM match files
├── setup.sh                 # One-time setup script
└── run.sh                   # Start both servers
```

---

## Setup

Run once to install dependencies, process data, and train the model:

```bash
./setup.sh
```

This takes 5–15 minutes depending on how many match files are present.

---

## Running

```bash
./run.sh
```

| Service | URL |
|---------|-----|
| App | http://localhost:3000 |
| API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

Press `Ctrl+C` to stop both servers.

---

## Manual steps (if needed)

```bash
# Backend only
cd backend
pip install -r requirements.txt
python process_data.py   # parse Cricsheet data
python train_model.py    # train model
uvicorn api:app --reload --port 8000

# Frontend only
cd frontend
npm install
npm run dev
```

---

## Data source

Match data is from [Cricsheet](https://cricsheet.org) — ball-by-ball JSON files for T20, IT20, ODI, and ODM formats.