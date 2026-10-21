# Bus Fever 3D: Traffic Escape — Dark Mode UI, Dynamic Day/Sunset/Night & Open-Source Texture/Audio Upgrade

This upgrade transforms **Bus Fever 3D: Traffic Escape** with a zero-white dark-mode interface across all menus and HUD elements, rich multi-surface textures (weathered asphalt, stone plaza pavers, tiled passenger walkways, and dark turf terrain) instead of plain white/gray ground, a dynamic **Day / Sunset / Night** lighting system, open-source sound effects with a toggleable background music loop, and complete TV remote + gamepad D-pad navigation across the 3D bus lot, HUD controls, and menus.

### User Review & Critical Decisions

> [!IMPORTANT]
> All three preferences from our clarification check are incorporated into this plan and will govern the implementation:

- **Confirmed Decision 1 — Dynamic Day / Sunset / Night & Textured Non-White Ground**: The 3D world will support **Day, Sunset, and Night** lighting modes (auto-cycling by level or selectable at any time from the top HUD bar / controller shortcut), and every ground zone will use distinct surface textures (weathered dark asphalt road, dark slate-stone parking lot pavers with painted grid markings, tactile tiled passenger walkway, and dark landscaped grass/plaza surroundings) with **zero white backgrounds** anywhere in the 3D world or menus.
- **Confirmed Decision 2 — Open-Source SFX + Toggleable Background Music Loop**: The audio engine will load open-source (CC0) audio samples with procedural Web Audio fallback and include a rhythmic, toggleable background arcade-synth music loop alongside rich sound effects for bus horns, diesel engine dispatch, passenger footsteps/pops, booster airlifts, and stage fanfare.
- **Confirmed Decision 3 — Full D-Pad / TV Remote Navigation + Shortcuts**: TV Remote arrow keys and Gamepad D-pad / Left Stick will seamlessly navigate spatially across **all 3D buses in the puzzle lot**, **all bottom booster cards**, **all top bar controls (Replay, Day/Night Cycle, Music Mute, Pause)**, and **all modal menu buttons**, while preserving instant controller face-button shortcuts (`[A]`/`OK`, `[Y]`, `[X]`, `[LB]`, `[RB]`).

---

### 1. Overview & Core Concept

- **What It Does**: Enhances the 3-zone 3D Bus Jam puzzle experience so that both living-room Smart TV players (at 3 meters with a TV remote or Bluetooth controller) and desktop/mobile players enjoy a glare-free dark-mode interface, realistic tactile ground textures across each zone, atmospheric time-of-day lighting transitions, and responsive arcade audio.
- **Target Audience / Persona**: Smart TV (Samsung Tizen 8/9 My PC), desktop, and mobile puzzle players who want comfortable dark-mode visuals without eye-straining white surfaces and effortless couch-friendly remote/controller navigation.
- **Key Value**: Eliminates all bright white backgrounds in menus and 3D ground planes, grounds each of the 3 gameplay zones with distinct textured materials, adds dynamic time-of-day variety, and guarantees 100% mouse-free playability via TV remote or gamepad.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Dark-Mode Title & Level Selection Flow**: Players launch into a deep obsidian-slate glassmorphic Title Overlay (`#0b1120` card surface with `#1e293b` borders and amber-gold TV focus rings) floating over the live, textured 3D terminal. D-pad/Arrows navigate between **Play**, **Time-of-Day Preset (Day / Sunset / Night / Auto)**, and **Level Select chips (1–15+)**.
  2. **3-Zone Gameplay & Spatial Navigation Flow**:
     - Pressing **Up / Down / Left / Right** on a TV remote or gamepad moves a glowing dual-ring 3D target indicator (`#facc15` gold + `#38bdf8` cyan pulse) from bus to bus in Zone C.
     - Pressing **Down** from the bottom row of buses moves focus directly onto the **3 Bottom Booster Cards** (VIP Airlift `[Y]`, Arrange Queue `[X]`, Jumble Colors `[LB]`).
     - Pressing **Up** from the top row of buses moves focus onto the **Top Bar Controls** (Replay, Time-of-Day Toggle, Audio/Music Toggle, Pause).
     - Pressing **Left/Right** on the boarding road or pressing `[RB]` unlocks the `+` extra parking bays.
  3. **Dynamic Time-of-Day & Headlight Illumination Flow**:
     - **Daylight Mode**: Crisp sky-blue hemisphere fill, warm directional sun, and rich textured asphalt, dark stone pavers, and landscaped emerald-slate surroundings (never plain white).
     - **Sunset (Golden Hour) Mode**: Warm amber-magenta directional sunlight, deep twilight horizon fog, and soft warm rim highlights across bus roofs and shelters.
     - **Night Mode**: Deep midnight-indigo ambient light, illuminated bus headlights casting forward light cones on the asphalt road, glowing neon parking bay brackets, and lit bus-stop shelter canopies.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Tactile Dark-Mode Arcade Transit Terminal — high-contrast glossy 3D vehicles over rich dark-toned textured surfaces with zero white backgrounds.
  - *Color Palette & Mood*:
    - `--background`: `#090d16` (Deep Obsidian Canvas & Modal Backdrop)
    - `--card`: `#0f172a` (Dark Slate Menu & HUD Card Surface)
    - `--card-elevated`: `#1e293b` (Elevated Button & Stat Tile Surface)
    - `--border`: `#334155` (Crisp Slate Hairline Border)
    - `--primary`: `#38bdf8` (Electric Sky Blue Action Accent)
    - `--accent`: `#facc15` (High-Visibility 3m TV Remote Focus Gold)
    - `--text-primary`: `#f8fafc` (Crisp Alabaster Typography)
    - `--text-secondary`: `#94a3b8` (Muted Cool Gray Metadata)
  - *Typography & Hierarchy*: Bold geometric display headers (`Plus Jakarta Sans` 800/900 weight) with dark drop-strokes, tabular numerals (`font-variant-numeric: tabular-nums`) for queue counts, scores, and bay capacity badges, and 3m TV-legible button labels.
  - *Component Styling & Layout*: Full-viewport 3D WebGL canvas (`100vw x 100vh`) occupying >85% of viewport area, flanked only by a compact top utility bar and bottom booster dock crafted with dark obsidian-blue 3D beveled cards (`#1e293b` base with `#0f172a` 3D lip).

