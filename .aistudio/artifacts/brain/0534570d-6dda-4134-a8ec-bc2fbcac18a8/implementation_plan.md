# Bus Fever 3D: TV Wide-Screen 30/10/60 Zone Proportions & Deep Blocker Puzzle Overhaul

Rebalances the **TV / Wide-Screen 3-Column Layout** so **Zone 1 (Passenger Queue)** occupies **30%** of the width, **Zone 2 (Parking Bays)** occupies **10%** directly adjacent to the boarding gate, and **Zone 3 (Vehicle Puzzle Grid)** commands **60%** of the viewport, while overhauling stage generation and queue ordering from **Level 4 onward** with **dense 12–24 vehicle grids** and **deep interlocking blocker chains** that bury the needed passenger color behind decoy vehicles.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All core layout and puzzle-difficulty decisions below have been confirmed from your requirements and answers:

- **Confirmed Decision 1 — TV Wide-Screen 30% / 10% / 60% Viewport Allocation & Tighter Z1–Z2 Spacing**:
  - **Zone 1 (Left — Passenger Queue Loop & Feeder Line)**: Compacted to **30% of the horizontal world span** (`worldX: -12.6` to `-4.2`), with the feeder queue curving tightly above/behind the turning circle instead of stretching far to the left, and the **Boarding Door Ground Pad** positioned right next to Zone 2 (`worldX = -4.25`).
  - **Zone 2 (Center-Left — 8 Angled Parking Bays)**: Occupies **10% of the horizontal world span** (`worldX: -4.2` to `-1.4`, centered at `worldX = -2.80`), cutting the gap between the Z1 Boarding Door Pad and the Z2 Parking Bays by more than **65%** (`1.45` world units from gate to bay center so boarding runners sprint straight across in a fraction of a second).
  - **Zone 3 (Right — Transportation Vehicle Puzzle Lot)**: Expands to **60% of the horizontal world span** (`worldX: -1.1` to `+15.7`), giving the puzzle grid dominant visual presence on TV and wide monitors and easily accommodating larger $8\times 8$ to $10\times 10$ grids with **12 to 24 vehicles**.
- **Confirmed Decision 2 — Sharp Difficulty Ramp Starting at Level 4**:
  - Levels 1–3 remain approachable onboarding stations, while **Level 4+ ramps up sharply** with denser grids, multi-layer blocker chains, and strict front-of-door passenger queue ordering.
- **Confirmed Decision 3 — Deep Blocker Chains Hiding the Needed Color Bus**:
  - Instead of ordering the passenger queue to match the easiest unblocked perimeter vehicles first, the solver now constructs **Blocker-Depth Inversion Waves**: the passenger queue demands the color of a vehicle that is **buried 1 to 3 blockers deep**, forcing the player to strategically spend their limited free parking bays on blocking decoy vehicles to free the target vehicle before the dock fills up.
- **Confirmed Decision 4 — Dense 12 to 24 Vehicle Grids with Interlocking Blockers**:
  - Both curated stations (from Station 4 upward) and procedural stations scale up to **12–24 vehicles** across $7\times 7$, $8\times 8$, $9\times 9$, and $10\times 10$ city lots using a **Reverse-Layer Dependency Builder** where inner vehicles are placed first and outer vehicles are explicitly oriented to block their exit rays.

---

## 1. Overview & Core Concept

### Why Levels Felt Too Easy Before (Root-Cause Diagnosis)
1. **Unblocked-First Queue Ordering**: Previously, the passenger queue generator simulated peeling the easiest unblocked perimeter vehicles first and put *their* colors at the front of the passenger queue. That meant the vehicle you needed was almost always already unblocked on the outer edge of the lot!
2. **Shallow Blocker Chains in Procedural Stages**: The stage generator previously rejected candidate placements if they were blocked (`if (!blocker) chosen = candidate`), which produced flat grids where nearly every vehicle could drive straight out without moving another vehicle first.
3. **Generous Multi-Row Boarding Window**: Because `waveSegCount` only interleaved 2–3 vehicles while the player had 4 unlocked parking bays, players could tap almost any unblocked vehicle in any order without ever running out of bays.

### How the New Puzzle Engine Creates Genuine Strategic Tension
We are introducing **5 interlocking challenge systems** that work together while guaranteeing **100% deterministic solvability** (every stage is verified by a bounded-bay state solver before loading):

