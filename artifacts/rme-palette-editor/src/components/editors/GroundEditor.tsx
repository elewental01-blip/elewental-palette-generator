import { useEditor } from "@/lib/context";
import { GroundItem } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TilesetRegistration } from "./TilesetRegistration";

export function GroundEditor() {
  const { state, dispatch } = useEditor();
  const activeItem = state.grounds.find((g) => g.id === state.activeItemId);

  if (!activeItem) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select a ground brush from the sidebar or create a new one.
      </div>
    );
  }

  const updateField = (field: keyof GroundItem, value: any) => {
    dispatch({ type: "UPDATE_GROUND", id: activeItem.id, ground: { ...activeItem, [field]: value } });
  };

  const addItem    = () => updateField("items", [...activeItem.items, { id: 0, chance: 10 }]);
  const removeItem = (i: number) => updateField("items", activeItem.items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: number) => {
    const n = [...activeItem.items]; n[i] = { ...n[i], [field]: value }; updateField("items", n);
  };

  const addBorder    = () => updateField("borders", [...activeItem.borders, { align: "outer" as const, id: 0 }]);
  const removeBorder = (i: number) => updateField("borders", activeItem.borders.filter((_, idx) => idx !== i));
  const updateBorder = (i: number, field: string, value: any) => {
    const n = [...activeItem.borders]; n[i] = { ...n[i], [field]: value }; updateField("borders", n);
  };

  const addFriend    = () => updateField("friends", [...activeItem.friends, ""]);
  const removeFriend = (i: number) => updateField("friends", activeItem.friends.filter((_, idx) => idx !== i));
  const updateFriend = (i: number, value: string) => {
    const n = [...activeItem.friends]; n[i] = value; updateField("friends", n);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
      <div>
        <h2 className="text-2xl font-bold mb-4">Ground Configuration</h2>

        {!activeItem.name && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Brush name is required.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="ground-name">Brush Name *</Label>
            <Input
              id="ground-name"
              value={activeItem.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              className={!activeItem.name ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground-lookid">Server LookID</Label>
            <Input
              id="ground-lookid"
              type="number"
              placeholder="0"
              value={activeItem.serverLookId !== undefined ? activeItem.serverLookId : ""}
              onChange={(e) => updateField("serverLookId", e.target.value === "" ? undefined : parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ground-zorder">Z-Order</Label>
            <Input
              id="ground-zorder"
              type="number"
              placeholder="(omitted if empty)"
              value={activeItem.zOrder !== undefined ? activeItem.zOrder : ""}
              onChange={(e) => updateField("zOrder", e.target.value === "" ? undefined : parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Items</h3>
            <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-4 h-4 mr-1"/> Add Item</Button>
          </div>
          <div className="space-y-2">
            {activeItem.items.map((item, idx) => (
              <Card key={idx} className="p-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">ID</Label>
                    <Input type="number" value={item.id || ""} onChange={(e) => updateItem(idx, "id", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Chance</Label>
                    <Input type="number" value={item.chance || ""} onChange={(e) => updateItem(idx, "chance", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                  </div>
                  <Button variant="ghost" size="icon" className="mt-5 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeItem(idx)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {activeItem.items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No items added.</p>}
          </div>
        </div>

        {/* Friends */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Friends</h3>
            <Button size="sm" variant="outline" onClick={addFriend}><Plus className="w-4 h-4 mr-1"/> Add Friend</Button>
          </div>
          <div className="space-y-2">
            {activeItem.friends.map((friend, idx) => (
              <Card key={idx} className="p-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input placeholder="Friend brush name…" value={friend} onChange={(e) => updateFriend(idx, e.target.value)} className="h-8 text-sm" />
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeFriend(idx)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {activeItem.friends.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No friends added.</p>}
          </div>
        </div>

        {/* Borders */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Borders</h3>
            <Button size="sm" variant="outline" onClick={addBorder}><Plus className="w-4 h-4 mr-1"/> Add Border</Button>
          </div>
          <div className="space-y-2">
            {activeItem.borders.map((border, idx) => (
              <Card key={idx} className="p-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="space-y-1 w-28">
                    <Label className="text-xs">Align</Label>
                    <Select value={border.align} onValueChange={(val) => updateBorder(idx, "align", val)}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="outer">outer</SelectItem>
                        <SelectItem value="inner">inner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 flex-1 min-w-[110px]">
                    <Label className="text-xs">to <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      placeholder="none, 235, brushname…"
                      value={border.to ?? ""}
                      onChange={(e) => updateBorder(idx, "to", e.target.value || undefined)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1 w-28">
                    <Label className="text-xs">ID</Label>
                    <Input type="number" value={border.id || ""} onChange={(e) => updateBorder(idx, "id", parseInt(e.target.value) || 0)} className="h-8 text-sm" />
                  </div>
                  <Button variant="ghost" size="icon" className="mt-5 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeBorder(idx)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {activeItem.borders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No borders added.</p>}
          </div>
        </div>
      </div>

      <TilesetRegistration brushName={activeItem.name} />
    </div>
  );
}
