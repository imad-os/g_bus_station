# Bus Fever 3D: 100-Station City Map, 4 Vehicle Classes & 10 Progressive Mechanics

This update expands **Bus Fever 3D: Traffic Escape** into a **100-Station City Transit Campaign** with a dedicated TV Wide-Screen Horizontal City Map, introduces **4 detailed 3D vehicle classes** (**Taxi: 3**, **Minibus: 15**, **Bus: 25**, **Double Bus: 40**), adds **10 progressive stage mechanics** (1 unlocked every 10 levels, strictly 1 active per stage), adds a **floating 3D downward-pointing arrow (`▼`)** above the selected vehicle, and enforces **Door-Gate-only passenger boarding** on a high-contrast illuminated ground pad.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core design choices have been confirmed from your answers:
> - **Confirmed Decision 1 — Winding City Station Map (100 Levels, TV Horizontal vs. Mobile Vertical)**: On wide TV/desktop screens, the Saga Map renders as a **horizontal winding city transit route** (meandering through city blocks, parks, rivers, crosswalks, and buildings—never a straight highway) where **every level is an interactive Transit Station**. On vertical phone screens, the city route winds vertically. Five quick-jump **City District Tabs** (`Stations 1–20`, `21–40`, `41–60`, `61–80`, `81–100`) let players and TV remotes pan across all 100 stations effortlessly.
> - **Confirmed Decision 2 — 10 Progressive Level Mechanics (1 Every 10 Levels, Max 1 Per Level)**: Across Levels 1–100, 1 new mechanic is introduced every 10 levels. Each stage spawns **at most 1 special mechanic instance** chosen from the mechanics unlocked so far (e.g., by Level 40 the player has discovered 4 mechanics, and each stage features 1 of them).
> - **Confirmed Decision 3 — 4 Detailed 3D Vehicle Classes & Capacities**:
>   1. **Taxi (`3` passengers, `1×2` cells)**: Sleek sedan with sloped hood, cabin roof sign (`TAXI`), checkered trim, mirrors, headlights/taillights, and 4 alloy wheels.
>   2. **Minibus (`15` passengers, `1×2` cells)**: High-roof city shuttle van with panoramic windows, roof AC pod, side sliding door, and front grille.
>   3. **Bus (`25` passengers, `1×3` cells)**: Full-size city coach with illuminated front route display, multi-bay windows, twin roof vents, and 6 wheels.
>   4. **Double Bus (`40` passengers, `1×3` cells)**: Tall double-decker transit coach with lower and upper window decks, wrap-around upper windshield, mid-body trim stripe, and 6 wheels.
> - **Confirmed Decision 4 — Overhead Flipped Selection Arrow + Door-Gate Boarding**: A bobbing 3D downward-pointing arrow (`▼`) hovers above the roof of the currently selected vehicle (in addition to the ground ring), and revolving passengers can **only** board a parked vehicle at the exact moment they step onto the high-contrast **Boarding Door Ground Pad**.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the progression, visual variety, and tactical depth of Bus Fever 3D across a 100-station urban transit network while preserving full TV Remote / Gamepad D-pad and touch/mouse playability.
- **Target Audience / Persona**: Living-room Smart TV / gamepad players and mobile/desktop puzzle players who want rich 3D miniature vehicles, clear visual feedback in dense traffic lots, and fresh tactical twists every 10 stages.
- **Key Value**:
  - **City Station Saga Map**: Replaces the vertical-only highway strip on TV with a wide-screen meandering urban street map surrounded by city blocks, parks, water channels, and 100 Transit Station nodes.
  - **Rich 3D Fleet (`3 / 15 / 25 / 40` Seats)**: Distinct silhouettes and heights make scanning capacities instantaneous.
  - **Unmistakable Selection & Door Boarding**: The overhead 3D flipped arrow (`▼`) stays visible even when a Taxi is boxed in by Double-Decker Buses, and the neon-checkered Door Ground Pad makes the revolving circle's boarding trigger point crystal clear.

---

## 2. User Experience & Visual Design

### A. Smart City Station Saga Map (TV Horizontal vs. Mobile Vertical — 100 Stations)
- **Wide TV Mode (`aspect >= 1.05`)**:
  - The map canvas scrolls **horizontally (`X` axis)** across a rich dark-mode procedural city backdrop featuring city block parcels, parks, water canals, intersections, crosswalk stripes, and building roofs.
  - A multi-turn urban transit avenue meanders up and down across city blocks from left to right.
  - Each of the **100 levels** is rendered as a **City Transit Station** node with a station platform badge, star crown (completed), pulsing `🚌 STATION` banner (current frontier), or golden padlock (locked).
  - **5 City District Tabs** (`District 1: Downtown 1–20`, `District 2: Harbor 21–40`, `District 3: Midtown 41–60`, `District 4: Tech Park 61–80`, `District 5: Metro Core 81–100`) allow instant jumping or smooth horizontal scrolling.