1. **Deep Blocker-Chain Grid Construction (1 to 3 Blockers Deep)**:
   - Vehicles are layered so high-value coaches (`bus` = 25, `double_bus` = 40, `minibus` = 15) sit inside the grid with **1, 2, or 3 decoy vehicles** (often compact 3-seat `taxi`s or wrong-color `minibus`es) positioned directly across their forward exit path.
2. **Blocker-Buried Queue Ordering ("Decoy Uncover" Waves)**:
   - Starting at **Level 4**, for each wave of the puzzle, the queue generator intentionally places the color of a **blocked inner vehicle** at the front of the passenger queue *before* the colors of the 1–2 unblocked decoy vehicles sitting in front of it.
   - To clear that inner vehicle, the player **must** identify which outer vehicles block its ray, park those blockers in their limited temporary bays (consuming 1–3 bays), and then dispatch the freed target vehicle so it boards and clears the queue!
   - If the player taps the wrong outer vehicle (one that doesn't unblock the needed color), they waste a critical parking bay and risk a **Parking Bays Full** deadlock.
3. **Dense 12 to 24 Vehicle Grids**:
   - **Levels 1–3**: 6–9 vehicles (warm-up stations).
   - **Levels 4–10**: **12–15 vehicles** on $7\times 7$ and $8\times 8$ grids with 1–2 blocker depth.
   - **Levels 11–30**: **15–18 vehicles** on $8\times 8$ and $9\times 9$ grids with 2–3 blocker depth.
   - **Levels 31–100 & Boss Stations**: **18–24 vehicles** on $9\times 9$ and $10\times 10$ grids with tight interlocking chains and active stage mechanics.
4. **Strict Door-Pad Front Queue Matching**:
   - Only the passenger row actively stepping across the **Boarding Door Ground Pad** (representing the immediate front of the queue) can board a parked vehicle—parked vehicles of later colors must wait in their bays and hold that slot occupied until the front color is cleared.
5. **Color-Trap Decoys (Same-Axis Wrong-Color Twins)**:
   - From Level 4+, grids include multiple vehicles of the *same* color where one is unblocked (or 1-blocker deep) and another is trapped behind 3 blockers, OR two unblocked vehicles block different inner paths—so choosing *which* vehicle to dispatch first directly determines whether you have enough free bays to survive the wave.

---

## 2. User Experience & Visual Design

### A. TV Wide-Screen 30% / 10% / 60% Spatial Math
In wide-screen mode (`aspect >= 1.05`), the camera frustum spans **28.0 world units** horizontally (`worldX: -12.6` to `+15.4`), partitioned into exact **30% / 10% / 60%** zones:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                     TV WIDE-SCREEN VIEWPORT (100% Width = 28.0 Units)                    │
├──────────────────────────┬──────────┬────────────────────────────────────────────────────┤
│     ZONE 1 (30% Width)   │ ZONE 2   │                 ZONE 3 (60% Width)                 │
│   worldX: -12.6 .. -4.2  │  (10%)   │               worldX: -1.4 .. +15.4                │
│                          │-4.2..-1.4│                                                    │
│  ┌────────────────────┐  │  ┌────┐  │  ┌──────────────────────────────────────────────┐  │
│  │  Feeder Queue      │  │  │VIP │  │  │                                              │  │
│  │  (Curved Compact)  │  │  ├────┤  │  │      DENSE 12–24 VEHICLE PUZZLE LOT          │  │
│  │         │          │  │  │Bay1│  │  │      (8×8 to 10×10 Basalt Paver Grid)        │  │
│  │         ▼          │  │  ├────┤  │  │                                              │  │
│  │  ╭──────────────╮  │  │  │Bay2│  │  │    [Taxi 3] ──► [Minibus 15] ──► [Bus 25]    │  │
│  │  │ Turning Loop │▒▒│──┼─►│Bay3│◄─┼──│         ▲             │                      │  │
│  │  │   Circle     │Door │  ├────┤  │  │         │             ▼                      │  │
│  │  ╰──────────────╯Pad  │  │Bay4│  │  │    [Double Bus 40] ◄── [Taxi 3]              │  │
│  └────────────────────┘  │  └────┘  │  └──────────────────────────────────────────────┘  │
└──────────────────────────┴──────────┴────────────────────────────────────────────────────┘
```

- **Reduced Distance Between Zone 1 & Zone 2**:
  - `zoneAGroup` is shifted right to `x = 1.30` (with `rotation.y = Math.PI / 2`), placing the oval loop center at `worldX = -7.15` and the **Neon Emerald Boarding Door Ground Pad** at `worldX = -4.25`.
  - The waiting feeder curve in wide mode bends compactly along the top-left of the loop (`worldX: -7.5` to `-11.8`) instead of jutting out to `-18.0`, keeping Zone 1 cleanly within its **30%** budget.
  - `zoneBGroup` sits at `x = 0.90` (`worldX = -2.80` for the 8 angled vertical bays), so the distance from the Zone 1 Boarding Door Pad (`-4.25`) to the Zone 2 Parking Bays (`-2.80`) is only **1.45 units**—tight, cohesive, and immediate.
- **Expanded 60% Zone 3 Vehicle Puzzle Lot**:
  - `WIDE_LOT_LEFT_EDGE_X` starts right next to Zone 2 at `x = -0.35` and extends across `+15.4`, giving the 3D vehicle grid **60% of the screen width** so 12–24 detailed vehicles (`taxi`, `minibus`, `bus`, `double_bus`) render larger, sharper, and easier to read from a TV couch distance.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Guaranteed-Solvable Blocker-Depth Queue Inversion (`solver.js`)**
  - *Chosen Approach*: Simulate peeling the grid in waves where each wave selects a **target blocked vehicle** (requiring $k \in \{1, 2, 3\}$ unblocked blockers to be moved into parking bays first, where $k \le \text{freeBays} - 1$). The passenger queue receives the **target vehicle's color first**, followed immediately by the colors of the $k$ blockers that were parked in the bays!
  - *Why*: This guarantees two things simultaneously:
    1. **High Challenge**: The player *cannot* just tap a matching unblocked vehicle—none of the unblocked vehicles match the front of the queue! They must inspect the grid, trace which 1–2 blockers are trapping the matching bus, park those blockers in the dock, and then release the matching bus.
    2. **100% Mathematical Solvability**: As soon as the freed target bus finishes boarding and departs, the next colors in the passenger queue immediately clear the $k$ blocker vehicles that were temporarily holding in the parking bays!

- **Decision 2: High-Density Reverse-Peel Grid Generator (12–24 Vehicles from Level 4+)**
  - *Chosen Approach*: Upgrade both the curated stage upgrades and `generateSolvableStage` so Level 4+ populates **12 to 24 vehicles** by placing core vehicles first and then wrapping them with perpendicular blocker vehicles whose bodies cross the inner vehicles' exit rays.
  - *Why*: Eliminates empty space in the puzzle lot and creates authentic "Rush Hour" traffic knots where every tap matters.

---

## 4. Technical Architecture & Data Strategy

### System & Solver Data Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   STAGE & DIFFICULTY PIPELINE (Level 1..100)                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┴─────────────────────────────┐
         ▼                                                           ▼
┌─────────────────────────────────────┐     ┌─────────────────────────────────────┐
│ 1. Dense Interlocking Grid Builder  │     │ 2. Blocker-Buried Queue Generator   │
│ - Lv 1..3: 6–9 vehicles (Onboarding)│     │ - Lv 1..3: Unblocked-first chunks   │
│ - Lv 4..10: 12–15 vehicles (8×8)    │────►│ - Lv 4+: Picks target bus blocked   │
│ - Lv 11..30: 15–18 vehicles (9×9)   │     │   by 1–2 decoys; puts target color  │
│ - Lv 31..100: 18–24 vehicles (10×10)│     │   FIRST in queue, then blocker      │
│ - Places blockers across exit rays  │     │   colors so bays clear after rescue │
└─────────────────────────────────────┘     └──────────────────┬──────────────────┘
                                                               │
                                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. TV Wide-Screen 30% / 10% / 60% Frustum & Zone Layout (Renderer3D)        │
│ - Zone 1 (30%): Loop at worldX=-7.15, Door Pad at worldX=-4.25              │
│ - Zone 2 (10%): 8 Angled Bays at worldX=-2.80 (1.45u from Door Pad)         │
│ - Zone 3 (60%): Puzzle Lot from worldX=-0.35 to +15.4 (Smart Camera Fit)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Interactive State & Gameplay Verification
- **Bay Pressure Feedback**: When 3 out of 4 bays are occupied while searching for a buried bus, the remaining open bay pulses subtly and a tactical hint toast warns if the player taps a blocked vehicle.
- **Mechanic Synergy**: The 10 progressive mechanics (`mystery_tint`, `traffic_light`, `vip_rope`, `tunnel_spawner`, `tow_truck`, `sleeping_driver`, `direction_flipper`, `express_bonus`, `dual_color`, `lift_barrier`) integrate into the blocker-depth solver so mechanic vehicles act as key blockers or high-priority rescue targets.
