export type BorderDirection = "n" | "s" | "e" | "w" | "cnw" | "cne" | "csw" | "cse" | "dnw" | "dne" | "dsw" | "dse";

export interface BorderItem {
  id: string;
  borderId?: number;
  group?: number;
  comment?: string;
  items: Record<BorderDirection, number | null>;
}

export interface GroundItem {
  id: string;
  name: string;
  serverLookId?: number;
  zOrder?: number;
  items: { id: number; chance: number; }[];
  borders: { align: "outer" | "inner"; id: number; to?: string; }[];
  friends: string[];
}

// ── Carpet types ───────────────────────────────────────────────────────────────

export type CarpetAlignDirection =
  | "n" | "s" | "e" | "w"
  | "cnw" | "cne" | "csw" | "cse"
  | "dnw" | "dne" | "dsw" | "dse"
  | "center";

export type CarpetAlignData =
  | { type: "single"; id: number }
  | { type: "multi"; items: { id: number; chance: number }[] };

export interface CarpetItem {
  id: string;
  name: string;
  serverLookId?: number;
  carpets: Partial<Record<CarpetAlignDirection, CarpetAlignData>>;
}

// ── Doodad element types ───────────────────────────────────────────────────────

export type DoodadElementType =
  | { type: "simple"; id: number; chance: number; alternate?: boolean; }
  | { type: "composite"; chance: number; tiles: { x: number; y: number; z?: number; itemId: number }[]; alternate?: boolean; }
  | { type: "alternate"; items: { id: number; chance: number; }[]; };

export interface DoodadItem {
  id: string;
  name: string;
  serverLookId?: number;
  draggable: boolean;
  onBlocking: boolean;
  thickness: string;
  elements: DoodadElementType[];
}

// ── Wall types ────────────────────────────────────────────────────────────────

export interface WallDoor {
  id: number;
  type: "normal" | "locked" | "quest" | "magic" | "archway" | "normal_alt" | "hatch_window" | "window";
  open?: boolean;
  locked?: boolean;
}

export interface WallTypeData {
  items: { id: number; chance: number; }[];
  doors: WallDoor[];
}

export interface WallItem {
  id: string;
  name: string;
  serverLookId?: number;
  draggable?: boolean;
  onBlocking?: boolean;
  thickness?: string;
  walls: {
    horizontal?: WallTypeData;
    vertical?: WallTypeData;
    corner?: WallTypeData;
    pole?: WallTypeData;
  };
  alternate?: { id: number; chance: number; }[];
  friends?: { name: string; redirect?: boolean; }[];
}

// ── Tileset types ─────────────────────────────────────────────────────────────

export type TilesetSectionType = "terrain" | "doodad" | "raw";

export type TilesetEntry =
  | { kind: "brush"; name: string }
  | { kind: "item"; id: number }
  | { kind: "range"; fromid: number; toid: number };

export interface TilesetSection {
  type: TilesetSectionType;
  entries: TilesetEntry[];
}

export interface TilesetItem {
  id: string;
  name: string;
  sections: TilesetSection[];
}

export interface EditorState {
  borders: BorderItem[];
  grounds: GroundItem[];
  doodads: DoodadItem[];
  carpets: CarpetItem[];
  walls: WallItem[];
  tilesets: TilesetItem[];
}
