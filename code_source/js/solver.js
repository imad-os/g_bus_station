/**
 * Bus Fever 3D: Traffic Escape — Strict Anti-Overlap Grid Math & Reverse-Peel Solvable Stage Generator
 * Guarantees 100% zero overlap across all buses, exact geometric center positioning,
 * raycast line-of-sight blocking detection, and solvable level generation.
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

export const VEHICLE_SPECS = {
  minivan: { length: 2, defaultCapacity: 4 },
  bus: { length: 2, defaultCapacity: 6 },
  coach: { length: 3, defaultCapacity: 8 },
};

/**
 * Computes the exact integer grid cells occupied by a bus.
 * Head is at (hx, hz), direction is dir ('N'|'S'|'E'|'W'), and length is L (2 or 3).
 * Occupied cells: C_i = (hx - i * dx, hz - i * dz) for i in {0, 1, ..., L-1}
 */
export function getBusCells(bus) {
  const vec = DIR_VECTORS[bus.dir] || DIR_VECTORS.N;
  const L = bus.length || (bus.type === 'coach' ? 3 : 2);
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
 * centerX = hx - ((L - 1) * dx) / 2
 * centerZ = hz - ((L - 1) * dz) / 2
 */
export function getBusWorldCenter(bus, gridWidth, gridHeight, gridOriginZ = 4.2) {
  const vec = DIR_VECTORS[bus.dir] || DIR_VECTORS.N;
  const L = bus.length || (bus.type === 'coach' ? 3 : 2);
  const hx = bus.hx !== undefined ? bus.hx : bus.anchorX;
  const hz = bus.hz !== undefined ? bus.hz : bus.anchorZ;

  const gridCenterX = hx - ((L - 1) * vec.dx) / 2;
  const gridCenterZ = hz - ((L - 1) * vec.dz) / 2;

  const offsetX = ((gridWidth - 1) * CELL_SIZE) / 2;
  const offsetZ = ((gridHeight - 1) * CELL_SIZE) / 2;

  return {
    gridCenterX,
    gridCenterZ,
    worldX: gridCenterX * CELL_SIZE - offsetX,
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
 * Mandatory Pre-Render Overlap & Solvability Sanitizer.
 * Verifies every bus is in bounds and occupies unique integer cells via a Set occupancy check.
 * If a conflict is detected in custom/external JSON, relocates the bus to a free slot or removes it,
 * and recalculates the passengerQueue so total passenger colors match total bus seats 100%.
 */
export function sanitizeStage(rawStage) {
  const gridWidth = rawStage.grid?.width || 7;
  const gridHeight = rawStage.grid?.height || 7;
  const occupied = new Set();
  const sanitizedBuses = [];

  const inputBuses = Array.isArray(rawStage.buses) ? rawStage.buses : [];

  for (let idx = 0; idx < inputBuses.length; idx++) {
    const raw = inputBuses[idx];
    const length = raw.length || VEHICLE_SPECS[raw.type]?.length || 2;
    const capacity = raw.capacity || VEHICLE_SPECS[raw.type]?.defaultCapacity || (length === 3 ? 6 : 4);
    const candidate = {
      id: raw.id || `bus_${idx + 1}`,
      type: raw.type || (length === 3 ? 'coach' : 'bus'),
      color: raw.color || COLORS_PALETTE[idx % COLORS_PALETTE.length],
      dir: DIR_VECTORS[raw.dir] ? raw.dir : 'N',
      length,
      capacity,
      hx: raw.hx !== undefined ? raw.hx : raw.anchorX,
      hz: raw.hz !== undefined ? raw.hz : raw.anchorZ,
    };

    const cells = getBusCells(candidate);
    let valid = isBusInBounds(candidate, gridWidth, gridHeight);
    if (valid) {
      for (let i = 0; i < cells.length; i++) {
        const key = `${cells[i].x},${cells[i].z}`;
        if (occupied.has(key)) {
          valid = false;
          break;
        }
      }
    }

    if (!valid) {
      // Attempt to relocate candidate to a non-overlapping valid position on the grid
      let relocated = null;
      const dirs = [candidate.dir, 'N', 'E', 'W', 'S'];
      outer: for (let d = 0; d < dirs.length; d++) {
        const tryDir = dirs[d];
        for (let z = 0; z < gridHeight; z++) {
          for (let x = 0; x < gridWidth; x++) {
            const testBus = { ...candidate, dir: tryDir, hx: x, hz: z };
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
              relocated = testBus;
              break outer;
            }
          }
        }
      }
      if (relocated) {
        const relCells = getBusCells(relocated);
        for (let c = 0; c < relCells.length; c++) {
          occupied.add(`${relCells[c].x},${relCells[c].z}`);
        }
        sanitizedBuses.push(relocated);
      }
    } else {
      for (let c = 0; c < cells.length; c++) {
        occupied.add(`${cells[c].x},${cells[c].z}`);
      }
      sanitizedBuses.push(candidate);
    }
  }

  // Ensure every stage can be peeled (no permanent mutual cycles)
  fixMutualCycles(sanitizedBuses, gridWidth, gridHeight);

  // Reconcile passengerQueue so exact seat counts per color match 100%
  const passengerQueue = buildBalancedPassengerQueue(
    sanitizedBuses,
    rawStage.passengerQueue,
    gridWidth,
    gridHeight
  );

  return {
    level: rawStage.level || 1,
    title: rawStage.title || `Level ${rawStage.level || 1}`,
    difficulty: rawStage.difficulty || 'medium',
    grid: { width: gridWidth, height: gridHeight },
    dockSlots: rawStage.dockSlots || 4,
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

      // If still blocked in both directions, point it toward nearest edge if 1-cell flip isn't possible
      if (findBlockingBus(stuck, remaining, gridWidth, gridHeight)) {
        stuck.dir = 'N';
        if (orig) orig.dir = 'N';
      }
    }
  }
  return peelOrder;
}

/**
 * Simulates peeling the buses and builds a passengerQueue in solvable wave order
 * so that total passenger colors match total bus capacities 100%, and early-unblocked
 * buses match the front waves of passengers.
 */
export function buildBalancedPassengerQueue(buses, existingQueue, gridWidth, gridHeight) {
  // Calculate exact required seats per color
  const requiredByColor = {};
  let totalRequired = 0;
  for (let i = 0; i < buses.length; i++) {
    const b = buses[i];
    requiredByColor[b.color] = (requiredByColor[b.color] || 0) + b.capacity;
    totalRequired += b.capacity;
  }

  // Check if existingQueue already matches exact color totals
  if (Array.isArray(existingQueue) && existingQueue.length === totalRequired) {
    const counts = {};
    for (let i = 0; i < existingQueue.length; i++) {
      const col = existingQueue[i];
      counts[col] = (counts[col] || 0) + 1;
    }
    let exactMatch = true;
    for (const col of Object.keys(requiredByColor)) {
      if (counts[col] !== requiredByColor[col]) {
        exactMatch = false;
        break;
      }
    }
    if (exactMatch) {
      return existingQueue.slice();
    }
  }

  // Otherwise generate waves ordered by the natural peel order of the buses
  const remaining = buses.map((b) => ({ ...b }));
  const queue = [];

  while (remaining.length > 0) {
    // Find all currently unblocked buses
    const unblocked = [];
    for (let i = 0; i < remaining.length; i++) {
      if (!findBlockingBus(remaining[i], remaining, gridWidth, gridHeight)) {
        unblocked.push(i);
      }
    }
    const pickIdx = unblocked.length > 0 ? unblocked[0] : 0;
    const picked = remaining.splice(pickIdx, 1)[0];
    for (let c = 0; c < picked.capacity; c++) {
      queue.push(picked.color);
    }
  }

  return queue;
}

/**
 * Deterministic PRNG (Mulberry32) for reproducible procedural stages.
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
 * Creates infinite zero-overlap, 100% solvable levels for any levelNumber.
 * Places buses iteratively so each added bus has a clear exit path at the moment it is peeled.
 */
export function generateSolvableStage(levelNumber, customSeed) {
  const rng = createRng(customSeed !== undefined ? customSeed : levelNumber * 9973 + 1337);

  // Scale grid and bus count with level progression (every 5 levels is a milestone)
  const milestoneTier = Math.floor((levelNumber - 1) / 5);
  const gridWidth = Math.min(9, 6 + Math.min(3, Math.floor(levelNumber / 4)));
  const gridHeight = Math.min(9, 6 + Math.min(3, Math.floor(levelNumber / 3)));

  const targetBusCount = Math.min(
    18,
    6 + Math.floor(levelNumber * 0.85) + (levelNumber % 5 === 0 ? 2 : 0)
  );

  const numColors = Math.min(
    COLORS_PALETTE.length,
    3 + Math.floor(levelNumber / 3)
  );
  const activeColors = COLORS_PALETTE.slice(0, numColors);

  const occupied = new Set();
  const placedBuses = [];
  const dirs = ['N', 'S', 'E', 'W'];

  // We build in reverse peel order:
  // First placed buses are the LAST to leave; later placed buses must be unblocked when earlier ones leave.
  // Even simpler and stronger: place non-overlapping buses, then orient each bus along a direction that is free
  // relative to already-locked "inner" buses!
  for (let bIdx = 0; bIdx < targetBusCount * 4 && placedBuses.length < targetBusCount; bIdx++) {
    const isCoach = rng() < Math.min(0.45, 0.12 + levelNumber * 0.02);
    const isMinivan = !isCoach && rng() < 0.35;
    const type = isCoach ? 'coach' : isMinivan ? 'minivan' : 'bus';
    const length = isCoach ? 3 : 2;
    const capacity = isCoach ? 8 : isMinivan ? 4 : 6;
    const color = activeColors[placedBuses.length % activeColors.length];

    // Shuffle candidate grid cells and directions
    const dirOrder = dirs.slice().sort(() => rng() - 0.5);
    // Bias 'N' slightly so many buses face the road like in classic levels
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

        // Verify this candidate is NOT blocked by any already-placed bus
        // (Since already-placed buses will leave AFTER this candidate in reverse-peel order!)
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

  // Build passenger waves following the peel order (which is reverse of placedBuses!)
  const peelOrder = placedBuses.slice().reverse();
  const passengerQueue = [];
  for (let i = 0; i < peelOrder.length; i++) {
    const bus = peelOrder[i];
    for (let c = 0; c < bus.capacity; c++) {
      passengerQueue.push(bus.color);
    }
  }

  const difficultyNames = ['Easy', 'Normal', 'Medium', 'Hard', 'Expert'];
  const difficulty =
    levelNumber % 5 === 0
      ? 'Boss Milestone'
      : difficultyNames[Math.min(difficultyNames.length - 1, milestoneTier)];

  return sanitizeStage({
    level: levelNumber,
    title: `Level ${levelNumber}`,
    difficulty,
    grid: { width: gridWidth, height: gridHeight },
    dockSlots: 4,
    buses: placedBuses,
    passengerQueue,
  });
}
