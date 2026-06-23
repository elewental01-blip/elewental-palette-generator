import { useState } from "react";
import { useEditor } from "@/lib/context";
import { BorderItem, BorderDirection } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

// ── SVG border direction icons ────────────────────────────────────────────────

function BorderIcon({ dir }: { dir: BorderDirection }) {
  const g = "hsl(215 20% 30%)";
  const a = "hsl(45 90% 55%)";

  const icons: Record<BorderDirection, JSX.Element> = {
    n: (<><rect width="24" height="17" fill={g} /><rect y="17" width="24" height="7" fill={a} /></>),
    s: (<><rect width="24" height="7" fill={a} /><rect y="7" width="24" height="17" fill={g} /></>),
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

// ── Self-contained direction cell ─────────────────────────────────────────────

function DirectionCell({ dir, label, items, onUpdate }: {
  dir: BorderDirection;
  label: string;
  items: number[];
  onUpdate: (ids: number[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const hasItems = items.length > 0;

  const commit = () => {
    const val = parseInt(inputVal);
    if (!isNaN(val) && val > 0) {
      onUpdate([...items, val]);
      setInputVal("");
    }
  };

  return (
    <div
      className={[
        "flex flex-col rounded-lg border overflow-hidden transition-colors",
        hasItems ? "border-primary/50 bg-card" : "border-border/40 bg-card/60",
      ].join(" ")}
      data-testid={`border-cell-${dir}`}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border/30 bg-muted/30">
        <BorderIcon dir={dir} />
        <span className="text-xs font-mono font-bold text-foreground/80 uppercase tracking-wide">
          {label}
        </span>
        {hasItems && (
          <span className="ml-auto text-[10px] text-primary/80 font-mono">×{items.length}</span>
        )}
      </div>

      <div className="px-2 pt-1.5 flex flex-wrap gap-1 min-h-[24px]">
        {items.map((item, idx) => (
          <Badge key={`${dir}-${idx}`} variant="secondary" className="px-1.5 py-0.5 h-5 text-[10px] gap-1">
            {item}
            <button
              type="button"
              onClick={() => onUpdate(items.filter((_, i) => i !== idx))}
              className="hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5 transition-colors"
              data-testid={`button-remove-${dir}-${idx}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </Badge>
        ))}
      </div>

      <form
        className="flex items-center gap-0 px-2 pb-2 pt-1 mt-auto"
        onSubmit={(e) => { e.preventDefault(); commit(); }}
      >
        <Input
          name="val"
          type="number"
          placeholder="ID..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commit}
          className="h-6 text-[11px] px-1.5 rounded-r-none border-r-0 focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
          data-testid={`input-direction-${dir}`}
        />
        <Button type="submit" size="icon" className="h-6 w-6 rounded-l-none shrink-0" data-testid={`button-add-${dir}`}>
          <Plus className="w-3 h-3" />
        </Button>
      </form>
    </div>
  );
}

// ── Main Border Editor ────────────────────────────────────────────────────────

export function BorderEditor() {
  const { state, dispatch } = useEditor();
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

  const updateDirection = (dir: BorderDirection, value: number[]) => {
    dispatch({ type: "UPDATE_BORDER", id: activeItem.id, border: { ...activeItem, items: { ...activeItem.items, [dir]: value } } });
  };

  type CellDef =
    | { type: "dir"; dir: BorderDirection; label: string }
    | { type: "empty" }
    | { type: "ctr" };

  // 5×5 layout — "S" label (top) maps to dir "s", "N" label (bottom) maps to dir "n"
  const layout: CellDef[] = [
    { type: "dir", dir: "cse", label: "CSE" }, { type: "empty" }, { type: "dir", dir: "s", label: "S" },   { type: "empty" }, { type: "dir", dir: "csw", label: "CSW" },
    { type: "dir", dir: "dse", label: "DSE" }, { type: "empty" }, { type: "empty" },                        { type: "empty" }, { type: "dir", dir: "dsw", label: "DSW" },
    { type: "empty" },                          { type: "dir", dir: "e", label: "E" }, { type: "ctr" },      { type: "dir", dir: "w", label: "W" }, { type: "empty" },
    { type: "dir", dir: "dne", label: "DNE" }, { type: "empty" }, { type: "empty" },                        { type: "empty" }, { type: "dir", dir: "dnw", label: "DNW" },
    { type: "dir", dir: "cne", label: "CNE" }, { type: "empty" }, { type: "dir", dir: "n", label: "N" },   { type: "empty" }, { type: "dir", dir: "cnw", label: "CNW" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="text-2xl font-bold mb-4">Border Configuration</h2>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="border-id">Border ID</Label>
            <Input
              id="border-id"
              type="number"
              value={activeItem.borderId ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                updateField("borderId", raw === "" ? undefined : parseInt(raw));
              }}
              placeholder="0"
              data-testid="input-border-id"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="border-group">Group ID (optional)</Label>
            <Input
              id="border-group"
              type="number"
              value={activeItem.group ?? ""}
              onChange={(e) => updateField("group", parseInt(e.target.value) || undefined)}
              data-testid="input-border-group"
            />
          </div>
          <div className="space-y-2">
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
            <h2 className="text-xl font-bold">Direction Grid</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Type an ID and press Enter, click +, or click away to add.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateField("items", { n: [], s: [], e: [], w: [], cnw: [], cne: [], csw: [], cse: [], dnw: [], dne: [], dsw: [], dse: [] })}
            data-testid="button-clear-border-items"
          >
            Clear All
          </Button>
        </div>

        <div className="bg-sidebar rounded-xl border border-sidebar-border p-5">
          <div className="grid grid-cols-5 gap-2 max-w-3xl mx-auto">
            {layout.map((cell, i) => {
              if (cell.type === "empty") return <div key={`e-${i}`} className="pointer-events-none" />;
              if (cell.type === "ctr") return (
                <div key="ctr" className="rounded-lg border border-border/30 bg-muted/20 flex items-center justify-center min-h-[100px]">
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
                  items={activeItem.items[cell.dir] || []}
                  onUpdate={(ids) => updateDirection(cell.dir, ids)}
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
