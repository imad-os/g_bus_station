/**
 * Bus Fever 3D: Traffic Escape — Strict Anti-Overlap Grid Math, 4 Detailed Vehicle Specs,
 * 10 Progressive City Mechanics, & Reverse-Peel Solvable Stage Generator
 */

export const CELL_SIZE = 1.6;

export const DIR_VECTORS = {
  N: { dx: 0, dz: -1, rotY: 0, arrow: '↑' },
  S: { dx: 0, dz: 1, rotY: Math.PI, arrow: '↓' },
  E: { dx: 1, dz: 0, rotY: -Math.PI / 2, arrow: '→' },
  W: { dx: -1, dz: 0, rotY: Math.PI / 2, arrow: '←' },
};

export const COLORS_PALETTE = [
  'purple',
  'orange',
  'pink',
  'green',
  'yellow',
  'cyan',
  'red',
  'blue',
];

/**
 * 4 Detailed Vehicle Classes with exact capacities requested by user:
 * 1. taxi       -> capacity: 3,  length: 2
 * 2. minibus    -> capacity: 15, length: 2
 * 3. bus        -> capacity: 25, length: 3
 * 4. double_bus -> capacity: 40, length: 3
 */
export const VEHICLE_SPECS = {
  taxi: { length: 2, defaultCapacity: 3, label: 'Taxi' },
  minibus: { length: 2, defaultCapacity: 15, label: 'Mini Bus' },
  bus: { length: 3, defaultCapacity: 25, label: 'City Bus' },
  double_bus: { length: 3, defaultCapacity: 40, label: 'Double Bus' },
};

/**
 * 10 Progressive Stage Mechanics — 1 new mechanic introduced every 10 levels (Levels 1–100).
 * Strict constraint: At most 1 mechanic instance is present in any single level.
 */
export const STAGE_MECHANICS = [
  {
    id: 'mystery_tint',
    tier: 1,
    unlockLevel: 1,
    debutLevel: 2,
    name: 'Mystery VIP Tint',
    icon: '❓',
    badge: '? VIP',
    desc: 'Color hidden under dark VIP tint until an adjacent vehicle departs',
  },
  {
    id: 'traffic_light',
    tier: 2,
    unlockLevel: 11,
    debutLevel: 11,
    name: 'Traffic Light Signal',
    icon: '🚦',
    badge: 'SIGNAL',
    desc: 'Toggles Green / Red each dispatch — can only depart on Green',
  },
  {
    id: 'vip_rope',
    tier: 3,
    unlockLevel: 21,
    debutLevel: 21,
    name: 'VIP Velvet Ropes',
    icon: '🪢',
    badge: 'ROPE ×2',
    desc: 'Velvet ropes untie automatically after 2 other vehicles depart',
  },
  {
    id: 'tunnel_spawner',
    tier: 4,
    unlockLevel: 31,
    debutLevel: 31,
    name: 'Underground Tunnel',
    icon: '🚇',
    badge: 'TUNNEL +1',
    desc: 'Spawns 1 reserve Taxi from the underground portal after departure',
  },
  {
    id: 'tow_truck',
    tier: 5,
    unlockLevel: 41,
    debutLevel: 41,
    name: 'City Sweeper Truck',
    icon: '🚜',
    badge: 'SWEEPER',
    desc: '0 passengers — tap when unblocked to drive straight off the road',
  },
  {
    id: 'sleeping_driver',
    tier: 6,
    unlockLevel: 51,
    debutLevel: 51,
    name: 'Sleeping Driver',
    icon: '💤',
    badge: 'ZZZ',
    desc: 'Dispatch an adjacent vehicle to honk and wake up the driver',
  },
  {
    id: 'direction_flipper',
    tier: 7,
    unlockLevel: 61,
    debutLevel: 61,
    name: 'U-Turn Flipper Pad',
    icon: '🔄',
    badge: '180° PAD',
    desc: 'Turntable flips vehicle exit direction 180° after each dispatch',
  },
  {
    id: 'express_bonus',
    tier: 8,
    unlockLevel: 71,
    debutLevel: 71,
    name: 'Express Priority Bus',
    icon: '⏱️',
    badge: '+2 PTS',
    desc: 'Dispatch within 3 moves to earn +2 Bonus Points',
  },
  {
    id: 'dual_color',
    tier: 9,
    unlockLevel: 81,
    debutLevel: 81,
    name: 'Dual-Color Coach',
    icon: '🎨',
    badge: '2-TONE',
    desc: 'Boards first half with Front Color, then switches to Rear Color',
  },
  {
    id: 'lift_barrier',
    tier: 10,
    unlockLevel: 91,
    debutLevel: 91,
    name: 'City Lift Barrier',
    icon: '🚧',
    badge: 'GATE',
    desc: 'Automated street gate lifts once the first full bus departs a bay',
  },
];

