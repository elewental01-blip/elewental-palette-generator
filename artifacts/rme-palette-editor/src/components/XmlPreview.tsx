import { useState, useEffect } from "react";
import { useEditor } from "@/lib/context";
import {
  generateBordersXml, generateGroundsXml,
  generateDoodadsXml, generateCarpetsXml, generateWallsXml, generateTilesetsXml,
} from "@/lib/xml-generators";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, CodeXml, ChevronRight, ChevronLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function XmlPreview() {
  const { state } = useEditor();
  const { toast } = useToast();
  const [xmlContent, setXmlContent] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let xml = "";
    if      (state.activeCategory === "borders")  xml = generateBordersXml(state.borders);
    else if (state.activeCategory === "grounds")  xml = generateGroundsXml(state.grounds);
    else if (state.activeCategory === "doodads") {
      const doodadsXml = generateDoodadsXml(state.doodads);
      const carpetsXml = generateCarpetsXml(state.carpets);
      xml = [doodadsXml, carpetsXml].filter(Boolean).join("\n\n");
    }
    else if (state.activeCategory === "walls")    xml = generateWallsXml(state.walls);
    else if (state.activeCategory === "tilesets") xml = generateTilesetsXml(state.tilesets ?? []);
    setXmlContent(xml);
  }, [state]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(xmlContent);
      toast({ title: "Copied to clipboard", description: "The XML output has been copied." });
    } catch {
      toast({ title: "Failed to copy", description: "An error occurred.", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `${state.activeCategory}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: `File saved as ${state.activeCategory}.xml` });
  };

  if (collapsed) {
    return (
      <div className="flex flex-col h-full bg-sidebar border-l border-sidebar-border w-10 shrink-0 items-center py-2 gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setCollapsed(false)} title="Expand XML panel">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy} title="Copy to Clipboard" data-testid="button-copy-xml">
          <Copy className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleDownload} title="Download XML" data-testid="button-download-xml">
          <Download className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-sidebar border-l border-sidebar-border w-96 shrink-0">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <h3 className="font-semibold text-sidebar-foreground flex items-center gap-2">
          <CodeXml className="w-4 h-4 text-primary" />
          XML Output
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy to Clipboard" data-testid="button-copy-xml">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} title="Download XML" data-testid="button-download-xml">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)} title="Collapse XML panel" data-testid="button-collapse-xml">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4 bg-[#0d0f15]">
        <pre className="font-mono text-xs text-blue-300 whitespace-pre-wrap break-all">
          {xmlContent || <span className="text-muted-foreground/40 italic">— empty —</span>}
        </pre>
      </ScrollArea>
    </div>
  );
}
