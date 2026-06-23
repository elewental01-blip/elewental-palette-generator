import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BookMarked, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TilesetRegistrationProps {
  brushName: string;
}

export function TilesetRegistration({ brushName }: TilesetRegistrationProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  if (!brushName) return null;

  const tag = `<brush name="${brushName}"/>`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tag);
      toast({ title: "Copied!", description: "Brush tag copied to clipboard." });
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
        Tileset Tag
      </button>

      {open && (
        <div className="mt-3 pl-1">
          <p className="text-xs text-muted-foreground mb-2">
            Quick registration tag — paste into your tileset section:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-muted/50 border border-border px-2.5 py-1.5 rounded text-foreground/90 select-all">
              {tag}
            </code>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 shrink-0" onClick={copy}>
              <Copy className="w-3 h-3" /> Copy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
