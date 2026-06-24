import { useState, useRef, useEffect } from "react";
import { useEditor } from "@/lib/context";
import { CarpetItem, CarpetAlignDirection, CarpetAlignData } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TilesetRegistration } from "./TilesetRegistration";

// ── Reuse border SVG icons for all shared directions ─────────────────────────

function CarpetIcon({ dir }: { dir: CarpetAlignDirection }) {
  const g = "hsl(215 20% 30%)";
  const a = "hsl(var(--primary))";

  const icons: Record<CarpetAlignDirection, React.ReactNode> = {
    n:      (<><rect width="24" height="17" fill={g}/><rect y="17" width="24" height="7" fill={a}/></>),
    s:      (<><rect width="24" height="7" fill={a}/><rect y="7" width="24" height="17" fill={g}/></>),
    e:      (<><rect width="17" height="24" fill={g}/><rect x="17" width="7" height="24" fill={a}/></>),
    w:      (<><rect width="7" height="24" fill={a}/><rect x="7" width="17" height="24" fill={g}/></>),
    cnw:    (<><rect width="24" height="24" fill={g}/><rect x="0" y="0" width="9" height="9" fill={a}/></>),
    cne:    (<><rect width="24" height="24" fill={g}/><rect x="15" y="0" width="9" height="9" fill={a}/></>),
    csw:    (<><rect width="24" height="24" fill={g}/><rect x="0" y="15" width="9" height="9" fill={a}/></>),
    cse:    (<><rect width="24" height="24" fill={g}/><rect x="15" y="15" width="9" height="9" fill={a}/></>),
    dnw:    (<><rect width="24" height="24" fill={g}/><polygon points="0,0 0,14 14,0" fill={a}/></>),
    dne:    (<><rect width="24" height="24" fill={g}/><polygon points="24,0 10,0 24,14" fill={a}/></>),
    dsw:    (<><rect width="24" height="24" fill={g}/><polygon points="0,24 14,24 0,10" fill={a}/></>),
    dse:    (<><rect width="24" height="24" fill={g}/><polygon points="24,24 24,10 10,24" fill={a}/></>),
    center: (
      <>
        <rect width="24" height="24" fill={g}/>
        <rect x="6" y="6" width="12" height="12" fill={a}/>
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" width={26} height={26} style={{ display: "block", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
      {icons[dir]}
    </svg>
  );
}

// ── Help descriptions per direction ─────────────────────────────────────────

const CARPET_HELP: Record<CarpetAlignDirection, string> = {
  n:      "Norte — tile para a borda norte do tapete",
  s:      "Sul — tile para a borda sul do tapete",
  e:      "Leste — tile para a borda leste do tapete",
  w:      "Oeste — tile para a borda oeste do tapete",
  cnw:    "Canto interno NW — peça de canto noroeste côncavo do tapete",
  cne:    "Canto interno NE — peça de canto nordeste côncavo do tapete",
  csw:    "Canto interno SW — peça de canto sudoeste côncavo do tapete",
  cse:    "Canto interno SE — peça de canto sudeste côncavo do tapete",
  dnw:    "Diagonal NW — corte diagonal do canto noroeste do tapete",
  dne:    "Diagonal NE — corte diagonal do canto nordeste do tapete",
  dsw:    "Diagonal SW — corte diagonal do canto sudoeste do tapete",
  dse:    "Diagonal SE — corte diagonal do canto sudeste do tapete",
  center: "Centro — tile central do tapete (posição 0,0 do padrão)",
};

// ── Carpet direction cell ────────────────────────────────────────────────────

function CarpetCell({
  dir,
  label,
  data,
  onChange,
}: {
  dir: CarpetAlignDirection;
  label: string;
  data: CarpetAlignData | undefined;
  onChange: (val: CarpetAlignData | undefined) => void;
}) {
  const hasData = !!data;
  const isSingle = data?.type === "single";
  const isMulti  = data?.type === "multi";
  const singleId = isSingle ? (data as { type: "single"; id: number }).id : 0;
  const showBadge = isSingle && singleId > 0;

  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setInputVal(singleId > 0 ? String(singleId) : "");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing]);

  const commitSingle = () => {
    const parsed = parseInt(inputVal);
    if (!isNaN(parsed) && parsed > 0) onChange({ type: "single", id: parsed });
    setEditing(false);
  };

  const deactivate = () => { onChange(undefined); setEditing(false); };
  const setMode = (mode: "single" | "multi") => {
    if (mode === "single") { onChange({ type: "single", id: singleId || 0 }); setEditing(true); }
    else onChange({ type: "multi", items: [] });
  };

  return (
    <div
      className={[
        "flex flex-col rounded-lg border overflow-hidden transition-colors",
        hasData ? "border-primary/50 bg-card" : "border-border/30 bg-card/50",
      ].join(" ")}
      data-help={CARPET_HELP[dir]}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border/20 bg-muted/20">
        <CarpetIcon dir={dir} />
        <span className="text-[11px] font-mono font-bold text-foreground/80 uppercase tracking-wide flex-1">
          {label}
        </span>
        {hasData && (
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => setMode("single")}
              title="Single item (no chance)"
              className={[
                "px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors",
                isSingle ? "bg-primary/20 border-primary/50 text-primary" : "bg-transparent border-border/30 text-muted-foreground hover:border-primary/30",
              ].join(" ")}
            >S</button>
            <button
              type="button"
              onClick={() => setMode("multi")}
              title="Multiple items with chance"
              className={[
                "px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors",
                isMulti ? "bg-primary/20 border-primary/50 text-primary" : "bg-transparent border-border/30 text-muted-foreground hover:border-primary/30",
              ].join(" ")}
            >M</button>
            <button
              type="button"
              onClick={deactivate}
              title="Remove"
              className="px-1 py-0.5 rounded text-[9px] border border-border/30 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      {isMulti ? (
        <div className="px-2 py-1.5 space-y-1">
          {(data as { type: "multi"; items: { id: number; chance: number }[] }).items.map((item, idx) => (
            <div key={idx} className="flex gap-1 items-center">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="ID"
                value={item.id || ""}
                onKeyDown={(e) => { if (!/[\d\b]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => {
                  const items = [...(data as any).items];
                  items[idx] = { ...item, id: parseInt(e.target.value) || 0 };
                  onChange({ type: "multi", items });
                }}
                className="h-5 text-[10px] px-1 w-16 min-w-0"
              />
              <Input
                type="text"
                inputMode="numeric"
                placeholder="%"
                value={item.chance || ""}
                onKeyDown={(e) => { if (!/[\d\b]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault(); }}
                onChange={(e) => {
                  const items = [...(data as any).items];
                  items[idx] = { ...item, chance: parseInt(e.target.value) || 0 };
                  onChange({ type: "multi", items });
                }}
                className="h-5 text-[10px] px-1 w-10 min-w-0"
              />
              <button
                type="button"
                onClick={() => {
                  const items = (data as any).items.filter((_: any, i: number) => i !== idx);
                  onChange({ type: "multi", items });
                }}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const items = [...(data as any).items, { id: 0, chance: 10 }];
              onChange({ type: "multi", items });
            }}
            className="flex items-center gap-0.5 text-[10px] text-primary hover:underline transition-colors mt-0.5"
          >
            <Plus className="w-3 h-3" /> item
          </button>
        </div>
      ) : showBadge && !editing ? (
        /* Value badge — double-click to edit */
        <div className="px-2 py-2">
          <div
            className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded px-2 py-0.5 cursor-pointer group"
            onDoubleClick={() => setEditing(true)}
            title="Double-click to edit"
          >
            <span className="text-xs font-mono font-semibold text-primary">{singleId}</span>
            <button
              type="button"
              onClick={deactivate}
              className="text-primary/60 hover:text-destructive transition-colors rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty or editing: input shown directly — saves on blur */
        <div className="px-2 py-2">
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder="Item ID"
            value={inputVal}
            onKeyDown={(e) => { if (!/[\d\b]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault(); }}
            onChange={(e) => setInputVal(e.target.value)}
            onFocus={() => setEditing(true)}
            onBlur={commitSingle}
            className="h-6 text-[11px] px-1.5"
          />
        </div>
      )}
    </div>
  );
}

// ── Main Carpet Editor ────────────────────────────────────────────────────────

export function CarpetEditor() {
  const { state, dispatch } = useEditor();
  const activeItem = state.carpets.find((c) => c.id === state.activeItemId);

  if (!activeItem) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a carpet brush from the sidebar or create a new one.
      </div>
    );
  }

  const updateField = (field: keyof CarpetItem, value: any) =>
    dispatch({ type: "UPDATE_CARPET", id: activeItem.id, carpet: { ...activeItem, [field]: value } });

  const updateDir = (dir: CarpetAlignDirection, val: CarpetAlignData | undefined) => {
    const carpets = { ...activeItem.carpets };
    if (val === undefined) delete carpets[dir];
    else carpets[dir] = val;
    updateField("carpets", carpets);
  };

  // 5×5 grid — same layout as border editor but center is a real carpet direction
  type CellDef =
    | { type: "dir"; dir: CarpetAlignDirection; label: string }
    | { type: "empty" };

  const layout: CellDef[] = [
    { type: "dir", dir: "cse",    label: "CSE" },    { type: "empty" }, { type: "dir", dir: "s",      label: "S" },      { type: "empty" }, { type: "dir", dir: "csw",    label: "CSW" },
    { type: "dir", dir: "dse",    label: "DSE" },    { type: "empty" }, { type: "empty" },                                { type: "empty" }, { type: "dir", dir: "dsw",    label: "DSW" },
    { type: "empty" },                               { type: "dir", dir: "e",      label: "E" },      { type: "dir", dir: "center", label: "CTR" }, { type: "dir", dir: "w",      label: "W" }, { type: "empty" },
    { type: "dir", dir: "dne",    label: "DNE" },    { type: "empty" }, { type: "empty" },                                { type: "empty" }, { type: "dir", dir: "dnw",    label: "DNW" },
    { type: "dir", dir: "cne",    label: "CNE" },    { type: "empty" }, { type: "dir", dir: "n",      label: "N" },      { type: "empty" }, { type: "dir", dir: "cnw",    label: "CNW" },
  ];

  const activeCount = Object.keys(activeItem.carpets).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
      {/* Meta fields */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Carpet Configuration</h2>

        {!activeItem.name && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Brush name is required.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2 col-span-2" data-help="Brush Name — nome do carpet brush usado pelo RME. Deve ser único no arquivo de paletas">
            <Label htmlFor="carpet-name">Brush Name *</Label>
            <Input
              id="carpet-name"
              value={activeItem.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              className={!activeItem.name ? "border-destructive" : ""}
            />
          </div>
          <div className="space-y-2" data-help="Server LookID — ID do item para identificação visual do tapete pelo servidor">
            <Label htmlFor="carpet-lookid">Server LookID</Label>
            <Input
              id="carpet-lookid"
              type="number"
              value={activeItem.serverLookId || ""}
              onChange={(e) => updateField("serverLookId", parseInt(e.target.value) || undefined)}
            />
          </div>
        </div>
      </div>

      {/* Visual direction grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold" data-help="Direction Grid — grade visual com 13 posições do tapete: centro, bordas cardinais, cantos côncavos e cortes diagonais">Direction Grid</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click "+ add" in any cell to activate it. Toggle <strong>S</strong> (single ID) or <strong>M</strong> (multiple items with chance).
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <span className="text-xs text-muted-foreground">{activeCount} direction{activeCount !== 1 ? "s" : ""} active</span>
            )}
            <Button variant="outline" size="sm" onClick={() => updateField("carpets", {})}
              data-help="Clear All — remove todos os tiles de direção deste tapete, esvaziando o Direction Grid">
              Clear All
            </Button>
          </div>
        </div>

        <div className="bg-sidebar rounded-xl border border-sidebar-border p-5">
          <div className="grid grid-cols-5 gap-3 max-w-3xl mx-auto">
            {layout.map((cell, i) => {
              if (cell.type === "empty") return <div key={`e-${i}`} />;
              return (
                <CarpetCell
                  key={cell.dir}
                  dir={cell.dir}
                  label={cell.label}
                  data={activeItem.carpets[cell.dir]}
                  onChange={(val) => updateDir(cell.dir, val)}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 flex items-center gap-5 justify-center text-[11px] text-muted-foreground">
            <span><strong className="text-foreground/60">S</strong> = single ID</span>
            <span><strong className="text-foreground/60">M</strong> = multiple items with chance</span>
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 14 14" width={14} height={14}><rect width="14" height="14" fill="hsl(215 20% 30%)"/><rect x="3" y="3" width="8" height="8" fill="hsl(var(--primary))"/></svg>
              center
            </div>
          </div>
        </div>
      </div>

      <TilesetRegistration brushName={activeItem.name} allBrushNames={state.carpets.map((c) => c.name)} />
    </div>
  );
}