- **Interactive Feedback & Motion**:
  - **TV Focus Ring**: High-contrast 4px `#facc15` gold outline with scale pop (`1.06x`) on focused HUD buttons and a pulsing 3D ground ring + roof beacon on the currently targeted 3D bus.
  - **Time-of-Day Transitions**: Smooth color and intensity interpolation across sky, fog, hemisphere light, directional sun, and bus headlight glow cones when switching between Day, Sunset, and Night.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybrid Open-Source CC0 Textures + High-Resolution Procedural Detail Maps**
  - *Chosen Approach*: Load open-source CC0 seamless tileable textures (with instant procedural canvas-generated PBR bump/albedo textures baked at startup so textures are 100% guaranteed to render offline and on Smart TVs with zero CORS or network delay) for 4 distinct ground zones:
    1. **Outer Surroundings**: Dark landscaped park turf & slate plaza tiles with subtle grid seams.
    2. **Zone A (Looping Walkway)**: Dark charcoal-slate tactile paving stones with subtle lane dividers and dark-mode curb trim (`#334155` instead of white).
    3. **Zone B (Boarding Road)**: Weathered coarse dark asphalt with aggregate speckle, dashed yellow/amber road markings, and glowing bay brackets.
    4. **Zone C (Bus Puzzle Lot)**: Architectural dark basalt stone pavers with recessed parking cell grid lines so players can visually read the exact `CELL_SIZE` grid beneath the buses.
  - *Why*: Eliminates all white/light-gray ground surfaces while maintaining locked 60 FPS performance on Samsung Tizen 8/9 Smart TVs without heavy multi-megabyte texture downloads.

- **Decision 2: Open-Source Audio Assets + Multi-Track Web Audio Synth & Music Loop**
  - *Chosen Approach*: Integrate open-source CC0 audio buffers alongside a zero-latency Web Audio API sound & music engine featuring a toggleable upbeat night-drive synth bass & melody loop, dual-tone bus horn, diesel rev & gear-shift dispatch, ascending marimba boarding pops, helicopter rotor airlift, and victory chord progression.
  - *Why*: Complies strictly with the My PC single-`AudioContext` lifecycle (`onStart`, `onPause`, `onResume`, `onDestroy`) and works reliably both online and offline.