export function getStageMechanicSpec(mechanicId) {
  if (!mechanicId) return null;
  return STAGE_MECHANICS.find((m) => m.id === mechanicId) || null;
}

/**
 * Returns the single active mechanic spec for a given levelNumber (1..100+).
 * - Level 1 has no mechanic for clean onboarding.
 * - Every 10 levels (1-10, 11-20, ..., 91-100) unlocks 1 new mechanic.
 * - By Level 40, the player has seen 4 mechanics, and each level includes strictly 1 of the unlocked mechanics.
 */
export function selectMechanicForLevel(levelNumber) {
  const lvl = Math.max(1, Math.floor(levelNumber || 1));
  if (lvl <= 1) return null;

  const maxTierIndex = Math.min(
    STAGE_MECHANICS.length - 1,
    Math.floor((lvl - 1) / 10)
  );
  const unlockedPool = STAGE_MECHANICS.slice(0, maxTierIndex + 1);

  // Debut levels (Lv 2 for Tier 1, or X1/X2 for Tiers 2..10) always showcase the newest unlocked mechanic
  const offsetInBand = (lvl - 1) % 10; // 0..9
  if (lvl === 2 || offsetInBand === 0 || offsetInBand === 1) {
    return unlockedPool[unlockedPool.length - 1];
  }

  // Otherwise deterministically rotate across the unlocked pool so every unlocked mechanic appears
  const pickIndex = (lvl * 7 + maxTierIndex * 3) % unlockedPool.length;
  return unlockedPool[pickIndex];
}

/**
 * Computes the exact integer grid cells occupied by a bus.
 * Head is at (hx, hz), direction is dir ('N'|'S'|'E'|'W'), and length is L (2 or 3).
 * Occupied cells: C_i = (hx - i * dx, hz - i * dz) for i in {0, 1, ..., L-1}
 */
export function getBusCells(bus) {
  const vec = DIR_VECTORS[bus.dir] || DIR_VECTORS.N;
  const L = bus.length || VEHICLE_SPECS[bus.type]?.length || 2;
  const hx = bus.hx !== undefined ? bus.hx : bus.anchorX;
  const hz = bus.hz !== undefined ? bus.hz : bus.anchorZ;
  const cells = [];
  for (let i = 0; i < L; i++) {
    cells.push({
      x: hx - i * vec.dx,
      z: hz - i * vec.dz,
    });
  }
  return cells;
}

/**
 * Computes the exact 3D mesh dimensions strictly smaller than the grid footprint
 * so adjacent buses always have a crisp visual gap and never clip.
 */
export function getBusMeshDimensions(length) {
  const L = length || 2;
  return {
    meshWidth: CELL_SIZE * 0.78,
    meshLength: L * CELL_SIZE - CELL_SIZE * 0.22,
  };
}

/**
 * Computes the geometric center of the bus in grid coordinates and converts to 3D world space.
 */
export function getBusWorldCenter(
  bus,
  gridWidth,
  gridHeight,
  gridOriginZ = 4.2,
  gridOriginX = 0
) {
  const vec = DIR_VECTORS[bus.dir] || DIR_VECTORS.N;
  const L = bus.length || VEHICLE_SPECS[bus.type]?.length || 2;
  const hx = bus.hx !== undefined ? bus.hx : bus.anchorX;
  const hz = bus.hz !== undefined ? bus.hz : bus.anchorZ;

  const gridCenterX = hx - ((L - 1) * vec.dx) / 2;
  const gridCenterZ = hz - ((L - 1) * vec.dz) / 2;

  const offsetX = ((gridWidth - 1) * CELL_SIZE) / 2;
  const offsetZ = ((gridHeight - 1) * CELL_SIZE) / 2;

  return {
    gridCenterX,
    gridCenterZ,
    worldX: gridOriginX + (gridCenterX * CELL_SIZE - offsetX),
    worldZ: gridOriginZ + (gridCenterZ * CELL_SIZE - offsetZ),
    rotY: vec.rotY + (bus.lotAngle || 0),
  };
}

