/**
 * Bus Fever 3D: Traffic Escape — Level Manager & Embedded Pack Fallback
 * Loads levels/pack-01.json (with embedded offline fallback), sanitizes every stage
 * through the strict zero-overlap solver, and generates infinite levels beyond the pack.
 */

import { sanitizeStage, generateSolvableStage } from './solver.js';

export const APP_VERSION = '1.0.0';

export const EMBEDDED_PACK_01 = [
  {
    level: 1,
    title: 'Level 1',
    difficulty: 'Easy',
    grid: { width: 5, height: 6 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'bus', color: 'purple', dir: 'E', length: 2, capacity: 6, hx: 1, hz: 0 },
      { id: 'b2', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 0 },
      { id: 'b3', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 0, hz: 1 },
      { id: 'b4', type: 'bus', color: 'purple', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 1 },
      { id: 'b5', type: 'bus', color: 'green', dir: 'W', length: 2, capacity: 6, hx: 3, hz: 2 },
      { id: 'b6', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 0, hz: 3 },
      { id: 'b7', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 3 },
      { id: 'b8', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 3 },
    ],
  },
  {
    level: 2,
    title: 'Level 2',
    difficulty: 'Easy',
    grid: { width: 5, height: 6 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'bus', color: 'purple', dir: 'E', length: 2, capacity: 6, hx: 1, hz: 0 },
      { id: 'b2', type: 'bus', color: 'purple', dir: 'N', length: 2, capacity: 6, hx: 0, hz: 1 },
      { id: 'b3', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 1 },
      { id: 'b4', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 1 },
      { id: 'b5', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 1 },
      { id: 'b6', type: 'bus', color: 'green', dir: 'W', length: 2, capacity: 6, hx: 0, hz: 3 },
      { id: 'b7', type: 'bus', color: 'green', dir: 'W', length: 2, capacity: 6, hx: 3, hz: 3 },
      { id: 'b8', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 0, hz: 4 },
      { id: 'b9', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 4 },
      { id: 'b10', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 4 },
      { id: 'b11', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 4 },
    ],
  },
  {
    level: 3,
    title: 'Level 3',
    difficulty: 'Normal',
    grid: { width: 6, height: 6 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'coach', color: 'purple', dir: 'E', length: 3, capacity: 8, hx: 2, hz: 0 },
      { id: 'b2', type: 'bus', color: 'orange', dir: 'W', length: 2, capacity: 6, hx: 3, hz: 0 },
      { id: 'b3', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 0, hz: 1 },
      { id: 'b4', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 1 },
      { id: 'b5', type: 'coach', color: 'yellow', dir: 'N', length: 3, capacity: 8, hx: 2, hz: 1 },
      { id: 'b6', type: 'bus', color: 'purple', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 1 },
      { id: 'b7', type: 'bus', color: 'orange', dir: 'E', length: 2, capacity: 6, hx: 5, hz: 3 },
      { id: 'b8', type: 'minivan', color: 'pink', dir: 'W', length: 2, capacity: 4, hx: 0, hz: 3 },
      { id: 'b9', type: 'bus', color: 'green', dir: 'S', length: 2, capacity: 6, hx: 1, hz: 5 },
      { id: 'b10', type: 'bus', color: 'yellow', dir: 'S', length: 2, capacity: 6, hx: 3, hz: 5 },
    ],
  },
  {
    level: 4,
    title: 'Level 4',
    difficulty: 'Normal',
    grid: { width: 6, height: 7 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'bus', color: 'cyan', dir: 'W', length: 2, capacity: 6, hx: 0, hz: 0 },
      { id: 'b2', type: 'bus', color: 'orange', dir: 'E', length: 2, capacity: 6, hx: 5, hz: 0 },
      { id: 'b3', type: 'coach', color: 'purple', dir: 'N', length: 3, capacity: 8, hx: 2, hz: 0 },
      { id: 'b4', type: 'coach', color: 'pink', dir: 'N', length: 3, capacity: 8, hx: 3, hz: 0 },
      { id: 'b5', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 0, hz: 1 },
      { id: 'b6', type: 'bus', color: 'cyan', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 1 },
      { id: 'b7', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 1 },
      { id: 'b8', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 5, hz: 1 },
      { id: 'b9', type: 'coach', color: 'purple', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 3 },
      { id: 'b10', type: 'coach', color: 'pink', dir: 'E', length: 3, capacity: 8, hx: 5, hz: 3 },
      { id: 'b11', type: 'bus', color: 'cyan', dir: 'S', length: 2, capacity: 6, hx: 1, hz: 5 },
      { id: 'b12', type: 'bus', color: 'orange', dir: 'S', length: 2, capacity: 6, hx: 4, hz: 5 },
    ],
  },
  {
    level: 5,
    title: 'Level 5',
    difficulty: 'Boss Milestone',
    grid: { width: 7, height: 7 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'bus', color: 'yellow', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 0 },
      { id: 'b2', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 2 },
      { id: 'b3', type: 'bus', color: 'purple', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 4 },
      { id: 'b4', type: 'minivan', color: 'pink', dir: 'N', length: 2, capacity: 4, hx: 1, hz: 0 },
      { id: 'b5', type: 'bus', color: 'cyan', dir: 'N', length: 2, capacity: 6, hx: 2, hz: 0 },
      { id: 'b6', type: 'bus', color: 'orange', dir: 'S', length: 2, capacity: 6, hx: 4, hz: 1 },
      { id: 'b7', type: 'minivan', color: 'pink', dir: 'S', length: 2, capacity: 4, hx: 5, hz: 1 },
      { id: 'b8', type: 'bus', color: 'yellow', dir: 'W', length: 2, capacity: 6, hx: 0, hz: 3 },
      { id: 'b9', type: 'minivan', color: 'purple', dir: 'E', length: 2, capacity: 4, hx: 6, hz: 3 },
      { id: 'b10', type: 'bus', color: 'cyan', dir: 'W', length: 2, capacity: 6, hx: 0, hz: 4 },
      { id: 'b11', type: 'bus', color: 'yellow', dir: 'E', length: 2, capacity: 6, hx: 6, hz: 4 },
      { id: 'b12', type: 'bus', color: 'pink', dir: 'S', length: 2, capacity: 6, hx: 1, hz: 6 },
      { id: 'b13', type: 'bus', color: 'purple', dir: 'S', length: 2, capacity: 6, hx: 2, hz: 6 },
      { id: 'b14', type: 'bus', color: 'cyan', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 5 },
      { id: 'b15', type: 'bus', color: 'orange', dir: 'S', length: 2, capacity: 6, hx: 5, hz: 6 },
    ],
  },
  {
    level: 6,
    title: 'Level 6',
    difficulty: 'Medium',
    grid: { width: 7, height: 7 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'coach', color: 'red', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 0 },
      { id: 'b2', type: 'coach', color: 'blue', dir: 'E', length: 3, capacity: 8, hx: 6, hz: 0 },
      { id: 'b3', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 0, hz: 1 },
      { id: 'b4', type: 'bus', color: 'yellow', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 1 },
      { id: 'b5', type: 'bus', color: 'purple', dir: 'N', length: 2, capacity: 6, hx: 2, hz: 1 },
      { id: 'b6', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 1 },
      { id: 'b7', type: 'bus', color: 'red', dir: 'N', length: 2, capacity: 6, hx: 5, hz: 1 },
      { id: 'b8', type: 'bus', color: 'blue', dir: 'N', length: 2, capacity: 6, hx: 6, hz: 1 },
      { id: 'b9', type: 'coach', color: 'green', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 3 },
      { id: 'b10', type: 'coach', color: 'yellow', dir: 'E', length: 3, capacity: 8, hx: 6, hz: 3 },
      { id: 'b11', type: 'bus', color: 'purple', dir: 'S', length: 2, capacity: 6, hx: 1, hz: 5 },
      { id: 'b12', type: 'bus', color: 'orange', dir: 'S', length: 2, capacity: 6, hx: 5, hz: 5 },
    ],
  },
  {
    level: 7,
    title: 'Level 7',
    difficulty: 'Medium',
    grid: { width: 7, height: 7 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 0 },
      { id: 'b2', type: 'bus', color: 'cyan', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 0 },
      { id: 'b3', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 5, hz: 0 },
      { id: 'b4', type: 'coach', color: 'purple', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 2 },
      { id: 'b5', type: 'coach', color: 'green', dir: 'E', length: 3, capacity: 8, hx: 6, hz: 2 },
      { id: 'b6', type: 'bus', color: 'yellow', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 3 },
      { id: 'b7', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 2, hz: 3 },
      { id: 'b8', type: 'bus', color: 'cyan', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 3 },
      { id: 'b9', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 5, hz: 3 },
      { id: 'b10', type: 'coach', color: 'yellow', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 5 },
      { id: 'b11', type: 'coach', color: 'purple', dir: 'E', length: 3, capacity: 8, hx: 6, hz: 5 },
      { id: 'b12', type: 'minivan', color: 'green', dir: 'S', length: 2, capacity: 4, hx: 3, hz: 6 },
    ],
  },
  {
    level: 8,
    title: 'Level 8',
    difficulty: 'Hard',
    grid: { width: 7, height: 8 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'coach', color: 'red', dir: 'E', length: 3, capacity: 8, hx: 2, hz: 0 },
      { id: 'b2', type: 'coach', color: 'blue', dir: 'E', length: 3, capacity: 8, hx: 6, hz: 0 },
      { id: 'b3', type: 'bus', color: 'purple', dir: 'N', length: 2, capacity: 6, hx: 0, hz: 1 },
      { id: 'b4', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 1 },
      { id: 'b5', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 2, hz: 1 },
      { id: 'b6', type: 'bus', color: 'yellow', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 1 },
      { id: 'b7', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 5, hz: 1 },
      { id: 'b8', type: 'bus', color: 'cyan', dir: 'N', length: 2, capacity: 6, hx: 6, hz: 1 },
      { id: 'b9', type: 'coach', color: 'purple', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 3 },
      { id: 'b10', type: 'coach', color: 'orange', dir: 'E', length: 3, capacity: 8, hx: 6, hz: 3 },
      { id: 'b11', type: 'bus', color: 'red', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 4 },
      { id: 'b12', type: 'bus', color: 'blue', dir: 'N', length: 2, capacity: 6, hx: 5, hz: 4 },
      { id: 'b13', type: 'bus', color: 'green', dir: 'S', length: 2, capacity: 6, hx: 2, hz: 6 },
      { id: 'b14', type: 'bus', color: 'yellow', dir: 'S', length: 2, capacity: 6, hx: 4, hz: 6 },
    ],
  },
  {
    level: 9,
    title: 'Level 9',
    difficulty: 'Hard',
    grid: { width: 8, height: 8 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'bus', color: 'purple', dir: 'W', length: 2, capacity: 6, hx: 0, hz: 0 },
      { id: 'b2', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 2, hz: 0 },
      { id: 'b3', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 5, hz: 0 },
      { id: 'b4', type: 'bus', color: 'green', dir: 'E', length: 2, capacity: 6, hx: 7, hz: 0 },
      { id: 'b5', type: 'coach', color: 'yellow', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 2 },
      { id: 'b6', type: 'coach', color: 'cyan', dir: 'E', length: 3, capacity: 8, hx: 7, hz: 2 },
      { id: 'b7', type: 'bus', color: 'red', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 1 },
      { id: 'b8', type: 'bus', color: 'blue', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 1 },
      { id: 'b9', type: 'bus', color: 'purple', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 3 },
      { id: 'b10', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 2, hz: 3 },
      { id: 'b11', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 5, hz: 3 },
      { id: 'b12', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 6, hz: 3 },
      { id: 'b13', type: 'coach', color: 'red', dir: 'S', length: 3, capacity: 8, hx: 3, hz: 6 },
      { id: 'b14', type: 'coach', color: 'blue', dir: 'S', length: 3, capacity: 8, hx: 4, hz: 6 },
    ],
  },
  {
    level: 10,
    title: 'Level 10',
    difficulty: 'Boss Milestone',
    grid: { width: 8, height: 8 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'coach', color: 'purple', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 0 },
      { id: 'b2', type: 'coach', color: 'orange', dir: 'E', length: 3, capacity: 8, hx: 7, hz: 0 },
      { id: 'b3', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 0 },
      { id: 'b4', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 0 },
      { id: 'b5', type: 'bus', color: 'yellow', dir: 'N', length: 2, capacity: 6, hx: 0, hz: 1 },
      { id: 'b6', type: 'bus', color: 'cyan', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 1 },
      { id: 'b7', type: 'bus', color: 'red', dir: 'N', length: 2, capacity: 6, hx: 2, hz: 1 },
      { id: 'b8', type: 'bus', color: 'blue', dir: 'N', length: 2, capacity: 6, hx: 5, hz: 1 },
      { id: 'b9', type: 'bus', color: 'purple', dir: 'N', length: 2, capacity: 6, hx: 6, hz: 1 },
      { id: 'b10', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 7, hz: 1 },
      { id: 'b11', type: 'coach', color: 'pink', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 3 },
      { id: 'b12', type: 'coach', color: 'green', dir: 'E', length: 3, capacity: 8, hx: 7, hz: 3 },
      { id: 'b13', type: 'bus', color: 'yellow', dir: 'S', length: 2, capacity: 6, hx: 1, hz: 5 },
      { id: 'b14', type: 'bus', color: 'cyan', dir: 'S', length: 2, capacity: 6, hx: 2, hz: 5 },
      { id: 'b15', type: 'bus', color: 'red', dir: 'S', length: 2, capacity: 6, hx: 5, hz: 5 },
      { id: 'b16', type: 'bus', color: 'blue', dir: 'S', length: 2, capacity: 6, hx: 6, hz: 5 },
    ],
  },
  {
    level: 11,
    title: 'Level 11',
    difficulty: 'Expert',
    grid: { width: 8, height: 8 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'bus', color: 'red', dir: 'W', length: 2, capacity: 6, hx: 0, hz: 0 },
      { id: 'b2', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 2, hz: 0 },
      { id: 'b3', type: 'bus', color: 'yellow', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 0 },
      { id: 'b4', type: 'bus', color: 'purple', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 0 },
      { id: 'b5', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 5, hz: 0 },
      { id: 'b6', type: 'bus', color: 'blue', dir: 'E', length: 2, capacity: 6, hx: 7, hz: 0 },
      { id: 'b7', type: 'coach', color: 'pink', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 2 },
      { id: 'b8', type: 'coach', color: 'cyan', dir: 'E', length: 3, capacity: 8, hx: 7, hz: 2 },
      { id: 'b9', type: 'bus', color: 'red', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 2 },
      { id: 'b10', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 2 },
      { id: 'b11', type: 'coach', color: 'yellow', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 4 },
      { id: 'b12', type: 'coach', color: 'purple', dir: 'E', length: 3, capacity: 8, hx: 7, hz: 4 },
      { id: 'b13', type: 'bus', color: 'orange', dir: 'S', length: 2, capacity: 6, hx: 2, hz: 6 },
      { id: 'b14', type: 'bus', color: 'blue', dir: 'S', length: 2, capacity: 6, hx: 5, hz: 6 },
    ],
  },
  {
    level: 12,
    title: 'Level 12',
    difficulty: 'Expert',
    grid: { width: 8, height: 8 },
    dockSlots: 4,
    buses: [
      { id: 'b1', type: 'coach', color: 'yellow', dir: 'E', length: 3, capacity: 8, hx: 2, hz: 0 },
      { id: 'b2', type: 'bus', color: 'red', dir: 'N', length: 2, capacity: 6, hx: 3, hz: 0 },
      { id: 'b3', type: 'bus', color: 'green', dir: 'N', length: 2, capacity: 6, hx: 4, hz: 0 },
      { id: 'b4', type: 'coach', color: 'purple', dir: 'E', length: 3, capacity: 8, hx: 7, hz: 0 },
      { id: 'b5', type: 'bus', color: 'orange', dir: 'N', length: 2, capacity: 6, hx: 0, hz: 1 },
      { id: 'b6', type: 'bus', color: 'pink', dir: 'N', length: 2, capacity: 6, hx: 1, hz: 1 },
      { id: 'b7', type: 'bus', color: 'cyan', dir: 'N', length: 2, capacity: 6, hx: 2, hz: 1 },
      { id: 'b8', type: 'bus', color: 'blue', dir: 'N', length: 2, capacity: 6, hx: 5, hz: 1 },
      { id: 'b9', type: 'bus', color: 'yellow', dir: 'N', length: 2, capacity: 6, hx: 6, hz: 1 },
      { id: 'b10', type: 'bus', color: 'red', dir: 'N', length: 2, capacity: 6, hx: 7, hz: 1 },
      { id: 'b11', type: 'coach', color: 'green', dir: 'W', length: 3, capacity: 8, hx: 0, hz: 3 },
      { id: 'b12', type: 'coach', color: 'orange', dir: 'E', length: 3, capacity: 8, hx: 7, hz: 3 },
      { id: 'b13', type: 'bus', color: 'pink', dir: 'S', length: 2, capacity: 6, hx: 1, hz: 5 },
      { id: 'b14', type: 'bus', color: 'cyan', dir: 'S', length: 2, capacity: 6, hx: 3, hz: 5 },
      { id: 'b15', type: 'bus', color: 'purple', dir: 'S', length: 2, capacity: 6, hx: 4, hz: 5 },
      { id: 'b16', type: 'bus', color: 'blue', dir: 'S', length: 2, capacity: 6, hx: 6, hz: 5 },
    ],
  },
];

