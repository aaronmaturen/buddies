export type HeadShape = "round" | "egg" | "obovoid" | "squircle" | "bean" | "tall" | "gumdrop" | "blob" | "cloud"
  | "screen" | "hexagon" | "pentagon" | "pyramid" | "diamond" | "shield" | "dome";
export type EyeShape = "round" | "pill" | "tall" | "soft";

export interface BuddyColor { h: number; s: number; l: number; name?: string }

/** A buddy as plain JSON. Anything missing gets a default; numbers are kept in range. */
export interface BuddyConfig {
  name?: string;
  head?: { shape?: HeadShape; style?: string; color?: BuddyColor };
  eyes?: { shape?: EyeShape; size?: number; spacing?: number; height?: number };
  brows?: { length?: number; thickness?: number; gap?: number };
  hands?: "glove" | "mitt";
  personality?: { temper?: number; attention?: number; curiosity?: number; blinkRate?: number; tilt?: number };
}

/** The internal form of a config. Build one with fromConfig(); change it with the set* functions. */
export interface BuddySpec { name: string; headShape: HeadShape; headStyle: string; color: BuddyColor; [key: string]: unknown }

export interface BuddyOptions {
  /** Head radius as a fraction of the canvas's shorter side. Default 0.3. */
  scale?: number;
  /** "mixed" draws each buddy's own style; any HEAD_STYLES key forces that style. */
  headMode?: string;
}

export class Buddy {
  constructor(canvas: HTMLCanvasElement, spec: BuddySpec, options?: BuddyOptions);
  spec: BuddySpec;
  /** Turns off idle motion. Moods, emotes and morphs still play. */
  still: boolean;
  /** True from vanish() until appear(). */
  readonly away: boolean;
  /** The head style actually drawn right now. */
  readonly styleKey: string;
  setSpec(spec: BuddySpec): void;
  setMood(mood: string): void;
  emote(name: string): void;
  morphInto(name: string): void;
  boop(): void;
  vanish(): void;
  appear(): void;
  /** Stops animating and lets go of the canvas. Call it when the canvas is removed. */
  destroy(): void;
}

export function animate(...buddies: Buddy[]): void;
export function stopAnimating(...buddies: Buddy[]): void;

export function fromConfig(config?: BuddyConfig): BuddySpec;
export function toConfig(spec: BuddySpec): BuddyConfig;
export function randomConfig(options?: { shape?: HeadShape; name?: string; rand?: () => number }): BuddyConfig;
export function randomNames(count: number, rand?: () => number): string[];
export function configSchema(): Record<string, unknown>;
export function describe(spec: BuddySpec): { temper: string; attn: string; blink: string; look: string; colorName: string };

export function setHeadShape(spec: BuddySpec, shape: HeadShape): void;
export function setHeadStyle(spec: BuddySpec, style: string): void;
export function setColor(spec: BuddySpec, color: BuddyColor): void;
export function setEyeShape(spec: BuddySpec, shape: EyeShape): void;
export function setTrait(spec: BuddySpec, key: string, value: number): void;

export function castShapes(exclude: HeadShape, rand: () => number): HeadShape[];
export function spreadColors(specs: BuddySpec[], rand: () => number): void;
export function spreadStyles(specs: BuddySpec[], rand: () => number): void;
export function mulberry32(seed: number): () => number;
export function shapeLabel(shape: HeadShape): string;

export const EMOTE_NAMES: string[];
export const MOOD_NAMES: string[];
export const MORPH_NAMES: string[];
export const MORPHS: Record<string, { label: string; [key: string]: unknown }>;
export const HEADS: Record<HeadShape, Record<string, unknown>>;
export const HEAD_STYLES: Record<string, { label: string; [key: string]: unknown }>;
export const EYE_SHAPES: Record<EyeShape, number[]>;
export const EYE_LABELS: Record<EyeShape, string>;
export const PALETTE: Record<string, { h: number; s: number; l: number }>;
export const NAMES: string[];
export const TRAITS: Record<string, { label: string; min: number; max: number; step: number }>;
export const LIMITS: Record<string, Record<string, [number, number]>>;
export const reducedMotion: boolean;