- **Vertical Phone Mode (`aspect < 1.05`)**:
  - Retains a vertical scrolling city map with the same city block artwork, station nodes, and 5 District quick-jump tabs.

### B. 4 Detailed 3D Vehicle Models (`Taxi`, `Minibus`, `Bus`, `Double Bus`)
- **Taxi (`3` seats, `1×2`)**: Low-profile sedan chassis, tapered hood and trunk, cabin greenhouse, glowing yellow `TAXI` roof topper, black-and-gold checkered side decal, side mirrors, headlights, taillights, and 4 wheels.
- **Minibus (`15` seats, `1×2`)**: Rounded shuttle van body, tall tinted passenger windows, recessed side entry door, roof air-conditioning unit, bumper guard, and 4 wheels.
- **Bus (`25` seats, `1×3`)**: Long city transit body, angled windshield with glowing front route sign, 5-window side bay, dual roof HVAC pods, side boarding door, and 6 wheels.
- **Double Bus (`40` seats, `1×3`)**: Towering double-decker body (`height ≈ 1.48`), lower-deck and upper-deck window rows separated by a metallic accent band, panoramic upper front glass, roof vents, and 6 wheels.

### C. Overhead Flipped Selection Arrow (`▼`) + Ground Ring
- Whenever a vehicle in Zone C is focused (via TV remote D-pad, gamepad, or hover/tap), it displays:
  1. The existing **ground selection ring** at `Y = 0.05`.
  2. A new **3D Flipped Pointer Arrow (`▼`)** hovering above the vehicle's roof (`Y = roofHeight + 0.95`), constructed from an inverted 3D cone + shaft with high-contrast gold/cyan emissive shading that bobs vertically and rotates smoothly so surrounding tall vehicles never occlude it.

### D. Revolving Circle Door Gate & High-Contrast Door Ground Pad
- **Distinctive Door Ground Pad**: At the exit point of the revolving passenger circle (bottom of the circle in vertical mode; right side of the circle in wide TV mode), the ground features a **high-contrast Neon Emerald & Gold Checkered Boarding Platform** framed by two glowing cyan/gold gate bollards and a pulsing directional chevron arrow on the ground.
- **Strict Door-Only Boarding**: Passengers continuously walk around the circular loop. A passenger can **only** leave the circle and board a matching parked vehicle at the exact moment their circular rotation brings them onto the **Door Ground Pad** (`gateWindow` indices aligned with the door angle).

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: 10 Progressive Mechanics Schedule (Levels 1–100, Max 1 Per Level)
- **Chosen Approach**: Introduce 1 new mechanic every 10 levels across the 100-level campaign, and enforce a strict cap of **at most 1 special mechanic vehicle/element per stage**:
  1. **Levels 1–10 (`mystery_tint`)**: **Mystery Tinted Vehicle (`?`)** — Color is hidden under dark VIP tint until an adjacent vehicle departs. *(Introduced at Level 2 so Level 1 remains pure tutorial).*
  2. **Levels 11–20 (`traffic_light`)**: **Traffic Light Signal (`🚦`)** — Alternates Green/Red on each dispatch; vehicle can only depart when Green.
  3. **Levels 21–30 (`vip_rope`)**: **Rope-Tied Vehicle (`🪢`)** — Tied with security ropes that unlock after `2` other vehicles depart.
  4. **Levels 31–40 (`tunnel_spawner`)**: **City Tunnel Spawner (`🚇`)** — A tunnel arch behind the vehicle spawns `1` reserve vehicle once the space clears.
  5. **Levels 41–50 (`tow_truck`)**: **City Sweeper Truck (`🚜`)** — Neutral yellow service vehicle (`0` passengers) blocking a lane; tapping it when unblocked drives it straight off the map.
  6. **Levels 51–60 (`sleeping_driver`)**: **Sleeping Driver (`💤`)** — Driver is asleep (`Zzz`); dispatching any adjacent vehicle honks and wakes them up.
  7. **Levels 61–70 (`direction_flipper`)**: **U-Turn Flipper Pad (`🔄`)** — Road pad beneath the vehicle flips its exit direction $180^\circ$ each time another vehicle departs.
  8. **Levels 71–80 (`express_bonus`)**: **Express Priority Bus (`⏱️`)** — Dispatching it before `3` other vehicles leave awards **`+2` Bonus Points/Coins**.
  9. **Levels 81–90 (`dual_color`)**: **Dual-Color Split Coach (`🎨`)** — Boards the first half of its seats with Color A, then switches to Color B for the second half.
  10. **Levels 91–100 (`lift_barrier`)**: **City Lift Barrier (`🚧`)** — Striped roadwork gate in front of the vehicle lifts automatically once the first full bus departs from the parking bays.
