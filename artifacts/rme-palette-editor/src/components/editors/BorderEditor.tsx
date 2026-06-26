import { useState, useRef, useEffect } from "react";
import { useEditor } from "@/lib/context";
import { BorderItem, BorderDirection } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

// ── SVG border direction icons ────────────────────────────────────────────────

function BorderIcon({ dir }: { dir: BorderDirection }) {
  const g = "hsl(215 20% 30%)";
  const a = "hsl(var(--primary))";
  const icons: Record<BorderDirection, React.ReactNode> = {
    n: (<><rect width="24" height="7" fill={a} /><rect y="7" width="24" height="17" fill={g} /></>),
    s: (<><rect width="24" height="17" fill={g} /><rect y="17" width="24" height="7" fill={a} /></>),
    e: (<><rect width="17" height="24" fill={g} /><rect x="17" width="7" height="24" fill={a} /></>),
    w: (<><rect width="7" height="24" fill={a} /><rect x="7" width="17" height="24" fill={g} /></>),
    cnw: (<><rect width="24" height="24" fill={g} /><rect x="0" y="0" width="9" height="9" fill={a} /></>),
    cne: (<><rect width="24" height="24" fill={g} /><rect x="15" y="0" width="9" height="9" fill={a} /></>),
    csw: (<><rect width="24" height="24" fill={g} /><rect x="0" y="15" width="9" height="9" fill={a} /></>),
    cse: (<><rect width="24" height="24" fill={g} /><rect x="15" y="15" width="9" height="9" fill={a} /></>),
    dnw: (<><rect width="24" height="24" fill={g} /><polygon points="0,0 0,14 14,0" fill={a} /></>),
    dne: (<><rect width="24" height="24" fill={g} /><polygon points="24,0 10,0 24,14" fill={a} /></>),
    dsw: (<><rect width="24" height="24" fill={g} /><polygon points="0,24 14,24 0,10" fill={a} /></>),
    dse: (<><rect width="24" height="24" fill={g} /><polygon points="24,24 24,10 10,24" fill={a} /></>),
  };
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} style={{ display: "block", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
      {icons[dir]}
    </svg>
  );
}

// ── Single-ID direction cell ──────────────────────────────────────────────────

const BORDER_HELP: Record<BorderDirection, string> = {
  n:   "North — border tile for the northern edge of the terrain",
  s:   "South — border tile for the southern edge of the terrain",
  e:   "East — border tile for the eastern edge of the terrain",
  w:   "West — border tile for the western edge of the terrain",
  cnw: "Inner corner NW — inner north-west corner piece",
  cne: "Inner corner NE — inner north-east corner piece",
  csw: "Inner corner SW — inner south-west corner piece",
  cse: "Inner corner SE — inner south-east corner piece",
  dnw: "Diagonal NW — diagonal cut for the north-west corner",
  dne: "Diagonal NE — diagonal cut for the north-east corner",
  dsw: "Diagonal SW — diagonal cut for the south-west corner",
  dse: "Diagonal SE — diagonal cut for the south-east corner",
};

