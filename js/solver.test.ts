import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CELL_SIZE,
  getBusCells,
  getBusMeshDimensions,
  getBusWorldCenter,
  isBusInBounds,
  doBusesOverlap,
  sanitizeStage,
  findBlockingBus,
  generateSolvableStage,
} from './solver.js';
import { EMBEDDED_PACK_01, LevelManager } from './levelManager.js';

test('getBusCells & getBusWorldCenter follow exact mathematical formulas', () => {
  const coachN = { id: 'c1', type: 'coach', dir: 'N', length: 3, hx: 2, hz: 1 };
  const cellsN = getBusCells(coachN);
  assert.deepEqual(cellsN, [
    { x: 2, z: 1 },
    { x: 2, z: 2 },
    { x: 2, z: 3 },
  ]);

  const centerN = getBusWorldCenter(coachN, 6, 6);
  // centerX = 2 - ((3-1)*0)/2 = 2
  // centerZ = 1 - ((3-1)*(-1))/2 = 2
  assert.equal(centerN.gridCenterX, 2);
  assert.equal(centerN.gridCenterZ, 2);

  const busE = { id: 'b1', type: 'bus', dir: 'E', length: 2, hx: 3, hz: 0 };
  const cellsE = getBusCells(busE);
  assert.deepEqual(cellsE, [
    { x: 3, z: 0 },
    { x: 2, z: 0 },
  ]);
  const centerE = getBusWorldCenter(busE, 5, 6);
  assert.equal(centerE.gridCenterX, 2.5);
  assert.equal(centerE.gridCenterZ, 0);
});

test('getBusMeshDimensions enforces strict anti-clipping gap', () => {
  const dim2 = getBusMeshDimensions(2);
  assert.ok(Math.abs(dim2.meshWidth - CELL_SIZE * 0.78) < 1e-6);
  assert.ok(Math.abs(dim2.meshLength - (2 * CELL_SIZE - CELL_SIZE * 0.22)) < 1e-6);

  const dim3 = getBusMeshDimensions(3);
  assert.ok(Math.abs(dim3.meshLength - (3 * CELL_SIZE - CELL_SIZE * 0.22)) < 1e-6);
});

test('All 12 authored levels in pack-01 have zero overlapping buses, valid bounds, and exact passenger queue match', () => {
  const manager = new LevelManager();
  for (let lvl = 1; lvl <= 12; lvl++) {
    const stage = manager.getStage(lvl);
    assert.ok(stage.buses.length >= 8, `Level ${lvl} should have at least 8 buses`);

    // Check bounds and pairwise zero overlap
    for (let i = 0; i < stage.buses.length; i++) {
      const bA = stage.buses[i];
      assert.equal(
        isBusInBounds(bA, stage.grid.width, stage.grid.height),
        true,
        `Level ${lvl} bus ${bA.id} out of bounds`
      );
      for (let j = i + 1; j < stage.buses.length; j++) {
        const bB = stage.buses[j];
        assert.equal(
          doBusesOverlap(bA, bB),
          false,
          `Level ${lvl} overlap between ${bA.id} and ${bB.id}`
        );
      }
    }

    // Check passenger queue color balance
    const busSeatsByColor: Record<string, number> = {};
    for (const b of stage.buses) {
      busSeatsByColor[b.color] = (busSeatsByColor[b.color] || 0) + b.capacity;
    }
    const queueByColor: Record<string, number> = {};
    for (const c of stage.passengerQueue) {
      queueByColor[c] = (queueByColor[c] || 0) + 1;
    }
    assert.deepEqual(queueByColor, busSeatsByColor, `Level ${lvl} passenger queue must match bus seats`);

    // Check 100% peelability (every bus can exit the lot)
    const remaining = stage.buses.map((b: any) => ({ ...b }));
    let steps = 0;
    while (remaining.length > 0 && steps < 100) {
      steps++;
      const idx = remaining.findIndex(
        (b: any) => !findBlockingBus(b, remaining, stage.grid.width, stage.grid.height)
      );
      assert.notEqual(idx, -1, `Level ${lvl} should have an unblocked bus at step ${steps}`);
      remaining.splice(idx, 1);
    }
    assert.equal(remaining.length, 0, `Level ${lvl} all buses peeled`);
  }
});

test('Reverse-Peel Solvable Stage Generator produces zero-overlap solvable stages for Levels 13..35', () => {
  for (let lvl = 13; lvl <= 35; lvl++) {
    const stage = generateSolvableStage(lvl);
    assert.ok(stage.buses.length >= 6, `Generated level ${lvl} has buses`);
    for (let i = 0; i < stage.buses.length; i++) {
      assert.equal(isBusInBounds(stage.buses[i], stage.grid.width, stage.grid.height), true);
      for (let j = i + 1; j < stage.buses.length; j++) {
        assert.equal(doBusesOverlap(stage.buses[i], stage.buses[j]), false);
      }
    }
  }
});

test('sanitizeStage automatically fixes overlapping or out-of-bounds buses', () => {
  const brokenStage = {
    level: 99,
    grid: { width: 5, height: 5 },
    buses: [
      { id: 'b1', type: 'bus', color: 'red', dir: 'N', length: 2, capacity: 6, hx: 2, hz: 1 },
      { id: 'b2', type: 'bus', color: 'blue', dir: 'E', length: 2, capacity: 6, hx: 2, hz: 1 }, // overlaps (2,1)!
    ],
  };
  const fixed = sanitizeStage(brokenStage);
  assert.equal(fixed.buses.length, 2);
  assert.equal(doBusesOverlap(fixed.buses[0], fixed.buses[1]), false);
});

test('Zone C dynamic grid origin guarantees strict separation from Zone B parking bays across all levels 1..35', () => {
  const LOT_TOP_EDGE_Z = 0.45;
  const ROAD_BOTTOM_EDGE_Z = -3.75 + 3.35 / 2; // -2.075
  const manager = new LevelManager();

  for (let lvl = 1; lvl <= 35; lvl++) {
    const stage = manager.getStage(lvl);
    const gridW = stage.grid.width;
    const gridH = stage.grid.height;
    const dynamicOriginZ = LOT_TOP_EDGE_Z + (gridH * CELL_SIZE) / 2;

    for (const bus of stage.buses) {
      const pos = getBusWorldCenter(bus, gridW, gridH, dynamicOriginZ);
      const { meshLength } = getBusMeshDimensions(bus.length || 2);
      const isVertical = bus.dir === 'N' || bus.dir === 'S';
      const halfZSpan = isVertical ? meshLength / 2 : (CELL_SIZE * 0.78) / 2;
      const busTopEdgeZ = pos.worldZ - halfZSpan;

      assert.ok(
        busTopEdgeZ >= LOT_TOP_EDGE_Z,
        `Level ${lvl} bus ${bus.id} top edge (${busTopEdgeZ}) must stay below LOT_TOP_EDGE_Z (${LOT_TOP_EDGE_Z})`
      );
      assert.ok(
        busTopEdgeZ - ROAD_BOTTOM_EDGE_Z >= 2.5,
        `Level ${lvl} bus ${bus.id} must maintain >= 2.5 world units separation from Zone B parking bays`
      );
    }
  }
});

