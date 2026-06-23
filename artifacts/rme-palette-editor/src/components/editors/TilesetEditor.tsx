import { useEditor } from "@/lib/context";
import { TilesetItem, TilesetSection, TilesetSectionType, TilesetEntry } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, AlertCircle, Copy } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { generateTilesetEntriesXml } from "@/lib/xml-generators";

const SECTION_COLORS: Record<TilesetSectionType, string> = {
  terrain: "text-emerald-400 border-emerald-500/30 bg-emerald-500/8",
  doodad:  "text-amber-400  border-amber-500/30  bg-amber-500/8",
  raw:     "text-slate-400  border-slate-500/30   bg-slate-500/8",
};

export function TilesetEditor() {
  const { state, dispatch } = useEditor();
  const { toast } = useToast();
  const activeItem = state.tilesets.find((t) => t.id === state.activeItemId);

  if (!activeItem) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a tileset from the sidebar or create a new one.
      </div>
    );
  }

  const update = (tileset: TilesetItem) =>
    dispatch({ type: "UPDATE_TILESET", id: activeItem.id, tileset });

  const updateField = (field: keyof TilesetItem, value: any) =>
    update({ ...activeItem, [field]: value });

  const addSection = (type: TilesetSectionType) => {
    update({ ...activeItem, sections: [...activeItem.sections, { type, entries: [] }] });
  };

  const removeSection = (si: number) => {
    update({ ...activeItem, sections: activeItem.sections.filter((_, i) => i !== si) });
  };

  const updateSection = (si: number, section: TilesetSection) => {
    const sections = [...activeItem.sections];
    sections[si] = section;
    update({ ...activeItem, sections });
  };

  const addEntry = (si: number, entry: TilesetEntry) => {
    const section = activeItem.sections[si];
    updateSection(si, { ...section, entries: [...section.entries, entry] });
  };

  const removeEntry = (si: number, ei: number) => {
    const section = activeItem.sections[si];
    updateSection(si, { ...section, entries: section.entries.filter((_, i) => i !== ei) });
  };

  const updateEntry = (si: number, ei: number, entry: TilesetEntry) => {
    const section = activeItem.sections[si];
    const entries = [...section.entries];
    entries[ei] = entry;
    updateSection(si, { ...section, entries });
  };

  const copyXml = async () => {
    const xml = generateTilesetEntriesXml(activeItem);
    try {
      await navigator.clipboard.writeText(xml);
      toast({ title: "Copied!", description: "Entry tags copied to clipboard." });
    } catch {
      toast({ title: "Error", description: "Could not copy to clipboard.", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="text-2xl font-bold mb-4">Tileset Configuration</h2>

        {!activeItem.name && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Tileset name is required.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2 max-w-xs">
          <Label htmlFor="tileset-name">Tileset Name *</Label>
          <Input
            id="tileset-name"
            value={activeItem.name || ""}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Grounds"
            className={!activeItem.name ? "border-destructive" : ""}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Sections</h3>
          <div className="flex gap-2">
            {(["terrain", "doodad", "raw"] as TilesetSectionType[]).map((type) => (
              <Button
                key={type}
                size="sm"
                variant="outline"
                className={`capitalize ${SECTION_COLORS[type]}`}
                onClick={() => addSection(type)}
              >
                + {type}
              </Button>
            ))}
          </div>
        </div>

        {activeItem.sections.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
            No sections yet. Add a terrain, doodad, or raw section above.
          </p>
        )}

        <div className="space-y-4">
          {activeItem.sections.map((section, si) => (
            <div key={si} className={`rounded-lg border overflow-hidden ${SECTION_COLORS[section.type].split(" ").slice(2).join(" ")}`}>
              {/* Section header */}
              <div className={`px-3 py-2 flex items-center justify-between border-b border-border/20 ${SECTION_COLORS[section.type]}`}>
                <span className="text-sm font-mono font-bold uppercase">{section.type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{section.entries.length} entries</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    onClick={() => removeSection(si)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Entries */}
              <div className="p-3 bg-card space-y-2">
                {section.entries.map((entry, ei) => (
                  <div key={ei} className="flex items-center gap-2">
                    {/* Kind selector */}
                    <Select
                      value={entry.kind}
                      onValueChange={(val) => {
                        if (val === "brush")  updateEntry(si, ei, { kind: "brush", name: "" });
                        if (val === "item")   updateEntry(si, ei, { kind: "item",  id: 0 });
                        if (val === "range")  updateEntry(si, ei, { kind: "range", fromid: 0, toid: 0 });
                      }}
                    >
                      <SelectTrigger className="h-8 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brush">brush</SelectItem>
                        <SelectItem value="item">item</SelectItem>
                        <SelectItem value="range">range</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Value fields */}
                    {entry.kind === "brush" && (
                      <Input
                        className="h-8 text-sm flex-1"
                        placeholder="Brush name..."
                        value={entry.name}
                        onChange={(e) => updateEntry(si, ei, { kind: "brush", name: e.target.value })}
                      />
                    )}
                    {entry.kind === "item" && (
                      <Input
                        className="h-8 text-sm flex-1"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="id"
                        value={entry.id || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          updateEntry(si, ei, { kind: "item", id: parseInt(val) || 0 });
                        }}
                      />
                    )}
                    {entry.kind === "range" && (
                      <>
                        <Input
                          className="h-8 text-sm flex-1"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="fromid"
                          value={entry.fromid || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            updateEntry(si, ei, { kind: "range", fromid: parseInt(val) || 0, toid: entry.toid });
                          }}
                        />
                        <span className="text-muted-foreground text-xs shrink-0">→</span>
                        <Input
                          className="h-8 text-sm flex-1"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="toid"
                          value={entry.toid || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            updateEntry(si, ei, { kind: "range", fromid: entry.fromid, toid: parseInt(val) || 0 });
                          }}
                        />
                      </>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removeEntry(si, ei)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {/* Add entry row */}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => addEntry(si, { kind: "brush", name: "" })}>
                    <Plus className="w-3 h-3 mr-1" /> brush
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => addEntry(si, { kind: "item", id: 0 })}>
                    <Plus className="w-3 h-3 mr-1" /> item
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => addEntry(si, { kind: "range", fromid: 0, toid: 0 })}>
                    <Plus className="w-3 h-3 mr-1" /> range
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