- **Decision 3: Unified 4-Zone Spatial D-Pad / TV Remote State Machine**
  - *Chosen Approach*: Treat the **Top HUD Bar**, **Zone B Locked `+` Bays**, **Zone C 3D Bus Grid**, and **Bottom Booster Bar** as connected vertical navigation zones, while modal overlays trap D-pad focus within active modal buttons and level-select chips.
  - *Why*: Ensures a player using only a 5-button TV remote (Up, Down, Left, Right, OK/Enter) can access every single feature—including unlocking extra parking bays, toggling Day/Sunset/Night, muting music, using boosters, and picking levels—without ever needing a mouse or touch screen.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        My PC SDK & Input Layer                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐  │
│  │ TV Remote (Arrow/OK) │  │ 4x Gamepad Polling   │  │ Pointer Raycaster │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └─────────┬─────────┘  │
└─────────────┼─────────────────────────┼────────────────────────┼────────────┘
              └─────────────────────────▼────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Unified Spatial Focus & Game State                      │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────────────┐  │
│  │ Top Bar Focus   │◄─►│ Zone B Bay Focus │◄─►│ Zone C 3D Bus Grid Focus │  │
│  │ (Replay/Time/   │   │ (Unlock '+' Bays)│   │ (Nearest-Neighbor Ray)   │  │
│  │  Music/Pause)   │   └──────────────────┘   └────────────┬─────────────┘  │
│  └─────────────────┘                                       │                │
│                                                            ▼                │
│  ┌────────────────────────────────────────┐   ┌──────────────────────────┐  │
│  │ Dark-Mode Modals (Title/Pause/Victory) │   │ Bottom Booster Bar Focus │  │
│  └────────────────────────────────────────┘   └──────────────────────────┘  │
└───────────────────┬────────────────────────────────────────┬────────────────┘
                    ▼                                        ▼
┌──────────────────────────────────────────┐  ┌───────────────────────────────┐
│   3D Environment & Texture/Light Engine  │  │  Open-Source Audio & BGM Hub  │
│  • Multi-Zone Tileable Surface Textures  │  │  • CC0 SFX + Web Audio Synth  │
│    (Turf, Tactile Walkway, Asphalt,      │  │  • Toggleable Arcade BGM Loop │
│     Basalt Grid Pavers — No White)       │  │  • MyPC Pause/Resume Lifecycle│
│  • Dynamic Day / Sunset / Night Lighting │  └───────────────────────────────┘
│  • Bus Headlight Cones & 3D Target Ring  │
└──────────────────────────────────────────┘
```

- **Data Model & State**:
  - `lightingMode`: `'auto' | 'day' | 'sunset' | 'night'` stored in `saveData` (`MyPC.save`) so player preference persists across sessions; `'auto'` smoothly cycles Day -> Sunset -> Night as levels progress.
  - `musicEnabled` & `sfxEnabled`: Boolean flags persisted in `saveData` and controllable directly from the Top HUD Bar and Pause Modal via TV Remote or Gamepad.
  - `focusZone`: `'topbar' | 'bays' | 'grid' | 'boosters'` during active gameplay, plus `'modal'` when Title, Pause, or Victory overlays are open.

- **Interactive Component & State Mapping**:
  - **Top Utility Bar (`focusZone === 'topbar'`)**: Left/Right arrows cycle across **Replay**, **Lighting Mode (`Day / Sunset / Night`)**, **Music/Audio Toggle**, and **Pause**. Pressing `OK`/`[A]` triggers the focused control; pressing `Down` moves focus to Zone B (if locked bays are available) or Zone C (the 3D Bus Grid).
  - **Zone B Parking Bays (`focusZone === 'bays'`)**: Left/Right arrows highlight locked `+` bays with a gold 3D outline; pressing `OK`/`[A]` unlocks the bay immediately.
  - **Zone C 3D Bus Grid (`focusZone === 'grid'`)**: Directional projection algorithm selects the nearest bus in the pressed arrow direction; pressing `Up` from the topmost bus enters `bays`/`topbar`, and pressing `Down` from the bottommost bus enters `boosters`.
  - **Bottom Booster Dock (`focusZone === 'boosters'`)**: Left/Right arrows cycle across **VIP Airlift**, **Arrange Queue**, and **Jumble Colors**; pressing `OK`/`[A]` activates the focused booster; pressing `Up` returns focus to the 3D Bus Grid.
