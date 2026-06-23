import { useEditor } from "@/lib/context";
import { WallItem, WallTypeData, WallDoor } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TilesetRegistration } from "./TilesetRegistration";

export function WallEditor() {
  const { state, dispatch } = useEditor();
  const activeItem = state.walls.find((w) => w.id === state.activeItemId);

  if (!activeItem) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a wall from the sidebar or create a new one.
      </div>
    );
  }

  const updateField = (field: keyof WallItem, value: any) => {
    dispatch({
      type: "UPDATE_WALL",
      id: activeItem.id,
      wall: { ...activeItem, [field]: value },
    });
  };

  const ensureWallType = (type: "horizontal" | "vertical" | "corner" | "pole") => {
    if (!activeItem.walls[type]) {
      updateField("walls", { ...activeItem.walls, [type]: { items: [], doors: [] } });
    }
  };

  const updateWallTypeItem = (type: "horizontal" | "vertical" | "corner" | "pole", data: Partial<WallTypeData>) => {
    const current = activeItem.walls[type] || { items: [], doors: [] };
    updateField("walls", { ...activeItem.walls, [type]: { ...current, ...data } });
  };

  const blockNonNumeric = (e: React.KeyboardEvent) => {
    if (!/[\d]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault();
  };

  const renderWallTab = (type: "horizontal" | "vertical" | "corner" | "pole") => {
    const wallData = activeItem.walls[type] || { items: [], doors: [] };
    const hasDoors = type === "horizontal" || type === "vertical";

    return (
      <div className="space-y-6 pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-bold" data-help="Items — tiles que compõem este tipo de muro. Cada item tem ID e chance de aparecimento">Items</Label>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
              updateWallTypeItem(type, { items: [...wallData.items, { id: 0, chance: 1000 }] });
            }} data-help="Add Item — adiciona um tile para este tipo de muro com ID e chance">+ Add Item</Button>
          </div>
          <div className="space-y-2">
            {wallData.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input type="text" inputMode="numeric" placeholder="Item ID"
                  value={item.id || ""} onKeyDown={blockNonNumeric}
                  onChange={(e) => {
                    const newItems = [...wallData.items];
                    newItems[idx] = { ...item, id: parseInt(e.target.value) || 0 };
                    updateWallTypeItem(type, { items: newItems });
                  }} className="h-8" />
                <Input type="text" inputMode="numeric" placeholder="Chance"
                  value={item.chance || ""} onKeyDown={blockNonNumeric}
                  onChange={(e) => {
                    const newItems = [...wallData.items];
                    newItems[idx] = { ...item, chance: parseInt(e.target.value) || 0 };
                    updateWallTypeItem(type, { items: newItems });
                  }} className="h-8" />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                  updateWallTypeItem(type, { items: wallData.items.filter((_, i) => i !== idx) });
                }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            {wallData.items.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No items.</p>}
          </div>
        </div>

        {hasDoors && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-bold" data-help="Doors — portas embutidas neste segmento de muro. Cada porta tem ID, tipo e estado (aberta/fechada)">Doors</Label>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                updateWallTypeItem(type, { doors: [...wallData.doors, { id: 0, type: "normal" }] });
              }} data-help="Add Door — adiciona uma porta a este segmento de muro (normal, trancada, quest, etc.)">+ Add Door</Button>
            </div>
            <div className="space-y-2">
              {wallData.doors.map((door, idx) => (
                <Card key={idx} className="p-2">
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="space-y-1 flex-1 min-w-[100px]">
                      <Label className="text-[10px]">ID</Label>
                      <Input type="text" inputMode="numeric" value={door.id || ""}
                        onKeyDown={blockNonNumeric}
                        onChange={(e) => {
                          const newDoors = [...wallData.doors];
                          newDoors[idx] = { ...door, id: parseInt(e.target.value) || 0 };
                          updateWallTypeItem(type, { doors: newDoors });
                        }} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-[120px]">
                      <Label className="text-[10px]">Type</Label>
                      <Select value={door.type} onValueChange={(val: any) => {
                        const newDoors = [...wallData.doors];
                        newDoors[idx] = { ...door, type: val };
                        updateWallTypeItem(type, { doors: newDoors });
                      }}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="locked">Locked</SelectItem>
                          <SelectItem value="quest">Quest</SelectItem>
                          <SelectItem value="magic">Magic</SelectItem>
                          <SelectItem value="archway">Archway</SelectItem>
                          <SelectItem value="normal_alt">Normal Alt</SelectItem>
                          <SelectItem value="hatch_window">Hatch Window</SelectItem>
                          <SelectItem value="window">Window</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4 px-2 py-1 bg-muted/50 rounded-md">
                      <div className="flex items-center gap-1.5">
                        <Checkbox checked={door.open || false} onCheckedChange={(c) => {
                          const newDoors = [...wallData.doors];
                          newDoors[idx] = { ...door, open: !!c };
                          updateWallTypeItem(type, { doors: newDoors });
                        }} />
                        <Label className="text-[10px] font-normal">Open</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Checkbox checked={door.locked || false} onCheckedChange={(c) => {
                          const newDoors = [...wallData.doors];
                          newDoors[idx] = { ...door, locked: !!c };
                          updateWallTypeItem(type, { doors: newDoors });
                        }} />
                        <Label className="text-[10px] font-normal">Locked</Label>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => {
                      updateWallTypeItem(type, { doors: wallData.doors.filter((_, i) => i !== idx) });
                    }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Card>
              ))}
              {wallData.doors.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No doors.</p>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="text-2xl font-bold mb-4">Wall Configuration</h2>

        {!activeItem.name && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Brush name is required.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-2 md:col-span-2" data-help="Brush Name — nome do wall brush. Deve ser único e é usado para referenciar este muro no XML">
            <Label htmlFor="wall-name">Brush Name *</Label>
            <Input
              id="wall-name"
              value={activeItem.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              className={!activeItem.name ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </div>
          <div className="space-y-2" data-help="Server LookID — ID do item para identificação visual do muro pelo servidor">
            <Label htmlFor="wall-lookid">Server LookID</Label>
            <Input
              id="wall-lookid"
              type="text"
              inputMode="numeric"
              value={activeItem.serverLookId ?? 0}
              onKeyDown={(e) => { if (!/[\d]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab"].includes(e.key)) e.preventDefault(); }}
              onChange={(e) => updateField("serverLookId", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2" data-help="Thickness — espessura do muro no formato numerador/denominador (ex: 100/100)">
            <Label htmlFor="wall-thickness">Thickness</Label>
            <Input
              id="wall-thickness"
              placeholder="e.g. 100/100"
              value={activeItem.thickness || ""}
              onChange={(e) => updateField("thickness", e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2" data-help="Draggable — quando ativado, o muro pode ser arrastado no mapa pelo jogador">
            <Checkbox id="wall-draggable" checked={activeItem.draggable ?? false} onCheckedChange={(c) => updateField("draggable", !!c)} />
            <Label htmlFor="wall-draggable" className="font-normal cursor-pointer">Draggable</Label>
          </div>
          <div className="flex items-center space-x-2" data-help="On Blocking — quando ativado, o muro bloqueia passagem mesmo sobre tiles blocantes">
            <Checkbox id="wall-onblocking" checked={activeItem.onBlocking ?? false} onCheckedChange={(c) => updateField("onBlocking", !!c)} />
            <Label htmlFor="wall-onblocking" className="font-normal cursor-pointer">On Blocking</Label>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden" data-help="Wall Types — configure os tiles para cada orientação do muro: Horizontal, Vertical, Corner (canto) e Pole (pilar)">
        <Tabs defaultValue="horizontal" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-12 p-0 px-2">
            <TabsTrigger value="horizontal" className="data-[state=active]:bg-muted/50 rounded-none h-full px-6" data-help="Horizontal — tiles do muro em orientação horizontal (lado a lado na direção leste-oeste)">Horizontal</TabsTrigger>
            <TabsTrigger value="vertical" className="data-[state=active]:bg-muted/50 rounded-none h-full px-6" data-help="Vertical — tiles do muro em orientação vertical (empilhados na direção norte-sul)">Vertical</TabsTrigger>
            <TabsTrigger value="corner" className="data-[state=active]:bg-muted/50 rounded-none h-full px-6" data-help="Corner — tile de canto onde muros horizontal e vertical se encontram">Corner</TabsTrigger>
            <TabsTrigger value="pole" className="data-[state=active]:bg-muted/50 rounded-none h-full px-6" data-help="Pole — tile de pilar, segmento de muro isolado sem conexões adjacentes">Pole</TabsTrigger>
          </TabsList>
          <div className="p-4 bg-muted/20">
            <TabsContent value="horizontal" className="mt-0">{renderWallTab("horizontal")}</TabsContent>
            <TabsContent value="vertical" className="mt-0">{renderWallTab("vertical")}</TabsContent>
            <TabsContent value="corner" className="mt-0">{renderWallTab("corner")}</TabsContent>
            <TabsContent value="pole" className="mt-0">{renderWallTab("pole")}</TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Friends (Optional)</h3>

          <Button size="sm" variant="outline" onClick={() => {
            updateField("friends", [...(activeItem.friends || []), { name: "" }]);
          }}>+ Add Friend</Button>
        </div>
        
        <div className="space-y-2">
          {activeItem.friends?.map((friend, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input placeholder="Friend brush name..." value={friend.name} onChange={(e) => {
                const newFriends = [...activeItem.friends!];
                newFriends[idx] = { ...friend, name: e.target.value };
                updateField("friends", newFriends);
              }} />
              <div className="flex items-center gap-2 shrink-0 bg-muted/50 px-3 h-10 rounded-md">
                <Checkbox id={`redirect-${idx}`} checked={friend.redirect || false} onCheckedChange={(c) => {
                  const newFriends = [...activeItem.friends!];
                  newFriends[idx] = { ...friend, redirect: !!c };
                  updateField("friends", newFriends);
                }} />
                <Label htmlFor={`redirect-${idx}`} className="font-normal text-xs">Redirect</Label>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => {
                updateField("friends", activeItem.friends!.filter((_, i) => i !== idx));
              }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          {(!activeItem.friends || activeItem.friends.length === 0) && <p className="text-sm text-muted-foreground py-2">No friends added.</p>}
        </div>
      </div>

      <TilesetRegistration brushName={activeItem.name || ""} />
    </div>
  );
}
