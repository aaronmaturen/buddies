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
  /** Draw the floor shadow. Default true; turn it off for a buddy with no floor, like one on the desktop. */
  floor?: boolean;
  /** Keep the canvas cheap to read, for hosts that call hitTest many times a second. Default false. */
  readable?: boolean;
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
  /** Draws X eyes instead of eyes. */
  xEyes: boolean;
  /** How many messes sit beside the buddy, for the pet game. */
  messes: number;
  emote(name: string): void;
  /** hold: stay as the object until unmorph(). Held-only morphs like "egg" and "grave" need it. */
  morphInto(name: string, options?: { hold?: boolean }): void;
  /** Melts back from a held morph. */
  unmorph(): void;
  /** The held morph's definition while one is showing. */
  readonly holding: { label: string } | null;
  /** Glances one way for a while; x and y run from -1 to 1. */
  look(x: number, y?: number, seconds?: number): void;
  /** Spawns one cartoon mark: "heart", "bang", "question", "z", "sweat", "anger", "sparkle", ... */
  mark(kind: string): void;
  boop(): void;
  vanish(): void;
  appear(): void;
  /** True when something is drawn near x, y, in canvas pixels from its top left. */
  hitTest(x: number, y: number): boolean;
  /** Stops animating and lets go of the canvas. Call it when the canvas is removed. */
  destroy(): void;
}

export type LeaderCommand =
  | { kind: "emote" | "mood" | "morph"; name: string }
  | { kind: "away"; name: "vanish" | "appear" };

export interface PieItem<T = unknown> { label: string; value?: T; items?: PieItem<T>[] }

/** Opens a pie menu and fires each pick as a "command" CustomEvent with a LeaderCommand as its detail. */
export class Leader extends EventTarget {
  /** x and y are viewport pixels. Pass away: true to offer Come back instead of Disappear. */
  open(x: number, y: number, options?: { away?: boolean }): void;
  close(): void;
}
/** Does a command on one buddy. */
export function follow(buddy: Buddy, command: LeaderCommand): void;
export function leaderMenu(options?: { away?: boolean }): PieItem<LeaderCommand>[];
/** Opens a pie menu and returns a function that closes it. */
export function openPieMenu<T>(x: number, y: number, items: PieItem<T>[], options?: { label?: string; onPick?: (value: T) => void }): () => void;

export function animate(...buddies: Buddy[]): void;
export function stopAnimating(...buddies: Buddy[]): void;
/** Most frames per second to draw. 0 means every animation frame. */
export function setFrameRate(fps: number): void;
/** Tells buddies where the cursor is, in viewport pixels, for hosts that see it beyond the page. */
export function setPointer(x: number, y: number): void;

/** A pet's saved state: plain JSON, safe to store and load. */
export interface Pet { version: number; stage: "egg" | "baby" | "child" | "adult" | "dead"; config: BuddyConfig; [key: string]: unknown }
export type CareAction = "feed" | "play" | "clean" | "medicine" | "lights" | "scold";
export interface PetView {
  stage: Pet["stage"]; morph: "egg" | "grave" | null; mood: string; mark: string | null;
  calling: "hungry" | "sad" | "sick" | "lights" | "naughty" | null;
  messes: number; size: number; lightsOff: boolean; hunger: number; happy: number; discipline: number; age: number;
}
export function newPet(now: number, options?: { config?: BuddyConfig; seed?: number }): Pet;
/** Catches the pet up to now, a minute at a time. Returns what happened: "hatch", "grow", "poop", "sick", "die", ... */
export function advance(pet: Pet, now: number): string[];
/** play takes a guess, "left" or "right". Returns how the buddy takes it, like "eat", "full", "won-left" or "sulk". */
export function care(pet: Pet, action: CareAction, now: number, guess?: "left" | "right"): string;
export function petView(pet: Pet): PetView;
/** The buddy config for the pet's current life stage. */
export function petConfig(pet: Pet): BuddyConfig;
export const PACE: Record<string, unknown>;
export const HEARTS: number;

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
/** "thumbsUp" → "Thumbs up", for showing names from the tables. */
export function words(name: string): string;