function DirectionCell({ dir, label, value, onUpdate }: {
  dir: BorderDirection;
  label: string;
  value: number | null;
  onUpdate: (val: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = value !== null;

  useEffect(() => {
    if (editing) {
      setInputVal(value !== null ? String(value) : "");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing]);

  const commit = () => {
    const parsed = parseInt(inputVal);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdate(parsed);
    } else if (inputVal === "" && hasValue) {
      // blurred with empty → keep existing value
    }
    setEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputVal);
    if (!isNaN(parsed) && parsed > 0) onUpdate(parsed);
    setEditing(false);
  };

  return (
    <div
      className={[
        "flex flex-col rounded-lg border overflow-hidden transition-colors min-h-[90px]",
        hasValue ? "border-primary/50 bg-card" : "border-border/40 bg-card/60",
      ].join(" ")}
      data-testid={`border-cell-${dir}`}
      data-help={BORDER_HELP[dir]}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border/30 bg-muted/30">
        <BorderIcon dir={dir} />
        <span className="text-xs font-mono font-bold text-foreground/80 uppercase tracking-wide">{label}</span>
      </div>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center px-2 py-1.5">
        {hasValue && !editing ? (
          /* Show badge — double-click to edit */
          <div
            className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded px-2 py-0.5 cursor-pointer group"
            onDoubleClick={() => setEditing(true)}
            title="Double-click to edit"
            data-testid={`border-cell-badge-${dir}`}
          >
            <span className="text-xs font-mono font-semibold text-primary">{value}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUpdate(null); }}
              className="text-primary/60 hover:text-destructive transition-colors rounded-full"
              data-testid={`button-remove-${dir}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : editing || !hasValue ? (
          /* Input form */
          <form className="flex items-center gap-0 w-full" onSubmit={handleSubmit}>
            <Input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              placeholder="ID..."
              value={inputVal}
              onKeyDown={(e) => {
                if (!/^\d$/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Enter"].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ""))}
              onBlur={commit}
              className="h-6 text-[11px] px-1.5 rounded-r-none border-r-0 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
              data-testid={`input-direction-${dir}`}
            />
            <Button
              type="submit"
              size="icon"
              className="h-6 w-6 rounded-l-none shrink-0"
              data-testid={`button-add-${dir}`}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

// ── Main Border Editor ────────────────────────────────────────────────────────

export function BorderEditor() {
  const { state, dispatch, emptyBorderItems } = useEditor();
  const activeItem = state.borders.find((b) => b.id === state.activeItemId);

  if (!activeItem) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a border from the sidebar or create a new one.
      </div>
    );
  }

  const updateField = (field: keyof BorderItem, value: any) => {
    dispatch({ type: "UPDATE_BORDER", id: activeItem.id, border: { ...activeItem, [field]: value } });
  };

  const updateDirection = (dir: BorderDirection, val: number | null) => {
    dispatch({ type: "UPDATE_BORDER", id: activeItem.id, border: { ...activeItem, items: { ...activeItem.items, [dir]: val } } });
  };

  type CellDef = { type: "dir"; dir: BorderDirection; label: string } | { type: "empty" } | { type: "ctr" };

  const layout: CellDef[] = [
    { type: "dir", dir: "cse", label: "CSE" }, { type: "empty" }, { type: "dir", dir: "s", label: "S" },  { type: "empty" }, { type: "dir", dir: "csw", label: "CSW" },
    { type: "dir", dir: "dse", label: "DSE" }, { type: "empty" }, { type: "empty" },                       { type: "empty" }, { type: "dir", dir: "dsw", label: "DSW" },
    { type: "empty" },                          { type: "dir", dir: "e", label: "E" }, { type: "ctr" },     { type: "dir", dir: "w", label: "W" }, { type: "empty" },
    { type: "dir", dir: "dne", label: "DNE" }, { type: "empty" }, { type: "empty" },                       { type: "empty" }, { type: "dir", dir: "dnw", label: "DNW" },
    { type: "dir", dir: "cne", label: "CNE" }, { type: "empty" }, { type: "dir", dir: "n", label: "N" },  { type: "empty" }, { type: "dir", dir: "cnw", label: "CNW" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="text-2xl font-bold mb-4" data-help="Border Configuration — configure o ID, grupo e as 12 direções de borda do terrain brush">Border Configuration</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2" data-help="Border ID — identificador numérico único desta borda no arquivo XML de paletas do RME">
            <Label htmlFor="border-id">Border ID</Label>
            <Input
              id="border-id"
              type="number"
              value={activeItem.borderId ?? ""}
              onChange={(e) => updateField("borderId", e.target.value === "" ? undefined : parseInt(e.target.value))}
              placeholder="0"
              data-testid="input-border-id"
            />
          </div>
          <div className="space-y-2" data-help="Group ID — agrupa múltiplas bordas para compartilhar transições. Opcional — deixe vazio se não usar grupos">
            <Label htmlFor="border-group">Group ID (optional)</Label>
            <Input
              id="border-group"
              type="number"
              value={activeItem.group ?? ""}
              onChange={(e) => updateField("group", e.target.value === "" ? undefined : parseInt(e.target.value))}
              data-testid="input-border-group"
            />
          </div>
          <div className="space-y-2" data-help="Comment — comentário interno incluído no XML como atributo. Útil para documentar o nome do terrain">
            <Label htmlFor="border-comment">Comment (optional)</Label>
            <Input
              id="border-comment"
              value={activeItem.comment || ""}
              onChange={(e) => updateField("comment", e.target.value)}
              data-testid="input-border-comment"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold" data-help="Direction Grid — grade com as 12 posições de borda (N, S, E, W, cantos côncavos C e diagonais D)">Direction Grid</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Type an ID and press Enter, click +, or click away to add. Double-click a badge to edit.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateField("items", emptyBorderItems)}
            data-testid="button-clear-border-items"
            data-help="Clear All — remove todos os IDs de direção desta borda, esvaziando o Direction Grid"
          >
            Clear All
          </Button>
        </div>

        <div className="bg-sidebar rounded-xl border border-sidebar-border p-5">
          <div className="grid grid-cols-5 gap-2 max-w-3xl mx-auto">
            {layout.map((cell, i) => {
              if (cell.type === "empty") return <div key={`e-${i}`} className="pointer-events-none" />;
              if (cell.type === "ctr") return (
                <div key="ctr" className="rounded-lg border border-border/30 bg-muted/20 flex items-center justify-center min-h-[90px]">
                  <svg viewBox="0 0 32 32" width={36} height={36} style={{ borderRadius: 4, overflow: "hidden" }}>
                    <rect width="32" height="32" fill="hsl(215 20% 30%)" />
                    <line x1="0" y1="16" x2="32" y2="16" stroke="hsl(215 20% 40%)" strokeWidth="0.5" />
                    <line x1="16" y1="0" x2="16" y2="32" stroke="hsl(215 20% 40%)" strokeWidth="0.5" />
                  </svg>
                </div>
              );
              return (
                <DirectionCell
                  key={cell.dir}
                  dir={cell.dir}
                  label={cell.label}
                  value={activeItem.items[cell.dir] ?? null}
                  onUpdate={(val) => updateDirection(cell.dir, val)}
                />
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-6 justify-center text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 14 14" width={14} height={14}><rect width="14" height="10" fill="hsl(215 20% 30%)" /><rect y="10" width="14" height="4" fill="hsl(45 90% 55%)" /></svg>
              Edge (N/S/E/W)
            </div>
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 14 14" width={14} height={14}><rect width="14" height="14" fill="hsl(215 20% 30%)" /><rect width="5" height="5" fill="hsl(45 90% 55%)" /></svg>
              Concave corner (C)
            </div>
            <div className="flex items-center gap-1.5">
              <svg viewBox="0 0 14 14" width={14} height={14}><rect width="14" height="14" fill="hsl(215 20% 30%)" /><polygon points="0,0 8,0 0,8" fill="hsl(45 90% 55%)" /></svg>
              Diagonal corner (D)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
