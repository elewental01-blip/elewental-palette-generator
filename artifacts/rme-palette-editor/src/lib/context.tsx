import { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from "react";
import { BorderItem, GroundItem, DoodadItem, CarpetItem, WallItem, TilesetItem } from "./types";
import { loadEditorState, saveEditorState } from "./storage";

export type Category = "home" | "tilesets" | "grounds" | "borders" | "doodads" | "walls";

type State = {
  borders: BorderItem[];
  grounds: GroundItem[];
  doodads: DoodadItem[];
  carpets: CarpetItem[];
  walls: WallItem[];
  tilesets: TilesetItem[];
  activeCategory: Category;
  activeItemId: string | null;
};

type Action =
  | { type: "SET_CATEGORY"; category: Category }
  | { type: "SET_ACTIVE_ITEM"; id: string | null }
  | { type: "ADD_BORDER"; border: BorderItem }
  | { type: "UPDATE_BORDER"; id: string; border: BorderItem }
  | { type: "DELETE_BORDER"; id: string }
  | { type: "ADD_GROUND"; ground: GroundItem }
  | { type: "UPDATE_GROUND"; id: string; ground: GroundItem }
  | { type: "DELETE_GROUND"; id: string }
  | { type: "REORDER_GROUNDS"; orderedIds: string[] }
  | { type: "ADD_DOODAD"; doodad: DoodadItem }
  | { type: "UPDATE_DOODAD"; id: string; doodad: DoodadItem }
  | { type: "DELETE_DOODAD"; id: string }
  | { type: "REORDER_DOODADS"; orderedIds: string[] }
  | { type: "ADD_CARPET"; carpet: CarpetItem }
  | { type: "UPDATE_CARPET"; id: string; carpet: CarpetItem }
  | { type: "DELETE_CARPET"; id: string }
  | { type: "REORDER_CARPETS"; orderedIds: string[] }
  | { type: "ADD_WALL"; wall: WallItem }
  | { type: "UPDATE_WALL"; id: string; wall: WallItem }
  | { type: "DELETE_WALL"; id: string }
  | { type: "REORDER_WALLS"; orderedIds: string[] }
  | { type: "ADD_TILESET"; tileset: TilesetItem }
  | { type: "UPDATE_TILESET"; id: string; tileset: TilesetItem }
  | { type: "DELETE_TILESET"; id: string }
  | { type: "CLEAR_CATEGORY"; category: Category }
  | { type: "RESET_ALL" };

const EMPTY_BORDER_ITEMS: BorderItem["items"] = {
  n: null, s: null, e: null, w: null,
  cnw: null, cne: null, csw: null, cse: null,
  dnw: null, dne: null, dsw: null, dse: null,
};

const initialState: State = {
  borders:  [],
  grounds:  [],
  doodads:  [],
  carpets:  [],
  walls:    [],
  tilesets: [],
  activeCategory: "home",
  activeItemId: null,
};

function buildInitialState(): State {
  const saved = loadEditorState();
  if (!saved) return initialState;
  return {
    ...initialState,
    borders:  saved.borders,
    grounds:  saved.grounds,
    doodads:  saved.doodads,
    carpets:  saved.carpets,
    walls:    saved.walls,
    tilesets: saved.tilesets,
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CATEGORY":
      return { ...state, activeCategory: action.category, activeItemId: null };
    case "SET_ACTIVE_ITEM":
      return { ...state, activeItemId: action.id };

    case "ADD_BORDER":
      return { ...state, borders: [...state.borders, action.border], activeItemId: action.border.id };
    case "UPDATE_BORDER":
      return { ...state, borders: state.borders.map((b) => (b.id === action.id ? action.border : b)) };
    case "DELETE_BORDER":
      return { ...state, borders: state.borders.filter((b) => b.id !== action.id), activeItemId: state.activeItemId === action.id ? null : state.activeItemId };

    case "ADD_GROUND":
      return { ...state, grounds: [...state.grounds, action.ground], activeItemId: action.ground.id };
    case "UPDATE_GROUND":
      return { ...state, grounds: state.grounds.map((g) => (g.id === action.id ? action.ground : g)) };
    case "DELETE_GROUND":
      return { ...state, grounds: state.grounds.filter((g) => g.id !== action.id), activeItemId: state.activeItemId === action.id ? null : state.activeItemId };
    case "REORDER_GROUNDS": {
      const map = new Map(state.grounds.map((g) => [g.id, g]));
      return { ...state, grounds: action.orderedIds.flatMap((id) => { const g = map.get(id); return g ? [g] : []; }) };
    }

    case "ADD_DOODAD":
      return { ...state, doodads: [...state.doodads, action.doodad], activeItemId: action.doodad.id };
    case "UPDATE_DOODAD":
      return { ...state, doodads: state.doodads.map((d) => (d.id === action.id ? action.doodad : d)) };
    case "DELETE_DOODAD":
      return { ...state, doodads: state.doodads.filter((d) => d.id !== action.id), activeItemId: state.activeItemId === action.id ? null : state.activeItemId };
    case "REORDER_DOODADS": {
      const map = new Map(state.doodads.map((d) => [d.id, d]));
      return { ...state, doodads: action.orderedIds.flatMap((id) => { const d = map.get(id); return d ? [d] : []; }) };
    }

    case "ADD_CARPET":
      return { ...state, carpets: [...state.carpets, action.carpet], activeItemId: action.carpet.id };
    case "UPDATE_CARPET":
      return { ...state, carpets: state.carpets.map((c) => (c.id === action.id ? action.carpet : c)) };
    case "DELETE_CARPET":
      return { ...state, carpets: state.carpets.filter((c) => c.id !== action.id), activeItemId: state.activeItemId === action.id ? null : state.activeItemId };
    case "REORDER_CARPETS": {
      const map = new Map(state.carpets.map((c) => [c.id, c]));
      return { ...state, carpets: action.orderedIds.flatMap((id) => { const c = map.get(id); return c ? [c] : []; }) };
    }

    case "ADD_WALL":
      return { ...state, walls: [...state.walls, action.wall], activeItemId: action.wall.id };
    case "UPDATE_WALL":
      return { ...state, walls: state.walls.map((w) => (w.id === action.id ? action.wall : w)) };
    case "DELETE_WALL":
      return { ...state, walls: state.walls.filter((w) => w.id !== action.id), activeItemId: state.activeItemId === action.id ? null : state.activeItemId };
    case "REORDER_WALLS": {
      const map = new Map(state.walls.map((w) => [w.id, w]));
      return { ...state, walls: action.orderedIds.flatMap((id) => { const w = map.get(id); return w ? [w] : []; }) };
    }

    case "ADD_TILESET":
      return { ...state, tilesets: [...state.tilesets, action.tileset], activeItemId: action.tileset.id };
    case "UPDATE_TILESET":
      return { ...state, tilesets: state.tilesets.map((t) => (t.id === action.id ? action.tileset : t)) };
    case "DELETE_TILESET":
      return { ...state, tilesets: state.tilesets.filter((t) => t.id !== action.id), activeItemId: state.activeItemId === action.id ? null : state.activeItemId };

    case "CLEAR_CATEGORY":
      return { ...state, [action.category]: [], activeItemId: null };

    case "RESET_ALL":
      return initialState;

    default:
      return state;
  }
}

const EditorContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
  emptyBorderItems: BorderItem["items"];
} | null>(null);

const SAVE_DEBOUNCE_MS = 400;

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveEditorState({
        borders:  state.borders,
        grounds:  state.grounds,
        doodads:  state.doodads,
        carpets:  state.carpets,
        walls:    state.walls,
        tilesets: state.tilesets,
      });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.borders, state.grounds, state.doodads, state.carpets, state.walls, state.tilesets]);

  return (
    <EditorContext.Provider value={{ state, dispatch, emptyBorderItems: EMPTY_BORDER_ITEMS }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor must be used within an EditorProvider");
  return context;
}