/**
 * Checks if all cells of a bus lie within [0, gridWidth - 1] x [0, gridHeight - 1].
 */
export function isBusInBounds(bus, gridWidth, gridHeight) {
  const cells = getBusCells(bus);
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (c.x < 0 || c.x >= gridWidth || c.z < 0 || c.z >= gridHeight) {
      return false;
    }
  }
  return true;
}

/**
 * Checks whether two buses share any occupied cell.
 */
export function doBusesOverlap(busA, busB) {
  const cellsA = getBusCells(busA);
  const cellsB = getBusCells(busB);
  for (let i = 0; i < cellsA.length; i++) {
    for (let j = 0; j < cellsB.length; j++) {
      if (cellsA[i].x === cellsB[j].x && cellsA[i].z === cellsB[j].z) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks whether two buses are orthogonally or diagonally adjacent on the grid.
 */
export function areBusesAdjacent(busA, busB) {
  const cellsA = getBusCells(busA);
  const cellsB = getBusCells(busB);
  for (let i = 0; i < cellsA.length; i++) {
    for (let j = 0; j < cellsB.length; j++) {
      const dx = Math.abs(cellsA[i].x - cellsB[j].x);
      const dz = Math.abs(cellsA[i].z - cellsB[j].z);
      if (dx + dz <= 2 && (dx <= 1 && dz <= 1)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Normalizes legacy vehicle types ('minivan', 'bus', 'coach') or explicit vehicle types
 * into the 4 detailed classes:
 * - taxi       (cap: 3,  len: 2)
 * - minibus    (cap: 15, len: 2)
 * - bus        (cap: 25, len: 3)
 * - double_bus (cap: 40, len: 3)
 */
function resolveVehicleClass(raw, idx, stageLevel) {
  if (raw.type === 'taxi' || raw.type === 'minibus' || raw.type === 'double_bus') {
    const spec = VEHICLE_SPECS[raw.type];
    return {
      type: raw.type,
      preferredLength: spec.length,
      fallbackLength: raw.length || spec.length,
      capacity: spec.defaultCapacity,
    };
  }
  if (raw.type === 'bus' && raw.capacity === 25) {
    return {
      type: 'bus',
      preferredLength: 3,
      fallbackLength: raw.length || 3,
      capacity: 25,
    };
  }

  // Legacy pack normalization so every level showcases the 4 vehicle classes & exact capacities (3, 15, 25, 40)
  const rawLen = raw.length || (raw.type === 'coach' ? 3 : 2);
  if (raw.type === 'minivan') {
    return { type: 'taxi', preferredLength: 2, fallbackLength: 2, capacity: 3 };
  }
  if (rawLen === 3 || raw.type === 'coach') {
    const useDouble = stageLevel >= 3 && (idx + stageLevel) % 2 === 0;
    return {
      type: useDouble ? 'double_bus' : 'bus',
      preferredLength: 3,
      fallbackLength: 3,
      capacity: useDouble ? 40 : 25,
    };
  }

  // Legacy 2-cell 'bus' -> mix of taxi (3), minibus (15), and bus (25) / double_bus (40)
  const pattern = (idx + stageLevel) % 6;
  if (pattern === 0 || pattern === 3) {
    return { type: 'taxi', preferredLength: 2, fallbackLength: 2, capacity: 3 };
  }
  if (pattern === 1 || pattern === 4) {
    return { type: 'minibus', preferredLength: 2, fallbackLength: 2, capacity: 15 };
  }
  if (stageLevel >= 4 && pattern === 5) {
    return { type: 'double_bus', preferredLength: 3, fallbackLength: 2, capacity: 40 };
  }
  return { type: 'bus', preferredLength: 3, fallbackLength: 2, capacity: 25 };
}

/**
 * Attaches strictly 1 progressive mechanic to 1 suitable vehicle on the stage (for Level >= 2).
 */
export function assignStageMechanic(buses, stageLevel, gridWidth, gridHeight) {
  // Clear any pre-existing mechanic flags first so max 1 mechanic per level is strictly enforced
  for (let i = 0; i < buses.length; i++) {
    delete buses[i].mechanic;
    delete buses[i].mechanicState;
    delete buses[i].secondaryColor;
    delete buses[i].tunnelReserve;
  }

  const spec = selectMechanicForLevel(stageLevel);
  if (!spec || buses.length < 2) return null;

  // Identify which buses are initially unblocked vs blocked so we pick an ideal carrier bus
  const unblocked = [];
  const blocked = [];
  for (let i = 0; i < buses.length; i++) {
    const blocker = findBlockingBus(buses[i], buses, gridWidth, gridHeight);
    if (!blocker) {
      unblocked.push(buses[i]);
    } else {
      blocked.push(buses[i]);
    }
  }

  let targetBus = null;

  switch (spec.id) {
    case 'mystery_tint':
    case 'sleeping_driver': {
      // Pick a bus that has at least one unblocked neighbor so dispatching the neighbor reveals/wakes it
      targetBus =
        blocked.find((b) => unblocked.some((u) => areBusesAdjacent(b, u))) ||
        (unblocked.length > 1 ? unblocked[unblocked.length - 1] : buses[buses.length - 1]);
      targetBus.mechanic = spec.id;
      targetBus.mechanicState = {
        revealed: false,
        awake: false,
      };
      break;
    }

    case 'vip_rope': {
      // Pick a blocked or secondary bus; unties after 2 dispatches
      targetBus = blocked[0] || unblocked[unblocked.length - 1] || buses[0];
      targetBus.mechanic = 'vip_rope';
      targetBus.mechanicState = {
        ropesRemaining: 2,
      };
      break;
    }

    case 'traffic_light': {
      // Starts Green (true) so if tapped immediately it works, and toggles every dispatch
      targetBus = unblocked[Math.min(1, unblocked.length - 1)] || buses[0];
      targetBus.mechanic = 'traffic_light';
      targetBus.mechanicState = {
        green: true,
      };
      break;
    }

    case 'tunnel_spawner': {
      // Attach underground tunnel arch behind a 2-cell vehicle; spawns 1 reserve taxi (cap 3) on departure
      targetBus =
        buses.find((b) => b.length === 2) ||
        unblocked[0] ||
        buses[0];
      const usedColors = Array.from(new Set(buses.map((b) => b.color)));
      const reserveColor = usedColors[(stageLevel + 1) % usedColors.length] || targetBus.color;
      targetBus.mechanic = 'tunnel_spawner';
      targetBus.tunnelReserve = {
        type: 'taxi',
        length: 2,
        capacity: 3,
        color: reserveColor,
      };
      targetBus.mechanicState = {
        spawned: false,
      };
      break;
    }

    case 'tow_truck': {
      // Convert 1 unblocked or lightly blocked 2-cell vehicle into a 0-passenger yellow City Sweeper Truck
      targetBus =
        unblocked.find((b) => b.length === 2) ||
        buses.find((b) => b.length === 2) ||
        unblocked[0] ||
        buses[0];
      targetBus.mechanic = 'tow_truck';
      targetBus.type = 'taxi';
      targetBus.length = 2;
      targetBus.capacity = 0;
      targetBus.color = 'yellow';
      targetBus.mechanicState = {
        isServiceTruck: true,
      };
      break;
    }

    case 'direction_flipper': {
      targetBus = blocked[0] || unblocked[unblocked.length - 1] || buses[0];
      targetBus.mechanic = 'direction_flipper';
      targetBus.mechanicState = {
        flippedCount: 0,
      };
      break;
    }

    case 'express_bonus': {
      // Attach to an accessible bus so the player can dispatch it within 3 moves for +2 Bonus Points
      targetBus = unblocked[unblocked.length - 1] || buses[0];
      targetBus.mechanic = 'express_bonus';
      targetBus.mechanicState = {
        movesRemaining: 3,
        bonusPoints: 2,
      };
      break;
    }

    case 'dual_color': {
      // Pick a minibus/bus/double_bus and give it a secondary rear color
      targetBus =
        buses.find((b) => b.capacity >= 15) ||
        buses[0];
      const availableColors = Array.from(
        new Set(buses.map((b) => b.color).filter((c) => c !== targetBus.color))
      );
      const secondColor =
        availableColors[0] ||
        COLORS_PALETTE.find((c) => c !== targetBus.color) ||
        'cyan';
      const firstHalf = Math.ceil(targetBus.capacity / 2);
      targetBus.mechanic = 'dual_color';
      targetBus.secondaryColor = secondColor;
      targetBus.mechanicState = {
        primaryColor: targetBus.color,
        secondaryColor: secondColor,
        switchAtSeated: firstHalf,
        switched: false,
      };
      break;
    }

    case 'lift_barrier': {
      // Attach a street lift barrier to a secondary/blocked bus; lifts once the first full bus departs a bay
      targetBus =
        (unblocked.length > 1 ? unblocked[unblocked.length - 1] : null) ||
        blocked[0] ||
        buses[buses.length - 1];
      targetBus.mechanic = 'lift_barrier';
      targetBus.mechanicState = {
        gateOpen: false,
      };
      break;
    }

    default:
      break;
  }

  return targetBus ? { ...spec, busId: targetBus.id } : null;
}

/**
 * Mandatory Pre-Render Overlap & Solvability Sanitizer.
 * Verifies every bus is in bounds and occupies unique integer cells via a Set occupancy check,
 * upgrades vehicles to the 4 detailed classes (taxi=3, minibus=15, bus=25, double_bus=40),
 * attaches the level's single progressive mechanic, and builds the exact matching passengerQueue.
 */
export function sanitizeStage(rawStage) {
  const stageLevel = Math.max(1, Math.floor(rawStage.level || 1));
  const gridWidth = rawStage.grid?.width || 7;
  const gridHeight = rawStage.grid?.height || 7;
  const occupied = new Set();
  const sanitizedBuses = [];

  const inputBuses = Array.isArray(rawStage.buses) ? rawStage.buses : [];

  for (let idx = 0; idx < inputBuses.length; idx++) {
    const raw = inputBuses[idx];
    const resolved = resolveVehicleClass(raw, idx, stageLevel);
    const dir = DIR_VECTORS[raw.dir] ? raw.dir : 'N';
    const hx = raw.hx !== undefined ? raw.hx : raw.anchorX;
    const hz = raw.hz !== undefined ? raw.hz : raw.anchorZ;

    // Try preferredLength first (e.g. 3 for bus/double_bus), falling back to fallbackLength if tight in legacy pack
    let chosenCandidate = null;
    const tryLengths =
      resolved.preferredLength !== resolved.fallbackLength
        ? [resolved.preferredLength, resolved.fallbackLength]
        : [resolved.preferredLength];

    for (let lIdx = 0; lIdx < tryLengths.length; lIdx++) {
      const testLen = tryLengths[lIdx];
      const testCandidate = {
        id: raw.id || `bus_${idx + 1}`,
        type: resolved.type,
        color: raw.color || COLORS_PALETTE[idx % COLORS_PALETTE.length],
        dir,
        length: testLen,
        capacity: resolved.capacity,
        hx,
        hz,
      };
      const cells = getBusCells(testCandidate);
      let valid = isBusInBounds(testCandidate, gridWidth, gridHeight);
      if (valid) {
        for (let i = 0; i < cells.length; i++) {
          if (occupied.has(`${cells[i].x},${cells[i].z}`)) {
            valid = false;
            break;
          }
        }
      }
      if (valid) {
        chosenCandidate = testCandidate;
        break;
      }
    }

    if (!chosenCandidate) {
      // Attempt to relocate candidate to a non-overlapping valid position on the grid
      const fallbackCandidate = {
        id: raw.id || `bus_${idx + 1}`,
        type: resolved.type,
        color: raw.color || COLORS_PALETTE[idx % COLORS_PALETTE.length],
        dir,
        length: resolved.fallbackLength,
        capacity: resolved.capacity,
        hx,
        hz,
      };
      const dirs = [dir, 'N', 'E', 'W', 'S'];
      outer: for (let d = 0; d < dirs.length; d++) {
        const tryDir = dirs[d];
        for (let z = 0; z < gridHeight; z++) {
          for (let x = 0; x < gridWidth; x++) {
            const testBus = { ...fallbackCandidate, dir: tryDir, hx: x, hz: z };
            if (!isBusInBounds(testBus, gridWidth, gridHeight)) continue;
            const testCells = getBusCells(testBus);
            let free = true;
            for (let c = 0; c < testCells.length; c++) {
              if (occupied.has(`${testCells[c].x},${testCells[c].z}`)) {
                free = false;
                break;
              }
            }
            if (free) {
              chosenCandidate = testBus;
              break outer;
            }
          }
        }
      }
    }

    if (chosenCandidate) {
      const cells = getBusCells(chosenCandidate);
      for (let c = 0; c < cells.length; c++) {
        occupied.add(`${cells[c].x},${cells[c].z}`);
      }
      sanitizedBuses.push(chosenCandidate);
    }
  }

  // Ensure every stage can be peeled (no permanent mutual cycles)
  fixMutualCycles(sanitizedBuses, gridWidth, gridHeight);

  // Attach strictly 1 progressive mechanic for this level (1 new mechanic every 10 levels)
  const activeMechanic = assignStageMechanic(
    sanitizedBuses,
    stageLevel,
    gridWidth,
    gridHeight
  );

  // Reconcile passengerQueue so exact seat counts per color match 100% (including dual_color & tunnel_spawner)
  const passengerQueue = buildBalancedPassengerQueue(
    sanitizedBuses,
    null,
    gridWidth,
    gridHeight,
    stageLevel
  );

  return {
    level: stageLevel,
    title: rawStage.title || `Station ${stageLevel}`,
    difficulty: rawStage.difficulty || 'Normal',
    grid: { width: gridWidth, height: gridHeight },
    dockSlots: rawStage.dockSlots || 4,
    activeMechanic,
    buses: sanitizedBuses,
    passengerQueue,
  };
}

/**
 * Raycasts forward from a bus's head cell (hx, hz) along its direction vector (dx, dz).
 * Returns null if the exit path to the perimeter road is completely clear,
 * or returns the first blocking bus object encountered along the ray.
 */
export function findBlockingBus(targetBus, activeBuses, gridWidth, gridHeight) {
  const vec = DIR_VECTORS[targetBus.dir] || DIR_VECTORS.N;
  const cellMap = new Map();

  for (let i = 0; i < activeBuses.length; i++) {
    const b = activeBuses[i];
    if (b.id === targetBus.id) continue;
    const cells = getBusCells(b);
    for (let c = 0; c < cells.length; c++) {
      cellMap.set(`${cells[c].x},${cells[c].z}`, b);
    }
  }

  let cx = targetBus.hx + vec.dx;
  let cz = targetBus.hz + vec.dz;

  while (cx >= 0 && cx < gridWidth && cz >= 0 && cz < gridHeight) {
    const blocker = cellMap.get(`${cx},${cz}`);
    if (blocker) {
      return blocker;
    }
    cx += vec.dx;
    cz += vec.dz;
  }

  return null;
}

/**
 * Computes a valid peel order of buses from the grid by repeatedly removing unblocked buses.
 * If any buses are stuck in a cycle (e.g. two buses facing head-to-head), flips directions so
 * 100% of buses can exit the lot without deadlocking.
 */
export function fixMutualCycles(buses, gridWidth, gridHeight) {
  const remaining = buses.map((b) => ({ ...b }));
  const peelOrder = [];

  let safety = 0;
  while (remaining.length > 0 && safety < 200) {
    safety++;
    let foundIndex = -1;
    for (let i = 0; i < remaining.length; i++) {
      const blocker = findBlockingBus(remaining[i], remaining, gridWidth, gridHeight);
      if (!blocker) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== -1) {
      peelOrder.push(remaining[foundIndex]);
      remaining.splice(foundIndex, 1);
    } else {
      // Flip the first stuck bus (swap head and tail) so it faces the opposite direction
      const stuck = remaining[0];
      const cells = getBusCells(stuck);
      const tail = cells[cells.length - 1];
      const opposite = { N: 'S', S: 'N', E: 'W', W: 'E' };
      stuck.dir = opposite[stuck.dir] || 'N';
      stuck.hx = tail.x;
      stuck.hz = tail.z;

      // Sync back to original array
      const orig = buses.find((b) => b.id === stuck.id);
      if (orig) {
        orig.dir = stuck.dir;
        orig.hx = stuck.hx;
        orig.hz = stuck.hz;
      }

      if (findBlockingBus(stuck, remaining, gridWidth, gridHeight)) {
        stuck.dir = 'N';
        if (orig) orig.dir = 'N';
      }
    }
  }
  return peelOrder;
}

/**
 * Expands a peeled vehicle list into passenger color segments, accounting for:
 * - tow_truck: 0 passengers
 * - dual_color: firstHalf of primary color + secondHalf of secondaryColor
 * - tunnel_spawner: adds the spawned reserve taxi's passengers right after the carrier vehicle
 */
function expandBusPassengerSegments(peeledBuses) {
  const segments = [];
  for (let i = 0; i < peeledBuses.length; i++) {
    const bus = peeledBuses[i];
    if (bus.mechanic === 'tow_truck' || bus.capacity <= 0) {
      continue;
    }
    if (bus.mechanic === 'dual_color' && bus.secondaryColor) {
      const firstHalf = Math.ceil(bus.capacity / 2);
      const secondHalf = Math.max(0, bus.capacity - firstHalf);
      if (firstHalf > 0) {
        segments.push({ color: bus.color, remaining: firstHalf });
      }
      if (secondHalf > 0) {
        segments.push({ color: bus.secondaryColor, remaining: secondHalf });
      }
    } else {
      segments.push({ color: bus.color, remaining: bus.capacity });
    }

    if (bus.mechanic === 'tunnel_spawner' && bus.tunnelReserve) {
      segments.push({
        color: bus.tunnelReserve.color || bus.color,
        remaining: bus.tunnelReserve.capacity || 3,
      });
    }
  }
  return segments;
}

/**
 * Simulates peeling the buses and builds a passengerQueue in solvable wave order
 * with progressive color chunking based on levelNumber.
 */
export function buildBalancedPassengerQueue(
  buses,
  _existingQueue,
  gridWidth,
  gridHeight,
  levelNumber = 1
) {
  // Simulate peeling buses in solvable order.
  const remaining = buses.map((b) => ({ ...b }));
  const peeledBuses = [];
  let lastColor = null;

  while (remaining.length > 0) {
    const unblockedIndices = [];
    for (let i = 0; i < remaining.length; i++) {
      if (!findBlockingBus(remaining[i], remaining, gridWidth, gridHeight)) {
        unblockedIndices.push(i);
      }
    }

    let pickIdx = unblockedIndices.length > 0 ? unblockedIndices[0] : 0;
    if (levelNumber <= 5 && lastColor && unblockedIndices.length > 1) {
      const sameColorIdx = unblockedIndices.find(
        (idx) => remaining[idx].color === lastColor && !remaining[idx].mechanic
      );
      if (sameColorIdx !== undefined) {
        pickIdx = sameColorIdx;
      }
    }

    const picked = remaining.splice(pickIdx, 1)[0];
    lastColor = picked.color;
    peeledBuses.push(picked);
  }

  const segments = expandBusPassengerSegments(peeledBuses);
  const lvl = Math.max(1, Math.floor(levelNumber || 1));

  // Levels 1 to 4: 100% pure contiguous chunks per bus segment (zero interleaving)
  if (lvl <= 4) {
    const pureQueue = [];
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      for (let c = 0; c < seg.remaining; c++) {
        pureQueue.push(seg.color);
      }
    }
    return pureQueue;
  }

  // Levels 5+: Progressive chunked interleaving within small solvable waves (2..3 segments)
  // Because buses now hold 3, 15, 25, or 40 passengers, scale chunk sizes cleanly
  const waveSegCount = lvl <= 12 ? 2 : 3;
  const chunkSize = lvl <= 8 ? 8 : lvl <= 18 ? 6 : lvl <= 35 ? 5 : lvl <= 60 ? 4 : 3;

  const queue = [];
  for (let w = 0; w < segments.length; w += waveSegCount) {
    const wave = segments.slice(w, w + waveSegCount).map((s) => ({
      color: s.color,
      remaining: s.remaining,
    }));

    let anyLeft = true;
    while (anyLeft) {
      anyLeft = false;
      for (let i = 0; i < wave.length; i++) {
        if (wave[i].remaining > 0) {
          const take = Math.min(chunkSize, wave[i].remaining);
          for (let k = 0; k < take; k++) {
            queue.push(wave[i].color);
          }
          wave[i].remaining -= take;
          if (wave[i].remaining > 0) anyLeft = true;
        }
      }
    }
  }

  return queue;
}

/**
 * Deterministic PRNG (Mulberry32) for reproducible procedural stages across 100+ stations.
 */
function createRng(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Reverse-Peel Solvable Stage Generator.
 * Creates zero-overlap, 100% solvable levels across all 100 City Stations and beyond.
 */
export function generateSolvableStage(levelNumber, customSeed) {
  const rng = createRng(customSeed !== undefined ? customSeed : levelNumber * 9973 + 1337);

  const milestoneTier = Math.floor((levelNumber - 1) / 10);
  const gridWidth = Math.min(9, 6 + Math.min(3, Math.floor(levelNumber / 8)));
  const gridHeight = Math.min(9, 6 + Math.min(3, Math.floor(levelNumber / 6)));

  const targetBusCount = Math.min(
    16,
    6 + Math.floor(levelNumber * 0.14) + (levelNumber % 5 === 0 ? 2 : 0)
  );

  const numColors = Math.min(
    COLORS_PALETTE.length,
    3 + Math.floor(levelNumber / 6)
  );
  const activeColors = COLORS_PALETTE.slice(0, numColors);

  const occupied = new Set();
  const placedBuses = [];
  const dirs = ['N', 'S', 'E', 'W'];

  for (let bIdx = 0; bIdx < targetBusCount * 4 && placedBuses.length < targetBusCount; bIdx++) {
    const roll = rng();
    let type = 'minibus';
    if (roll < 0.30) {
      type = 'taxi';
    } else if (roll < 0.62) {
      type = 'minibus';
    } else if (roll < 0.85) {
      type = 'bus';
    } else {
      type = 'double_bus';
    }

    const spec = VEHICLE_SPECS[type];
    const length = spec.length;
    const capacity = spec.defaultCapacity;
    const color = activeColors[placedBuses.length % activeColors.length];

    const dirOrder = dirs.slice().sort(() => rng() - 0.5);
    if (rng() < 0.45) {
      dirOrder.unshift('N');
    }

    let chosen = null;
    for (let d = 0; d < dirOrder.length && !chosen; d++) {
      const dir = dirOrder[d];
      for (let attempt = 0; attempt < 28; attempt++) {
        const hx = Math.floor(rng() * gridWidth);
        const hz = Math.floor(rng() * gridHeight);
        const candidate = {
          id: `bus_${placedBuses.length + 1}`,
          type,
          color,
          dir,
          length,
          capacity,
          hx,
          hz,
        };

        if (!isBusInBounds(candidate, gridWidth, gridHeight)) continue;

        const cells = getBusCells(candidate);
        let overlap = false;
        for (let c = 0; c < cells.length; c++) {
          if (occupied.has(`${cells[c].x},${cells[c].z}`)) {
            overlap = true;
            break;
          }
        }
        if (overlap) continue;

        const blocker = findBlockingBus(candidate, placedBuses, gridWidth, gridHeight);
        if (!blocker) {
          chosen = candidate;
          break;
        }
      }
    }

    if (chosen) {
      const cells = getBusCells(chosen);
      for (let c = 0; c < cells.length; c++) {
        occupied.add(`${cells[c].x},${cells[c].z}`);
      }
      placedBuses.push(chosen);
    }
  }

  const difficultyNames = ['Easy', 'Normal', 'Medium', 'Hard', 'Expert', 'Master'];
  const difficulty =
    levelNumber % 10 === 0
      ? 'District Boss'
      : levelNumber % 5 === 0
        ? 'Boss Station'
        : difficultyNames[Math.min(difficultyNames.length - 1, milestoneTier)];

  return sanitizeStage({
    level: levelNumber,
    title: `Station ${levelNumber}`,
    difficulty,
    grid: { width: gridWidth, height: gridHeight },
    dockSlots: 4,
    buses: placedBuses,
  });
}
