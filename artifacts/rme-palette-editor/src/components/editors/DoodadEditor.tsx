import { useState, useEffect, useRef } from "react";
import { useEditor } from "@/lib/context";
import { DoodadItem, DoodadElementType } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CardContent } from "@/components/ui/card";
import { Plus, Trash2, AlertCircle, ArrowUp, ArrowDown, Pencil, X, Repeat2, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TilesetRegistration } from "./TilesetRegistration";

// ── Composite tile visual grid ───────────────────────────────────────────────

type CompositeTile = { x: number; y: number; z?: number; itemId: number };

const RANGE_OPTIONS = [3, 4, 6, 9] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];
const CELL_SIZE: Record<RangeOption, number>        = { 3: 80, 4: 64, 6: 48, 9: 40 };
const DIALOG_CELL_SIZE: Record<RangeOption, number> = { 3: 116, 4: 92, 6: 70, 9: 56 };

// ── Shared grid cell renderer (used by both Composite and Composite3D grids) ──

function buildGridCells(
  size: number,
  gridMin: number,
  CELL: number,
  tileAt: (x: number, y: number) => { itemId: number } | undefined,
  addingCell: { x: number; y: number } | null,
  editingCell: { x: number; y: number } | null,
  inputVal: string,
  setInputVal: (v: string) => void,
  startAdd: (x: number, y: number) => void,
  startEdit: (x: number, y: number, id: number) => void,
  commitAdd: (x: number, y: number) => void,
  commitEdit: (x: number, y: number) => void,
  removeTile: (x: number, y: number) => void,
  cancel: () => void,
  extraTitle?: string,
  testPrefix = "composite",
) {
  return Array.from({ length: size }).map((_, rowIdx) =>
    Array.from({ length: size }).map((_, colIdx) => {
      const x = gridMin + colIdx;
      const y = gridMin + rowIdx;
      const tile = tileAt(x, y);
      const isAdd = addingCell?.x === x && addingCell?.y === y;
      const isEdit = editingCell?.x === x && editingCell?.y === y;
      const isOrigin = x === 0 && y === 0;
      return (
        <div key={`${x}-${y}`} data-testid={`${testPrefix}-cell-${x}-${y}`}
          className={[
            "relative flex flex-col items-center justify-center rounded-md border transition-all select-none overflow-hidden",
            tile
              ? (isOrigin ? "bg-primary/15 border-orange-500/60 ring-1 ring-orange-500/20" : "bg-primary/15 border-primary/50")
              : isAdd || isEdit ? "bg-accent/20 border-primary border-dashed"
              : isOrigin ? "bg-orange-500/15 border-orange-500/70 cursor-pointer hover:bg-orange-500/25 ring-1 ring-orange-500/20"
              : "bg-muted/10 border-border/20 cursor-pointer hover:bg-accent/20 hover:border-border/50",
          ].join(" ")}
          style={{ width: CELL, height: CELL }}
          onClick={() => !tile && !isAdd && !isEdit && startAdd(x, y)}
          title={!tile ? `x=${x} y=${y}${extraTitle ? " " + extraTitle : ""}` : undefined}
        >
          <span className="absolute top-0.5 left-0.5 text-[7px] font-mono text-muted-foreground/25 pointer-events-none leading-none">{x},{y}</span>
          {isOrigin && !tile && !isAdd && !isEdit && <span className="text-[9px] font-bold text-orange-500/60 pointer-events-none">0,0</span>}
          {tile && !isEdit && (
            <div className="flex flex-col items-center gap-0.5 w-full px-1" onClick={(e) => e.stopPropagation()}>
              <span className="text-sm font-mono font-bold text-primary leading-none">{tile.itemId}</span>
              <div className="flex gap-0.5 w-full justify-center">
                <button type="button" onClick={() => startEdit(x, y, tile.itemId)} data-testid={`button-edit-tile-${x}-${y}`}
                  className="flex-1 flex items-center justify-center py-0.5 rounded bg-muted hover:bg-accent border border-border/50 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                  <Pencil className="w-2.5 h-2.5" />
                </button>
                <button type="button" onClick={() => removeTile(x, y)} data-testid={`button-clear-tile-${x}-${y}`}
                  className="flex items-center justify-center px-1 py-0.5 rounded bg-muted hover:bg-destructive/20 border border-border/50 hover:border-destructive/50 text-muted-foreground hover:text-destructive transition-colors" title="Remove">
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}
          {isAdd && !tile && (
            <form className="flex flex-col items-center gap-0.5 w-full px-1" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); commitAdd(x, y); }}>
              <Input autoFocus type="text" inputMode="numeric" pattern="[0-9]*" placeholder="ID" value={inputVal}
                onChange={(e) => setInputVal(e.target.value.replace(/[^0-9]/g, ""))}
                className="h-5 w-full text-[10px] text-center px-0.5"
                onKeyDown={(e) => { if (!/^[0-9]$/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Enter","Escape"].includes(e.key) && !e.metaKey && !e.ctrlKey) e.preventDefault(); if (e.key === "Escape") cancel(); }} />
              <div className="flex gap-0.5 w-full">
                <button type="submit" className="flex-1 flex items-center justify-center py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-semibold hover:opacity-90">✓</button>
                <button type="button" onClick={cancel} className="px-1 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground hover:text-foreground"><X className="w-2 h-2" /></button>
              </div>
            </form>
          )}
          {isEdit && tile && (
            <form className="flex flex-col items-center gap-0.5 w-full px-1" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); commitEdit(x, y); }}>
              <Input autoFocus type="text" inputMode="numeric" pattern="[0-9]*" value={inputVal}
                onChange={(e) => setInputVal(e.target.value.replace(/[^0-9]/g, ""))}
                className="h-5 w-full text-[10px] text-center px-0.5"
                onKeyDown={(e) => { if (!/^[0-9]$/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Enter","Escape"].includes(e.key) && !e.metaKey && !e.ctrlKey) e.preventDefault(); if (e.key === "Escape") cancel(); }} />
              <div className="flex gap-0.5 w-full">
                <button type="submit" className="flex-1 flex items-center justify-center py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-semibold hover:opacity-90">✓</button>
                <button type="button" onClick={cancel} className="px-1 py-0.5 rounded bg-muted border border-border/60 text-muted-foreground hover:text-foreground"><X className="w-2 h-2" /></button>
              </div>
            </form>
          )}
          {!tile && !isAdd && !isEdit && !isOrigin && <Plus className="w-3.5 h-3.5 text-muted-foreground/15" />}
        </div>
      );
    })
  );
}

// ── Composite tile grid (X/Y only — no Z dimension) ───────────────────────────

function CompositeTileGrid({ tiles, onChange }: { tiles: { x: number; y: number; itemId: number }[]; onChange: (tiles: { x: number; y: number; itemId: number }[]) => void }) {
  const [range, setRange]       = useState<RangeOption>(3);
  const [dialogOpen, setDialog] = useState(false);
  const [addingCell, setAdding] = useState<{ x: number; y: number } | null>(null);
  const [editingCell, setEditing] = useState<{ x: number; y: number } | null>(null);
  const [inputVal, setInputVal] = useState("");

  const CELL    = CELL_SIZE[range];
  const gridMin = -range;
  const size    = range * 2 + 1;

  const tileAt    = (x: number, y: number) => tiles.find((t) => t.x === x && t.y === y);
  const cancel    = () => { setAdding(null); setEditing(null); setInputVal(""); };
  const startAdd  = (x: number, y: number) => { setAdding({ x, y }); setEditing(null); setInputVal(""); };
  const startEdit = (x: number, y: number, id: number) => { setEditing({ x, y }); setAdding(null); setInputVal(String(id)); };
  const commitAdd = (x: number, y: number) => { const id = parseInt(inputVal); if (!isNaN(id) && id > 0) onChange([...tiles, { x, y, itemId: id }]); cancel(); };
  const commitEdit = (x: number, y: number) => { const id = parseInt(inputVal); if (!isNaN(id) && id > 0) onChange(tiles.map((t) => t.x === x && t.y === y ? { ...t, itemId: id } : t)); cancel(); };
  const removeTile = (x: number, y: number) => { onChange(tiles.filter((t) => !(t.x === x && t.y === y))); cancel(); };

  const gridStyle = { gridTemplateColumns: `repeat(${size}, ${CELL}px)` };

  const gridCells = buildGridCells(size, gridMin, CELL, tileAt, addingCell, editingCell, inputVal, setInputVal, startAdd, startEdit, commitAdd, commitEdit, removeTile, cancel);

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">Click a cell to add · ✏ edit · ✕ remove · orange = origin (0,0)</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium shrink-0">Grid:</span>
        {RANGE_OPTIONS.map((r) => (
          <button key={r} type="button" onClick={() => setRange(r)}
            className={["px-2 py-0.5 text-xs rounded border transition-colors", range === r ? "bg-primary/20 border-primary text-primary font-semibold" : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"].join(" ")}>
            ±{r}
          </button>
        ))}
        <Button size="sm" variant="ghost" className="ml-auto h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => setDialog(true)}
          data-help="Expand — abre o Tile Layout em modo tela cheia para edição com mais espaço">
          <ExternalLink className="w-3 h-3" /> Expand
        </Button>
      </div>
      <div className="overflow-auto">
        <div className="inline-grid gap-0.5 rounded-lg border border-border/50 bg-sidebar p-1.5" style={gridStyle} data-testid="composite-tile-grid">
          {gridCells}
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialog(open); if (!open) cancel(); }}>
        <DialogContent className="flex flex-col p-0 rounded-none" style={{ width: "100vw", height: "100vh", maxWidth: "100vw", maxHeight: "100vh" }}>
          <DialogHeader className="p-4 pb-3 shrink-0 border-b border-border">
            <DialogTitle>Tile Layout — ±{range} grid (X/Y)</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4">
            <div className="flex items-center gap-1.5 flex-wrap mb-4">
              <span className="text-xs text-muted-foreground font-medium shrink-0">Grid:</span>
              {RANGE_OPTIONS.map((r) => (
                <button key={r} type="button" onClick={() => setRange(r)}
                  className={["px-2 py-0.5 text-xs rounded border transition-colors", range === r ? "bg-primary/20 border-primary text-primary font-semibold" : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"].join(" ")}>
                  ±{r}
                </button>
              ))}
            </div>
            <div className="overflow-auto">
              <div className="inline-grid gap-1 rounded-lg border border-border/50 bg-sidebar p-2"
                style={{ gridTemplateColumns: `repeat(${size}, ${DIALOG_CELL_SIZE[range]}px)` }}>
                {buildGridCells(size, gridMin, DIALOG_CELL_SIZE[range], tileAt, addingCell, editingCell, inputVal, setInputVal, startAdd, startEdit, commitAdd, commitEdit, removeTile, cancel)}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Composite 3D grid (X/Y/Z with perspective stacking) ──────────────────────

const Z3D_MIN = -7;
const Z3D_MAX = 7;
const Z3D_STEP_X = 22;
const Z3D_STEP_Y = 14;


function Composite3DGrid({ tiles, onChange }: {
  tiles: { x: number; y: number; z: number; itemId: number }[];
  onChange: (tiles: { x: number; y: number; z: number; itemId: number }[]) => void;
}) {
  const [range, setRange]         = useState<RangeOption>(3);
  const [activeZ, setActiveZ]     = useState(0);
  const [dialogOpen, setDialog]   = useState(false);
  const [addingCell, setAdding]   = useState<{ x: number; y: number } | null>(null);
  const [editingCell, setEditing] = useState<{ x: number; y: number } | null>(null);
  const [inputVal, setInputVal]   = useState("");

  // Pan state for drag-to-navigate
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const panRef = useRef({ isPanning: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  const CELL    = CELL_SIZE[range];
  const gridMin = -range;
  const size    = range * 2 + 1;
  const zLabel  = (z: number) => `Z${z >= 0 ? "+" : ""}${z}`;
  // RME floor convention: Floor 7 = Z0, Floor 6 = Z-1, Floor 8 = Z+1 → floor = 7 + z
  const floorLabel = (z: number) => `Floor ${7 + z}`;

  const tilesOnZ  = (z: number) => tiles.filter((t) => t.z === z);
  const tileAt    = (x: number, y: number, z = activeZ) => tiles.find((t) => t.x === x && t.y === y && t.z === z);
  const occupiedZ = [...new Set(tiles.map((t) => t.z))].sort((a, b) => a - b);

  const cancel     = () => { setAdding(null); setEditing(null); setInputVal(""); };
  const startAdd   = (x: number, y: number) => { setAdding({ x, y }); setEditing(null); setInputVal(""); };
  const startEdit  = (x: number, y: number, id: number) => { setEditing({ x, y }); setAdding(null); setInputVal(String(id)); };
  const commitAdd  = (x: number, y: number) => { const id = parseInt(inputVal); if (!isNaN(id) && id > 0) onChange([...tiles, { x, y, z: activeZ, itemId: id }]); cancel(); };
  const commitEdit = (x: number, y: number) => { const id = parseInt(inputVal); if (!isNaN(id) && id > 0) onChange(tiles.map((t) => t.x === x && t.y === y && t.z === activeZ ? { ...t, itemId: id } : t)); cancel(); };
  const removeTile = (x: number, y: number) => { onChange(tiles.filter((t) => !(t.x === x && t.y === y && t.z === activeZ))); cancel(); };

  // Reset pan when grid range changes
  useEffect(() => { setPanX(0); setPanY(0); }, [range]);

  // Pan handlers — ignore drags that start on interactive elements
  const handlePanDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, form")) return;
    panRef.current = { isPanning: true, startX: e.clientX, startY: e.clientY, startPanX: panX, startPanY: panY };
    e.preventDefault();
  };
  const handlePanMove = (e: React.MouseEvent) => {
    if (!panRef.current.isPanning) return;
    setPanX(panRef.current.startPanX + (e.clientX - panRef.current.startX));
    setPanY(panRef.current.startPanY + (e.clientY - panRef.current.startY));
  };
  const handlePanEnd = () => { panRef.current.isPanning = false; };

  // Z layers to render: all layers in the full configured range (Z3D_MIN to Z3D_MAX)
  // Sort descending (highest Z first) so Z+ layers (SE/underground) render before Z- (NW/above)
  const renderLayers = Array.from({ length: Z3D_MAX - Z3D_MIN + 1 }, (_, i) => Z3D_MAX - i);

  const dzValues  = renderLayers.map((z) => z - activeZ);
  // Z- layers project NW → need padding on left/top
  const maxNegDz  = Math.abs(Math.min(0, ...dzValues));
  // Z+ layers project SE → need padding on right/bottom
  const maxPosDz  = Math.max(0, ...dzValues);

  // renderStack accepts a cell size and an optional className for the viewport container
  const renderStack = (cell: number, viewportClassName = "h-80") => {
    const gridW      = size * cell + (size - 1) * 2;
    const containerW = gridW + (maxNegDz + maxPosDz) * Z3D_STEP_X + 40;
    const containerH = size * cell + (size - 1) * 2 + (maxNegDz + maxPosDz) * Z3D_STEP_Y + 40;
    const baseLeft   = maxNegDz * Z3D_STEP_X + 20;
    const baseTop    = maxNegDz * Z3D_STEP_Y + 20;

    return (
      <div
        className={["overflow-hidden rounded-lg select-none cursor-grab", viewportClassName].join(" ")}
        style={{ touchAction: "none" }}
        onMouseDown={handlePanDown}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        <div style={{
          position: "relative",
          width: containerW,
          height: containerH,
          transform: `translate(${panX}px, ${panY}px)`,
          willChange: "transform",
        }}>
          {renderLayers.map((z) => {
            const dz       = z - activeZ;
            const adz      = Math.abs(dz);
            const isActive = dz === 0;
            // Z- (negative) → north-west (upper floors); Z+ (positive) → south-east (lower floors)
            const left = baseLeft + dz * Z3D_STEP_X;
            const top  = baseTop  + dz * Z3D_STEP_Y;
            // Keep layers clearly visible — minimum 78% opacity
            const opacity = isActive ? 1 : Math.max(0.78, 1 - adz * 0.07);
            const layerTiles = tilesOnZ(z);

            return (
              <div key={z} style={{
                position: "absolute", left, top,
                zIndex: isActive ? 100 : dz < 0 ? 20 + adz : Math.max(5, 15 - dz),
                opacity,
                pointerEvents: isActive ? "auto" : "none",
                transition: "opacity 0.15s",
              }}>
                {/* Floor label — top-right corner of every layer */}
                <div className="absolute -top-5 right-0 pointer-events-none">
                  <span className={[
                    "text-[9px] font-mono px-1.5 py-0.5 rounded",
                    isActive
                      ? "text-yellow-300 bg-yellow-400/20 border border-yellow-400/50 font-bold"
                      : "text-muted-foreground/50 bg-sidebar/70",
                  ].join(" ")}>
                    {floorLabel(z)}
                  </span>
                </div>
                {/* Tile count badge for non-active occupied layers */}
                {!isActive && layerTiles.length > 0 && (
                  <div className="absolute -top-5 left-0 pointer-events-none">
                    <span className="text-[9px] font-mono text-muted-foreground/50 bg-sidebar/70 px-1 rounded">
                      {layerTiles.length}t
                    </span>
                  </div>
                )}
                {isActive ? (
                  <div
                    className="inline-grid gap-0.5 rounded-lg border-2 border-yellow-400 bg-sidebar p-1.5 shadow-lg shadow-yellow-400/10"
                    style={{ gridTemplateColumns: `repeat(${size}, ${cell}px)` }}
                    data-testid="composite-3d-tile-grid"
                  >
                    {buildGridCells(
                      size, gridMin, cell,
                      (x, y) => tileAt(x, y, activeZ) ? { itemId: tileAt(x, y, activeZ)!.itemId } : undefined,
                      addingCell, editingCell, inputVal, setInputVal,
                      startAdd, startEdit, commitAdd, commitEdit, removeTile, cancel,
                      zLabel(activeZ), "composite3d",
                    )}
                  </div>
                ) : (
                  <div className="inline-grid gap-0.5 rounded-lg border-2 border-border/70 bg-sidebar p-1.5"
                    style={{ gridTemplateColumns: `repeat(${size}, ${cell}px)` }}>
                    {Array.from({ length: size }).map((_, rowIdx) =>
                      Array.from({ length: size }).map((_, colIdx) => {
                        const x = gridMin + colIdx;
                        const y = gridMin + rowIdx;
                        const hasTile = !!layerTiles.find((t) => t.x === x && t.y === y);
                        const isOrigin = x === 0 && y === 0;
                        return (
                          <div key={`${x}-${y}`}
                            className={["rounded border flex items-center justify-center",
                              hasTile ? "bg-primary/40 border-primary/70"
                              : isOrigin ? "bg-orange-500/20 border-orange-500/50"
                              : "bg-muted/25 border-border/50",
                            ].join(" ")}
                            style={{ width: cell, height: cell }}>
                            {hasTile && <span className="text-[8px] font-mono text-primary/60">{layerTiles.find((t) => t.x === x && t.y === y)!.itemId}</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Controls = () => (
    <div className="space-y-1.5 mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium shrink-0"
          data-help="Z layer — altitude ativa para edição. Z− = andares acima (noroeste), Z+ = andares abaixo (sudeste)">Z layer:</span>
        <button type="button" onClick={() => setActiveZ((z) => Math.max(Z3D_MIN, z - 1))} disabled={activeZ === Z3D_MIN}
          className="w-5 h-5 rounded border border-border/40 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
          data-help="Subir — muda para o andar acima (Z negativo, deslocado para noroeste na perspectiva)">−</button>
        <span className="font-mono text-xs min-w-[3.5rem] text-center bg-muted/40 border border-orange-500/30 rounded px-2 py-0.5 leading-5 text-orange-400"
          data-help="Camada Z ativa — camada sendo editada. Tiles adicionados vão para esta altitude">{zLabel(activeZ)}</span>
        <button type="button" onClick={() => setActiveZ((z) => Math.min(Z3D_MAX, z + 1))} disabled={activeZ === Z3D_MAX}
          className="w-5 h-5 rounded border border-border/40 flex items-center justify-center text-xs text-muted-foreground hover:text-foreground disabled:opacity-25 transition-colors"
          data-help="Descer — muda para o andar abaixo (Z positivo, deslocado para sudeste na perspectiva)">+</button>
        <span className="text-[11px] text-muted-foreground">{tilesOnZ(activeZ).length} tile{tilesOnZ(activeZ).length !== 1 ? "s" : ""}</span>
      </div>
      {occupiedZ.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-muted-foreground/50 shrink-0"
            data-help="Layers — camadas Z que possuem tiles. Clique em qualquer camada para navegar diretamente até ela">Layers:</span>
          {occupiedZ.map((z) => (
            <button key={z} type="button" onClick={() => setActiveZ(z)}
              className={["px-1.5 py-0 text-[10px] font-mono rounded border transition-colors leading-5",
                z === activeZ ? "bg-orange-500/20 border-orange-500/60 text-orange-400 font-bold"
                : "border-border/40 text-muted-foreground hover:border-primary/50 hover:text-foreground",
              ].join(" ")}
              data-help={`Camada ${zLabel(z)} — clique para editar esta camada (${tilesOnZ(z).length} tile${tilesOnZ(z).length !== 1 ? "s" : ""})`}>
              {zLabel(z)} ({tilesOnZ(z).length})
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-muted-foreground">
        Z negativo = andar <span className="text-blue-400 font-medium">acima</span> (noroeste) · Z positivo = andar <span className="text-orange-400 font-medium">abaixo</span> (sudeste) · clique para adicionar
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium shrink-0">Grid:</span>
        {RANGE_OPTIONS.map((r) => (
          <button key={r} type="button" onClick={() => setRange(r)}
            className={["px-2 py-0.5 text-xs rounded border transition-colors", range === r ? "bg-primary/20 border-primary text-primary font-semibold" : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"].join(" ")}>
            ±{r}
          </button>
        ))}
        <Button size="sm" variant="ghost" className="ml-auto h-6 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground" onClick={() => setDialog(true)}
          data-help="Expand — abre o Tile Layout 3D em modo tela cheia para editar múltiplas camadas Z com mais espaço">
          <ExternalLink className="w-3 h-3" /> Expand
        </Button>
      </div>
      {Controls()}
      {renderStack(CELL)}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialog(open); if (!open) cancel(); }}>
        <DialogContent className="flex flex-col p-0 rounded-none" style={{ width: "100vw", height: "100vh", maxWidth: "100vw", maxHeight: "100vh" }}>
          <DialogHeader className="p-4 pb-3 shrink-0 border-b border-border">
            <DialogTitle>Composite 3D — Tile Layout ({zLabel(activeZ)} · {floorLabel(activeZ)})</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
            {Controls()}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium shrink-0">Grid:</span>
              {RANGE_OPTIONS.map((r) => (
                <button key={r} type="button" onClick={() => setRange(r)}
                  className={["px-2 py-0.5 text-xs rounded border transition-colors", range === r ? "bg-primary/20 border-primary text-primary font-semibold" : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground"].join(" ")}>
                  ±{r}
                </button>
              ))}
            </div>
            {renderStack(DIALOG_CELL_SIZE[range], "flex-1")}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Element header ─────────────────────────────────────────────────────────────

function ElementHeader({ el, idx, total, onMove, onRemove, onToggleAlternate }: {
  el: DoodadElementType;
  idx: number;
  total: number;
  onMove: (dir: "up" | "down") => void;
  onRemove: () => void;
  onToggleAlternate?: () => void;
}) {
  const TYPE_COLOR: Record<string, string> = {
    simple:      "text-blue-400",
    composite:   "text-amber-400",
    composite3d: "text-teal-400",
    alternate:   "text-purple-400",
  };
  const TYPE_BG: Record<string, string> = {
    simple:      "bg-blue-500/8 border-blue-500/20",
    composite:   "bg-amber-500/8 border-amber-500/20",
    composite3d: "bg-teal-500/8 border-teal-500/20",
    alternate:   "bg-purple-500/8 border-purple-500/20",
  };

  const hasAlt = el.type === "simple" || el.type === "composite" || el.type === "composite3d";
  const isAlt  = hasAlt && (el as any).alternate === true;

  return (
    <div className={`px-3 py-2 flex items-center justify-between border-b border-border/20 ${TYPE_BG[el.type] ?? ""}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-mono font-bold uppercase ${TYPE_COLOR[el.type] ?? "text-muted-foreground"}`}>{el.type === "composite3d" ? "composite 3D" : el.type}</span>
        {(el.type === "composite" || el.type === "composite3d") && <span className="text-[10px] text-muted-foreground">{el.tiles.length} tiles</span>}
        {el.type === "alternate" && <span className="text-[10px] text-muted-foreground">{el.items.length} items</span>}
        {hasAlt && (
          <button type="button" onClick={onToggleAlternate}
            title={isAlt ? "Remove <alternate> wrapper" : "Wrap in <alternate>"}
            className={["flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors",
              isAlt ? "bg-purple-500/20 border-purple-500/40 text-purple-400 hover:bg-purple-500/30"
                    : "bg-transparent border-border/30 text-muted-foreground/50 hover:border-purple-500/30 hover:text-purple-400/70",
            ].join(" ")}
            data-testid={`button-toggle-alternate-${idx}`}
          >
            <Repeat2 className="w-3 h-3" /> alternate
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove("up")} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove("down")} disabled={idx === total - 1}><ArrowDown className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={onRemove}><Trash2 className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}

// ── Main Doodad Editor ─────────────────────────────────────────────────────────

export function DoodadEditor() {
  const { state, dispatch } = useEditor();
  const activeItem = state.doodads.find((d) => d.id === state.activeItemId);

  if (!activeItem) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a doodad from the sidebar or create a new one.
      </div>
    );
  }

  const updateField    = (field: keyof DoodadItem, value: any) => dispatch({ type: "UPDATE_DOODAD", id: activeItem.id, doodad: { ...activeItem, [field]: value } });
  const updateElements = (elements: DoodadElementType[]) => updateField("elements", elements);

  const addElement = (type: "simple" | "composite" | "composite3d") => {
    const n = [...activeItem.elements];
    if (type === "simple")        n.push({ type: "simple", id: 0, chance: 10 });
    else if (type === "composite") n.push({ type: "composite", chance: 10, tiles: [] });
    else                           n.push({ type: "composite3d", chance: 10, tiles: [{ x: 0, y: 0, z: 0, itemId: 0 }] });
    updateElements(n);
  };

  const removeElement  = (i: number) => updateElements(activeItem.elements.filter((_, idx) => idx !== i));
  const moveElement    = (i: number, dir: "up" | "down") => {
    const el = [...activeItem.elements];
    if (dir === "up"   && i > 0)             [el[i - 1], el[i]] = [el[i], el[i - 1]];
    if (dir === "down" && i < el.length - 1) [el[i + 1], el[i]] = [el[i], el[i + 1]];
    updateElements(el);
  };
  const updateElement  = (i: number, updated: DoodadElementType) => { const el = [...activeItem.elements]; el[i] = updated; updateElements(el); };
  const toggleAlternate = (i: number) => {
    const el = activeItem.elements[i];
    if (el.type === "simple" || el.type === "composite" || el.type === "composite3d")
      updateElement(i, { ...el, alternate: !el.alternate } as DoodadElementType);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="text-2xl font-bold mb-4">Doodad Configuration</h2>
        {!activeItem.name && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Brush name is required.</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-2 md:col-span-2" data-help="Nome do brush — identificador textual usado pelo RME para referenciar este doodad no XML">
            <Label htmlFor="doodad-name">Brush Name *</Label>
            <Input id="doodad-name" value={activeItem.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              className={!activeItem.name ? "border-destructive" : ""}
              data-testid="input-doodad-name" />
          </div>
          <div className="space-y-2" data-help="Server LookID — ID do item usado pelo servidor para identificar a aparência visual deste doodad">
            <Label htmlFor="doodad-lookid">Server LookID</Label>
            <Input id="doodad-lookid" type="number" value={activeItem.serverLookId ?? 0}
              onChange={(e) => updateField("serverLookId", parseInt(e.target.value) || 0)}
              data-testid="input-doodad-lookid" />
          </div>
          <div className="space-y-2" data-help="Thickness — espessura do doodad no formato numerador/denominador (ex: 15/100)">
            <Label htmlFor="doodad-thickness">Thickness</Label>
            <Input id="doodad-thickness" placeholder="e.g. 15/100" value={activeItem.thickness || ""}
              onChange={(e) => updateField("thickness", e.target.value)}
              data-testid="input-doodad-thickness" />
          </div>
          <div className="flex items-center space-x-2" data-help="Draggable — quando ativado, o doodad pode ser arrastado pelo jogador no mapa">
            <Checkbox id="doodad-draggable" checked={activeItem.draggable}
              onCheckedChange={(c) => updateField("draggable", !!c)} />
            <Label htmlFor="doodad-draggable" className="font-normal cursor-pointer">Draggable</Label>
          </div>
          <div className="flex items-center space-x-2" data-help="On Blocking — quando ativado, o doodad bloqueia passagem mesmo estando sobre tiles blocantes">
            <Checkbox id="doodad-onblocking" checked={activeItem.onBlocking}
              onCheckedChange={(c) => updateField("onBlocking", !!c)} />
            <Label htmlFor="doodad-onblocking" className="font-normal cursor-pointer">On Blocking</Label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" data-help="Elements — lista de elementos visuais que compõem este doodad (Simple, Composite ou Composite 3D)">Elements</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-blue-400 border-blue-500/40 hover:bg-blue-500/10"
              onClick={() => addElement("simple")} data-testid="button-add-simple"
              data-help="+ Simple — adiciona um elemento simples com um único tile e chance de aparecimento">+ Simple</Button>
            <Button size="sm" variant="outline" className="text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
              onClick={() => addElement("composite")} data-testid="button-add-composite"
              data-help="+ Composite — adiciona um elemento composto por múltiplos tiles posicionados em grade X/Y">+ Composite</Button>
            <Button size="sm" variant="outline" className="text-teal-400 border-teal-500/40 hover:bg-teal-500/10"
              onClick={() => addElement("composite3d")} data-testid="button-add-composite3d"
              data-help="+ Composite 3D — adiciona um elemento composto em perspectiva isométrica com camadas Z (andares)">+ Composite 3D</Button>
          </div>
        </div>

        <div className="space-y-3">
          {activeItem.elements.map((el, idx) => (
            <div key={idx} className="rounded-lg overflow-hidden border border-border/40" data-testid={`element-${idx}`}>
              <ElementHeader el={el} idx={idx} total={activeItem.elements.length}
                onMove={(dir) => moveElement(idx, dir)}
                onRemove={() => removeElement(idx)}
                onToggleAlternate={() => toggleAlternate(idx)}
              />
              <CardContent className="p-4 bg-card">
                {el.type === "simple" && (
                  <div className="flex gap-4">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Item ID</Label>
                      <Input type="number" value={el.id || ""} className="h-8" onChange={(e) => updateElement(idx, { ...el, id: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs">Chance</Label>
                      <Input type="number" value={el.chance || ""} className="h-8" onChange={(e) => updateElement(idx, { ...el, chance: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                )}
                {el.type === "composite" && (
                  <div className="space-y-4">
                    <div className="w-1/3">
                      <Label className="text-xs">Chance</Label>
                      <Input type="number" value={el.chance || ""} className="h-8 mt-1" onChange={(e) => updateElement(idx, { ...el, chance: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <Label className="text-xs font-bold mb-2 block">Tile Layout (X/Y)</Label>
                      <CompositeTileGrid tiles={el.tiles} onChange={(newTiles) => updateElement(idx, { ...el, tiles: newTiles })} />
                    </div>
                  </div>
                )}
                {el.type === "composite3d" && (
                  <div className="space-y-4">
                    <div className="w-1/3">
                      <Label className="text-xs">Chance</Label>
                      <Input type="number" value={el.chance || ""} className="h-8 mt-1" onChange={(e) => updateElement(idx, { ...el, chance: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <Label className="text-xs font-bold mb-2 block">Tile Layout 3D (X/Y/Z — perspective)</Label>
                      <Composite3DGrid tiles={el.tiles} onChange={(newTiles) => updateElement(idx, { ...el, tiles: newTiles })} />
                    </div>
                  </div>
                )}
                {el.type === "alternate" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs font-bold">Items</Label>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs"
                        onClick={() => updateElement(idx, { ...el, items: [...el.items, { id: 0, chance: 10 }] })}>
                        <Plus className="w-3 h-3 mr-1" /> Add Item
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {el.items.map((item, iIdx) => (
                        <div key={iIdx} className="flex items-end gap-2">
                          <div className="space-y-0.5 flex-1">
                            <Label className="text-[10px] text-muted-foreground">Item ID</Label>
                            <Input type="number" value={item.id || ""} className="h-8"
                              onChange={(e) => { const n = [...el.items]; n[iIdx] = { ...item, id: parseInt(e.target.value) || 0 }; updateElement(idx, { ...el, items: n }); }} />
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <Label className="text-[10px] text-muted-foreground">Chance</Label>
                            <Input type="number" value={item.chance || ""} className="h-8"
                              onChange={(e) => { const n = [...el.items]; n[iIdx] = { ...item, chance: parseInt(e.target.value) || 0 }; updateElement(idx, { ...el, items: n }); }} />
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => updateElement(idx, { ...el, items: el.items.filter((_, i) => i !== iIdx) })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {el.items.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded">No items. Click "Add Item" above.</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          ))}

          {activeItem.elements.length === 0 && (
            <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
              No elements. Use the buttons above to add Simple Items or Composites.
            </p>
          )}
        </div>
      </div>

      <TilesetRegistration brushName={activeItem.name} />
    </div>
  );
}