- **Why**: At Level 40, the player has encountered 4 mechanics (`mystery_tint`, `traffic_light`, `vip_rope`, `tunnel_spawner`), and each level deterministically selects **1** mechanic from the unlocked pool so stages never feel cluttered or unfair.

### Decision 2: Balanced Queue Pacing with `3 / 15 / 25 / 40` Capacities
- **Chosen Approach**: Scale the instanced passenger pool up to `320` visible 3D passengers and speed up boarding cadence (`0.055s` between runners for high-capacity buses) so `25`-seat and `40`-seat buses board smoothly and briskly once a passenger of their color reaches the Door Ground Pad.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram
```
┌────────────────────────────────────────────────────────────────────────────┐
│                        BusFeverGame Controller (main.js)                   │
│  • 100-Station City Saga Map (Horizontal on Wide TV / Vertical on Phone)   │
│  • 5 City District Quick-Jump Tabs (1-20, 21-40, 41-60, 61-80, 81-100)     │
│  • 10 Progressive Mechanics State Machine (1 unlocked / 10 lvls, max 1/lv) │
│  • Strict Door-Gate Boarding Matcher (checks only Door Ground Pad window)  │
└───────────────┬───────────────────────────────────────────┬────────────────┘
                │                                           │
                ▼                                           ▼
┌───────────────────────────────────────┐   ┌────────────────────────────────┐
│   Reverse-Peel Generator (solver.js)  │   │   3D World (renderer3d.js)     │
│  • Assigns 4 Vehicle Classes:         │   │  • 4 Composite 3D Vehicle      │
│    - taxi (1x2, cap 3)                │   │    Meshes (Taxi, Minibus,      │
│    - minibus (1x2, cap 15)            │   │    Bus, Double-Decker Bus)     │
│    - bus (1x3, cap 25)                │   │  • Overhead Flipped Arrow (▼)  │
│    - double_bus (1x3, cap 40)         │   │    + Ground Selection Ring     │
│  • Attaches 1 Mechanic per Stage      │   │  • High-Contrast Neon/Gold     │
│    from Unlocked Tier Pool (Lv 1-100) │   │    Door Ground Boarding Pad    │
└───────────────────────────────────────┘   └────────────────────────────────┘
```

### Interactive Component & State Mapping
1. **City Station Saga Map (`_buildLevelPickersDom` & `_updateSagaMapDom`)**:
   - Detects `isWideMap = window.innerWidth >= window.innerHeight * 1.05`.
   - In wide mode, builds a horizontal SVG city street canvas (`width = 100 * 115px`, `height = 100%`) with city blocks, parks, water canals, crosswalks, and meandering station nodes (`Station 1` .. `Station 100`).
   - Clicking any of the **5 District Tabs** scrolls smoothly to that 20-station district.
2. **10 Mechanics Lifecycle (`_onBusDispatchedToBay`, `_onParkedBusDeparted`, `trySelectBus`)**:
   - Before dispatching a vehicle in `trySelectBus(busId)`, checks if `bus.mechanic` is currently blocking it (`mystery_tint` unrevealed, `traffic_light` red, `vip_rope > 0`, `sleeping_driver` asleep, `lift_barrier` closed) and shows a clear toast + 3D visual cue.
   - When any vehicle is dispatched or departs, updates the active stage mechanic (`traffic_light` toggles, `vip_rope` decrements, `mystery_tint` or `sleeping_driver` wakes if adjacent, `tunnel_spawner` spawns its reserve vehicle, `direction_flipper` rotates $180^\circ$, `lift_barrier` opens on first full departure).
3. **Door-Gate-Only Boarding (`updateFixedStep`)**:
   - Computes `gateRowIdx` from `this.renderer3d.loopTurnPhase` (the exact row of the revolving circle currently standing on the **Door Ground Pad**).
   - Matches parked vehicles strictly against the passengers currently inside that Door Ground Pad window, spawning boarding runners directly from the illuminated door pad into the bus.