export class LevelManager {
  constructor() {
    this.levels = new Map();
    for (let i = 0; i < EMBEDDED_PACK_01.length; i++) {
      const sanitized = sanitizeStage(EMBEDDED_PACK_01[i]);
      this.levels.set(sanitized.level, sanitized);
    }
  }

  async loadExternalPack(url = `./levels/pack-01.json?v=${APP_VERSION}`) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.levels)) {
          for (let i = 0; i < data.levels.length; i++) {
            const raw = { ...data.levels[i] };
            delete raw.passengerQueue;
            const sanitized = sanitizeStage(raw);
            this.levels.set(sanitized.level, sanitized);
          }
        }
      }
    } catch (_err) {
      // Offline / fallback already loaded via EMBEDDED_PACK_01
    }
  }

  getStage(levelNumber) {
    const num = Math.max(1, Math.floor(levelNumber || 1));
    if (this.levels.has(num)) {
      const cached = this.levels.get(num);
      return JSON.parse(JSON.stringify(cached));
    }
    const generated = generateSolvableStage(num);
    this.levels.set(num, generated);
    return JSON.parse(JSON.stringify(generated));
  }

  exportStageJson(levelNumber) {
    const stage = this.getStage(levelNumber);
    return JSON.stringify(stage, null, 2);
  }
}
