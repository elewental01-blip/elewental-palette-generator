import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BookMarked, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface TilesetRegistrationProps {
  brushName: string;
  allBrushNames?: string[];
}

export function TilesetRegistration({ brushName, allBrushNames }: TilesetRegistrationProps) {
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();

  if (!brushName) return null;

  const names = (allBrushNames ?? []).filter((n) => n && n.trim());
  const hasMultiple = names.length > 1;
  const singleTag = `<brush name="${brushName}"/>`;
  const allTags = names.map((n) => `<brush name="${n}"/>`).join("\n");
  const useAllTags = showAll && hasMultiple;
  const displayTag = useAllTags ? allTags : singleTag;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(displayTag);
      toast({
        title: "Copied!",
        description: useAllTags
          ? `${names.length} brush tags copied to clipboard.`
          : "Brush tag copied to clipboard.",
      });
    } catch {
      toast({ title: "Error", description: "Could not copy to clipboard.", variant: "destructive" });
    }
  };

  return (
    <div className="pt-4 border-t border-border/40">
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <BookMarked className="w-3.5 h-3.5" />
        {useAllTags ? "Tileset Tags" : "Tileset Tag"}
      </button>

      {open && (
        <div className="mt-3 pl-1">
          {hasMultiple && (
            <label
              className="flex items-center gap-2 mb-2.5 cursor-pointer select-none w-fit"
              data-help="Show All Brush Tags — lista consolidada com as tags de todos os brushes deste módulo. Atualizada automaticamente ao criar, renomear ou remover brushes. Facilita a cópia em lote para registrar todos os brushes no tileset de uma vez"
            >
              <Checkbox
                checked={showAll}
                onCheckedChange={(c) => setShowAll(!!c)}
                data-testid="checkbox-show-all-tags"
              />
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Show All Brush Tags{" "}
                <span className="text-muted-foreground/50">({names.length})</span>
              </span>
            </label>
          )}
          <p className="text-xs text-muted-foreground mb-2">
            {useAllTags
              ? "All brush tags from this module — paste into your tileset section:"
              : "Quick registration tag — paste into your tileset section:"}
          </p>
          <div className="flex items-start gap-2">
            {useAllTags ? (
              <pre className="flex-1 text-xs font-mono bg-muted/50 border border-border px-2.5 py-1.5 rounded text-foreground/90 select-all whitespace-pre overflow-x-auto max-h-48">
                {displayTag}
              </pre>
            ) : (
              <code className="flex-1 text-xs font-mono bg-muted/50 border border-border px-2.5 py-1.5 rounded text-foreground/90 select-all">
                {displayTag}
              </code>
            )}
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 shrink-0" onClick={copy}>
              <Copy className="w-3 h-3" /> {useAllTags ? "Copy All" : "Copy"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
