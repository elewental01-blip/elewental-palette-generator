import { BorderItem, GroundItem, DoodadItem, CarpetItem, WallItem, TilesetItem } from "./types";

export const SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  editorState: "epe-editor-state",
  blogPosts:   "epe-blog-posts",
  colorTheme:  "epe-color-theme",
  effects:     "epe-effects",
  helpLang:    "epe-help-lang",
  helpMode:    "epe-help-mode",
  darkMode:    "rme-theme",
  auth:        "epe-auth",
} as const;

export type PersistedEditorState = {
  version: number;
  borders:  BorderItem[];
  grounds:  GroundItem[];
  doodads:  DoodadItem[];
  carpets:  CarpetItem[];
  walls:    WallItem[];
  tilesets: TilesetItem[];
};

export type EditorDataSlice = Omit<PersistedEditorState, "version">;

export function loadEditorState(): EditorDataSlice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.editorState);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedEditorState;
    if (parsed.version !== SCHEMA_VERSION) return null;
    return {
      borders:  parsed.borders  ?? [],
      grounds:  parsed.grounds  ?? [],
      doodads:  parsed.doodads  ?? [],
      carpets:  parsed.carpets  ?? [],
      walls:    parsed.walls    ?? [],
      tilesets: parsed.tilesets ?? [],
    };
  } catch {
    return null;
  }
}

export function saveEditorState(data: EditorDataSlice): void {
  try {
    const payload: PersistedEditorState = { version: SCHEMA_VERSION, ...data };
    localStorage.setItem(STORAGE_KEYS.editorState, JSON.stringify(payload));
  } catch {}
}

export function clearAllAppData(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try { localStorage.removeItem(key); } catch {}
  });
}
