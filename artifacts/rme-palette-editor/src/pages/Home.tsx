import React, { useState, useEffect, useRef } from "react";
import { useEditor } from "@/lib/context";
import { Category } from "@/lib/context";
import { BorderEditor } from "@/components/editors/BorderEditor";
import { GroundEditor } from "@/components/editors/GroundEditor";
import { DoodadEditor } from "@/components/editors/DoodadEditor";
import { CarpetEditor } from "@/components/editors/CarpetEditor";
import { WallEditor } from "@/components/editors/WallEditor";
import { TilesetEditor } from "@/components/editors/TilesetEditor";
import { XmlPreview } from "@/components/XmlPreview";
import {
  Layers, Image as ImageIcon, Box, BrickWall, Database, Home as HomeIcon,
  Plus, Trash2, ChevronLeft, ChevronRight, Moon, Sun, Sparkles, Settings2,
  ChevronUp, ChevronDown, Edit3, Eye, FileText, Lock, LogOut, Search, RotateCcw, Info,
  TreePine, Footprints, Signpost, Map as MapIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { clearAllAppData, STORAGE_KEYS } from "@/lib/storage";

// ── Auth ────────────────────────────────────────────────────────────────────────
const ADMIN_USER = "admin";
const ADMIN_PASS = "epe";

function loadAuth(): boolean {
  try { return sessionStorage.getItem("epe-auth") === "1"; } catch { return false; }
}
function saveAuth(v: boolean) {
  try { if (v) sessionStorage.setItem("epe-auth", "1"); else sessionStorage.removeItem("epe-auth"); } catch {}
}

// ── Blog post type ─────────────────────────────────────────────────────────────
interface BlogPost {
  id: string;
  title: string;
  order: number;
  html: string;
}

const TUTORIAL_POST_ID = "epe-tutorial-default";

const DEFAULT_POSTS: BlogPost[] = [
  {
    id: TUTORIAL_POST_ID,
    title: "Guia Completo — EPE",
    order: 0,
    html: `<h2 style="font-size:1.5rem;font-weight:700;margin-bottom:0.75rem">Guia Completo — Elewental Palette Editor</h2>

<h3 style="font-size:1.15rem;font-weight:700;margin:0.75rem 0 0.5rem;border-bottom:1px solid rgba(128,128,128,0.25);padding-bottom:0.35rem">🗺 Sobre o EPE</h3>
<p style="margin-bottom:0.75rem">O <strong>Elewental Palette Editor (EPE)</strong> é uma ferramenta visual de criação e edição de assets para mapas do <strong>Remere's Map Editor (RME)</strong> — o editor de mapas open-source mais utilizado para jogos baseados no protocolo OpenTibia.</p>
<p style="margin-bottom:0.75rem">O EPE foi criado para simplificar e acelerar o processo de configuração de paletas XML, eliminando a necessidade de editar arquivos de texto manualmente. Com uma interface visual e interativa, você monta estruturas complexas de brushes com validação em tempo real e exporta o XML pronto para uso no RME.</p>
<p style="margin-bottom:0.75rem">Compatível com o <strong>RME v3.7 oficial</strong> e potencialmente com forks não oficiais que adotem o mesmo formato de paleta XML. Funciona inteiramente no navegador, sem necessidade de instalação.</p>
<p style="margin-bottom:0">Repositório oficial do RME: <a href="https://github.com/hampusborgos/rme" style="color:hsl(var(--primary));text-decoration:underline;word-break:break-all">https://github.com/hampusborgos/rme</a></p>

<h3 style="font-size:1.15rem;font-weight:700;margin:1.25rem 0 0.5rem;border-bottom:1px solid rgba(128,128,128,0.25);padding-bottom:0.35rem">🗃 Tilesets</h3>
<p style="margin-bottom:0.5rem">Agrupa brushes em seções para exibição na paleta do RME.</p>
<ul style="list-style:disc;padding-left:1.5rem;display:flex;flex-direction:column;gap:0.25rem;margin-bottom:0.75rem">
  <li><strong>Nome do Tileset</strong> — obrigatório; define o nome exibido na paleta do RME.</li>
  <li><strong>+ Terrain</strong> — adiciona seção de terrain brushes (grounds e borders).</li>
  <li><strong>+ Doodad</strong> — adiciona seção de doodad brushes (objetos decorativos).</li>
  <li><strong>+ Raw</strong> — adiciona seção raw com IDs diretos e ranges de itens.</li>
  <li>Dentro de cada seção, adicione entradas do tipo <em>brush</em> (por nome), <em>item</em> (por ID) ou <em>range</em> (faixa de IDs contínuos).</li>
</ul>

<h3 style="font-size:1.15rem;font-weight:700;margin:1.25rem 0 0.5rem;border-bottom:1px solid rgba(128,128,128,0.25);padding-bottom:0.35rem">🌿 Grounds</h3>
<p style="margin-bottom:0.5rem">Configure brushes de ground com itens, bordas e friends.</p>
<ul style="list-style:disc;padding-left:1.5rem;display:flex;flex-direction:column;gap:0.25rem;margin-bottom:0.75rem">
  <li><strong>Nome</strong> — nome do brush de ground (referenciado em tilesets e borders).</li>
  <li><strong>Z-order</strong> — ordem de sobreposição no mapa.</li>
  <li><strong>Itens</strong> — lista de IDs de tiles que compõem o ground, com chance de aparição (0–100).</li>
  <li><strong>Border</strong> — nome do brush de borda associado a este ground.</li>
  <li><strong>Friends</strong> — brushes amigos (sem borda gerada entre eles no mapa).</li>
</ul>

<h3 style="font-size:1.15rem;font-weight:700;margin:1.25rem 0 0.5rem;border-bottom:1px solid rgba(128,128,128,0.25);padding-bottom:0.35rem">🔲 Borders</h3>
<p style="margin-bottom:0.5rem">Define IDs de tiles por direção usando o Direction Grid visual.</p>
<ul style="list-style:disc;padding-left:1.5rem;display:flex;flex-direction:column;gap:0.25rem;margin-bottom:0.75rem">
  <li><strong>Direction Grid</strong> — clique em qualquer célula (N, S, E, W, cantos, diagonais) e insira o ID do tile de borda correspondente.</li>
  <li>Direções: <em>N, S, E, W</em> (lados) · <em>CNW, CNE, CSW, CSE</em> (cantos internos) · <em>DNW, DNE, DSW, DSE</em> (diagonais).</li>
  <li>Clique duplo sobre um badge para editar o valor. Clique no ✕ para remover a direção.</li>
  <li>As cores dos ícones de direção seguem o Color Theme selecionado.</li>
</ul>

<h3 style="font-size:1.15rem;font-weight:700;margin:1.25rem 0 0.5rem;border-bottom:1px solid rgba(128,128,128,0.25);padding-bottom:0.35rem">🧩 Doodads</h3>
<p style="margin-bottom:0.5rem">Crie brushes de doodad em três modos:</p>
<ul style="list-style:disc;padding-left:1.5rem;display:flex;flex-direction:column;gap:0.25rem;margin-bottom:0.75rem">
  <li><strong>+ Simple</strong> — um único tile com ID e chance. Ideal para objetos 1×1.</li>
  <li><strong>+ Composite</strong> — grade de tiles 2D configurável. Clique em cada célula para definir o ID. A célula de origem (0,0) é destacada pela cor do tema.</li>
  <li><strong>+ Composite 3D</strong> — grade com múltiplos andares Z (−4 a +4). Use os botões ↑↓ ou os chips Z para navegar entre camadas. Ideal para objetos verticais e estruturas com altura.</li>
</ul>

<h3 style="font-size:1.15rem;font-weight:700;margin:1.25rem 0 0.5rem;border-bottom:1px solid rgba(128,128,128,0.25);padding-bottom:0.35rem">🧱 Walls</h3>
<p style="margin-bottom:0.5rem">Configure brushes de parede com tipos e portas.</p>
<ul style="list-style:disc;padding-left:1.5rem;display:flex;flex-direction:column;gap:0.25rem;margin-bottom:0.75rem">
  <li>Tipos disponíveis: <em>Horizontal</em>, <em>Vertical</em>, <em>Corner</em> e <em>Pole</em>.</li>
  <li>Cada tipo expõe: <strong>ID</strong> (look ID), <strong>Server Look ID</strong> e <strong>Draggable</strong>.</li>
  <li><em>Horizontal</em> e <em>Vertical</em> aceitam portas (door) com seus próprios IDs e Server Look IDs.</li>
  <li>O atributo <code>server_lookid</code> é sempre incluído no XML, mesmo com valor 0.</li>
  <li><em>Corner</em> e <em>Pole</em> não possuem portas (conforme especificação RME).</li>
</ul>

<h3 style="font-size:1.15rem;font-weight:700;margin:1.25rem 0 0.5rem;border-bottom:1px solid rgba(128,128,128,0.25);padding-bottom:0.35rem">🟫 Carpets</h3>
<p style="margin-bottom:0.5rem">Configure brushes de carpet com modo single ou multi-tile.</p>
<ul style="list-style:disc;padding-left:1.5rem;display:flex;flex-direction:column;gap:0.25rem;margin-bottom:0.75rem">
  <li><strong>Single</strong> — um tile central. Insira o ID diretamente na célula central do Direction Grid.</li>
  <li><strong>Multi</strong> — grade com direções (N, S, E, W, cantos). Cada posição aceita um ou mais IDs com chance de aparição.</li>
  <li>Os ícones visuais de direção seguem a cor do Color Theme ativo.</li>
</ul>

<h3 style="font-size:1.15rem;font-weight:700;margin:1.25rem 0 0.5rem;border-bottom:1px solid rgba(128,128,128,0.25);padding-bottom:0.35rem">⚙️ Display Settings</h3>
<ul style="list-style:disc;padding-left:1.5rem;display:flex;flex-direction:column;gap:0.25rem;margin-bottom:0.75rem">
  <li><strong>Dark Mode</strong> — alterna entre modo claro e escuro. A preferência é salva automaticamente.</li>
  <li><strong>Effects</strong> — ativa ou desativa as animações do ícone EPE e outros efeitos visuais.</li>
  <li><strong>Color Theme</strong> — 20 temas de cor disponíveis. A cor principal (primary) afeta toda a interface: grids de direção, botões de criação, tags de seção, ícones do sistema, XML Output e tooltips do Modo Ajuda.</li>
  <li><strong>Help Language</strong> — escolha entre <em>EN</em> (inglês) e <em>PT</em> (português) para os textos dos tooltips do Modo Ajuda.</li>
  <li><strong>Reset All Settings</strong> — restaura todas as configurações ao padrão inicial e recria automaticamente este post de boas-vindas.</li>
</ul>

<h3 style="font-size:1.15rem;font-weight:700;margin:1.25rem 0 0.5rem;border-bottom:1px solid rgba(128,128,128,0.25);padding-bottom:0.35rem">❓ Modo Ajuda</h3>
<p style="margin-bottom:0.75rem">Clique no botão <strong>?</strong> na barra superior para ativar o Modo Ajuda. Com ele ativo, passe o mouse sobre qualquer elemento da interface para ver sua descrição em um tooltip flutuante. A cor do tooltip e do botão segue o Color Theme ativo.</p>

<h3 style="font-size:1.15rem;font-weight:700;margin:1.25rem 0 0.5rem;border-bottom:1px solid rgba(128,128,128,0.25);padding-bottom:0.35rem">📋 XML Output</h3>
<p>O painel de <strong>XML Output</strong> atualiza em tempo real conforme você preenche os campos de cada editor. Use o botão <strong>Copy</strong> para copiar o XML para a área de transferência, ou <strong>Download</strong> para salvar como arquivo <code>.xml</code>. A cor do texto XML segue o Color Theme selecionado.</p>
`,
  },
];

function loadPosts(): BlogPost[] {
  try {
    const raw = localStorage.getItem("epe-blog-posts");
    if (raw) return JSON.parse(raw) as BlogPost[];
  } catch {}
  return DEFAULT_POSTS;
}

function savePosts(posts: BlogPost[]) {
  try { localStorage.setItem("epe-blog-posts", JSON.stringify(posts)); } catch {}
}

// ── Color themes ──────────────────────────────────────────────────────────────

const COLOR_THEMES = [
  { id: "yellow-light",   label: "Yellow Light",    p: "43 96% 58%",  fg: "0 0% 7%",   hue: 43,  sat: 0  },
  { id: "yellow-dark",    label: "Yellow Dark",     p: "40 88% 46%",  fg: "0 0% 97%",  hue: 40,  sat: 0  },
  { id: "orange-light",   label: "Orange Light",    p: "24 90% 62%",  fg: "0 0% 7%",   hue: 24,  sat: 8  },
  { id: "orange-dark",    label: "Orange Dark",     p: "24 80% 44%",  fg: "0 0% 97%",  hue: 24,  sat: 8  },
  { id: "red-light",      label: "Red Light",       p: "4 85% 62%",   fg: "0 0% 7%",   hue: 4,   sat: 8  },
  { id: "red-dark",       label: "Red Dark",        p: "4 75% 40%",   fg: "0 0% 97%",  hue: 4,   sat: 8  },
  { id: "burgundy-light", label: "Burgundy Light",  p: "345 60% 52%", fg: "0 0% 97%",  hue: 345, sat: 8  },
  { id: "burgundy-dark",  label: "Burgundy Dark",   p: "345 58% 35%", fg: "0 0% 97%",  hue: 345, sat: 8  },
  { id: "pink-light",     label: "Pink Light",      p: "320 70% 68%", fg: "0 0% 7%",   hue: 320, sat: 8  },
  { id: "pink-dark",      label: "Pink Dark",       p: "320 65% 48%", fg: "0 0% 97%",  hue: 320, sat: 8  },
  { id: "purple-light",   label: "Purple Light",    p: "270 70% 68%", fg: "0 0% 7%",   hue: 270, sat: 8  },
  { id: "purple-dark",    label: "Purple Dark",     p: "270 65% 46%", fg: "0 0% 97%",  hue: 270, sat: 8  },
  { id: "blue-light",     label: "Blue Light",      p: "210 90% 62%", fg: "0 0% 7%",   hue: 210, sat: 10 },
  { id: "blue-dark",      label: "Blue Dark",       p: "220 75% 44%", fg: "0 0% 97%",  hue: 220, sat: 10 },
  { id: "cyan-light",     label: "Cyan Light",      p: "185 80% 55%", fg: "0 0% 7%",   hue: 185, sat: 8  },
  { id: "cyan-dark",      label: "Cyan Dark",       p: "185 75% 36%", fg: "0 0% 97%",  hue: 185, sat: 8  },
  { id: "green-light",    label: "Green Light",     p: "142 65% 52%", fg: "0 0% 7%",   hue: 142, sat: 8  },
  { id: "green-dark",     label: "Green Dark",      p: "142 60% 34%", fg: "0 0% 97%",  hue: 142, sat: 8  },
  { id: "gray-light",     label: "Gray Light",      p: "0 0% 62%",    fg: "0 0% 7%",   hue: 0,   sat: 0  },
  { id: "black",          label: "Black",           p: "0 0% 18%",    fg: "0 0% 97%",  hue: 0,   sat: 0  },
] as const;

type HelpLang = "en" | "pt";

const HELP_EN: Record<string, string> = {
  "Logo EPE — clique para voltar à página inicial do Elewental Palette Editor": "EPE Logo — click to return to Elewental Palette Editor home",
  "Home — página inicial do EPE com informações e novidades": "Home — EPE home page with news and information",
  "Tilesets — agrupe brushes e itens em paletas para o RME": "Tilesets — group brushes and items into RME palettes",
  "Grounds — edite terrain brushes com items, borders e friends": "Grounds — edit terrain brushes with items, borders, and friends",
  "Borders — configure as 12 direções de borda de cada terrain": "Borders — configure the 12 border directions for each terrain",
  "Grounds e Borders possuem relação funcional entre si.": "Grounds and Borders have a functional relationship with each other.",
  "Doodads / Carpets — edite doodad brushes (Simple, Composite, 3D) e tapetes": "Doodads / Carpets — edit doodad brushes (Simple, Composite, 3D) and carpets",
  "Walls — configure muros com tipos horizontal, vertical, corner e pole": "Walls — configure walls with horizontal, vertical, corner, and pole types",
  "Modo Ajuda — quando ativo, passe o mouse sobre qualquer elemento da interface para ver sua descrição": "Help Mode — when active, hover over any UI element to see its description",
  "Novo Doodad — cria um doodad brush vazio na lista": "New Doodad — creates an empty doodad brush in the list",
  "Recolher Sidebar — colapsa o painel lateral para ganhar mais espaço no editor": "Collapse Sidebar — collapses the side panel to free up editor space",
  "Novo Carpet — cria um carpet brush vazio para configurar tiles de tapete": "New Carpet — creates an empty carpet brush to configure carpet tiles",
  "Novo Item — cria um novo brush/item vazio na categoria ativa": "New Item — creates a new empty brush/item in the active category",
  "Expandir Sidebar — abre o painel lateral com a lista de brushes da categoria ativa": "Expand Sidebar — opens the side panel with the brush list for the active category",
  "Novo Item (sidebar recolhida) — cria um novo brush na categoria ativa sem precisar expandir o painel lateral": "New Item (sidebar collapsed) — creates a new brush in the active category without expanding the side panel",
  "Show All Brush Tags — lista consolidada com as tags de todos os brushes deste módulo. Atualizada automaticamente ao criar, renomear ou remover brushes. Facilita a cópia em lote para registrar todos os brushes no tileset de uma vez": "Show All Brush Tags — consolidated list of every brush tag in this module. Auto-updated when brushes are created, renamed, or removed. Makes batch-copying all brush registrations into a tileset easy.",
  "+ Simple (Alternate) — adiciona um elemento simples já com a opção Alternate ativada, equivalente a criar um Simple e ligar o alternate manualmente": "+ Simple (Alternate) — adds a Simple element with Alternate pre-enabled, equivalent to creating a Simple and toggling alternate on manually",
  "Clear Local Data — apaga permanentemente todos os dados salvos localmente: brushes, configurações, temas e posts. O aplicativo volta ao estado de primeira execução. Esta ação não pode ser desfeita": "Clear Local Data — permanently deletes all locally saved data: brushes, settings, themes, and posts. The app returns to its first-run state. This action cannot be undone",
  "Items — tiles que compõem este tipo de muro. Cada item tem ID e chance de aparecimento": "Items — tiles that make up this wall type. Each item has an ID and appearance chance",
  "Add Item — adiciona um tile para este tipo de muro com ID e chance": "Add Item — adds a tile for this wall type with an ID and chance value",
  "Doors — portas embutidas neste segmento de muro. Cada porta tem ID, tipo e estado (aberta/fechada)": "Doors — doors embedded in this wall segment. Each door has an ID, type, and state (open/closed)",
  "Add Door — adiciona uma porta a este segmento de muro (normal, trancada, quest, etc.)": "Add Door — adds a door to this wall segment (normal, locked, quest, etc.)",
  "Brush Name — nome do wall brush. Deve ser único e é usado para referenciar este muro no XML": "Brush Name — name of the wall brush. Must be unique and is used to reference this wall in XML",
  "Server LookID — ID do item para identificação visual do muro pelo servidor": "Server LookID — item ID for the server's visual identification of this wall",
  "Thickness — espessura do muro no formato numerador/denominador (ex: 100/100)": "Thickness — wall thickness in numerator/denominator format (e.g. 100/100)",
  "Draggable — quando ativado, o muro pode ser arrastado no mapa pelo jogador": "Draggable — when enabled, the wall can be dragged on the map by the player",
  "On Blocking — quando ativado, o muro bloqueia passagem mesmo sobre tiles blocantes": "On Blocking — when enabled, the wall blocks passage even over blocking tiles",
  "Wall Types — configure os tiles para cada orientação do muro: Horizontal, Vertical, Corner (canto) e Pole (pilar)": "Wall Types — configure tiles for each wall orientation: Horizontal, Vertical, Corner, and Pole",
  "Horizontal — tiles do muro em orientação horizontal (lado a lado na direção leste-oeste)": "Horizontal — wall tiles in horizontal orientation (side by side, east-west direction)",
  "Vertical — tiles do muro em orientação vertical (empilhados na direção norte-sul)": "Vertical — wall tiles in vertical orientation (stacked, north-south direction)",
  "Corner — tile de canto onde muros horizontal e vertical se encontram": "Corner — corner tile where horizontal and vertical walls meet",
  "Pole — tile de pilar, segmento de muro isolado sem conexões adjacentes": "Pole — pillar tile, isolated wall segment with no adjacent connections",
  "Z layer — altitude ativa para edição. Z− = andares acima (noroeste), Z+ = andares abaixo (sudeste)": "Z layer — active altitude for editing. Z− = floors above (northwest), Z+ = floors below (southeast)",
  "Subir — muda para o andar acima (Z negativo, deslocado para noroeste na perspectiva)": "Go Up — moves to the floor above (negative Z, shifted northwest in perspective view)",
  "Camada Z ativa — camada sendo editada. Tiles adicionados vão para esta altitude": "Active Z Layer — currently edited layer. Tiles added will go to this altitude",
  "Descer — muda para o andar abaixo (Z positivo, deslocado para sudeste na perspectiva)": "Go Down — moves to the floor below (positive Z, shifted southeast in perspective view)",
  "Layers — camadas Z que possuem tiles. Clique em qualquer camada para navegar diretamente até ela": "Layers — Z layers that contain tiles. Click any layer to navigate directly to it",
  "Expand — abre o Tile Layout 3D em modo tela cheia para editar múltiplas camadas Z com mais espaço": "Expand — opens the 3D Tile Layout in fullscreen mode to edit multiple Z layers with more space",
  "Norte — tile para a borda norte do tapete": "North — tile for the north border of the carpet",
  "Sul — tile para a borda sul do tapete": "South — tile for the south border of the carpet",
  "Leste — tile para a borda leste do tapete": "East — tile for the east border of the carpet",
  "Oeste — tile para a borda oeste do tapete": "West — tile for the west border of the carpet",
  "Canto interno NW — peça de canto noroeste côncavo do tapete": "Inner Corner NW — northwest concave corner piece of the carpet",
  "Canto interno NE — peça de canto nordeste côncavo do tapete": "Inner Corner NE — northeast concave corner piece of the carpet",
  "Canto interno SW — peça de canto sudoeste côncavo do tapete": "Inner Corner SW — southwest concave corner piece of the carpet",
  "Canto interno SE — peça de canto sudeste côncavo do tapete": "Inner Corner SE — southeast concave corner piece of the carpet",
  "Diagonal NW — corte diagonal do canto noroeste do tapete": "Diagonal NW — diagonal cut of the northwest corner of the carpet",
  "Diagonal NE — corte diagonal do canto nordeste do tapete": "Diagonal NE — diagonal cut of the northeast corner of the carpet",
  "Diagonal SW — corte diagonal do canto sudoeste do tapete": "Diagonal SW — diagonal cut of the southwest corner of the carpet",
  "Diagonal SE — corte diagonal do canto sudeste do tapete": "Diagonal SE — diagonal cut of the southeast corner of the carpet",
  "Centro — tile central do tapete (posição 0,0 do padrão)": "Center — central carpet tile (position 0,0 of the pattern)",
};

// ── Slideshow icons for AnimatedDodecagramIcon hover ─────────────────────────

// Slideshow uses the same Lucide icons as the nav menus (minus Home) + extras
// Rendered as React components outside the rotating SVG — they stay upright during spin
type SlideIcon = React.ComponentType<{ size?: number; style?: React.CSSProperties; strokeWidth?: number }>;

const SLIDESHOW_ICONS: SlideIcon[] = [
  Database,    // Tilesets
  Layers,      // Grounds
  Box,         // Borders
  ImageIcon,   // Doodads
  BrickWall,   // Walls
  TreePine,    // árvore
  Footprints,  // pegadas
  Signpost,    // placa
  MapIcon,     // mapa
];

// ── Animated Dodecagram Icon ───────────────────────────────────────────────────

const TIPS = [
  { points: "13.39,6.24 16,2 18.61,6.24",       dx: 0,      dy: -1     },
  { points: "18.61,6.24 23,3.88 23.14,8.86",     dx: 0.5,    dy: -0.866 },
  { points: "23.14,8.86 28.12,9 25.76,13.39",    dx: 0.866,  dy: -0.5   },
  { points: "25.76,13.39 30,16 25.76,18.61",     dx: 1,      dy: 0      },
  { points: "25.76,18.61 28.12,23 23.14,23.14",  dx: 0.866,  dy: 0.5    },
  { points: "23.14,23.14 23,28.12 18.61,25.76",  dx: 0.5,    dy: 0.866  },
  { points: "18.61,25.76 16,30 13.39,25.76",     dx: 0,      dy: 1      },
  { points: "13.39,25.76 9,28.12 8.86,23.14",    dx: -0.5,   dy: 0.866  },
  { points: "8.86,23.14 3.88,23 6.24,18.61",     dx: -0.866, dy: 0.5    },
  { points: "6.24,18.61 2,16 6.24,13.39",        dx: -1,     dy: 0      },
  { points: "6.24,13.39 3.88,9 8.86,8.86",       dx: -0.866, dy: -0.5   },
  { points: "8.86,8.86 9,3.88 13.39,6.24",       dx: -0.5,   dy: -0.866 },
];
const INNER_BODY = "18.61,6.24 23.14,8.86 25.76,13.39 25.76,18.61 23.14,23.14 18.61,25.76 13.39,25.76 8.86,23.14 6.24,18.61 6.24,13.39 8.86,8.86 13.39,6.24";

function makeFaviconSvg(primaryHsl: string): string {
  const tips = TIPS.map((t) => `<polygon points="${t.points}" fill="${primaryHsl}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><polygon points="${INNER_BODY}" fill="${primaryHsl}"/>${tips}</svg>`;
}

function AnimatedDodecagramIcon({ size = 32, effectsEnabled = true, className = "", externalTrigger, externalRotating = false }: {
  size?: number;
  effectsEnabled?: boolean;
  className?: string;
  externalTrigger?: number;
  externalRotating?: boolean;
}) {
  const [burstId, setBurstId] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [slideVisible, setSlideVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideFadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTriggerRef = useRef(0);
  const isHoveredRef = useRef(false);

  const triggerBurst = () => {
    if (!effectsEnabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsSpinning(false);
    setBurstId((id) => (id === 0 ? 1 : id + 1));
    timeoutRef.current = setTimeout(() => {
      setBurstId(0);
      if (isHoveredRef.current && effectsEnabled) setIsSpinning(true);
    }, 360);
  };

  const handleMouseEnter = () => {
    isHoveredRef.current = true;
    triggerBurst();
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    setIsSpinning(false);
  };

  useEffect(() => {
    if (externalTrigger && externalTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = externalTrigger;
      triggerBurst();
    }
  }, [externalTrigger, effectsEnabled]);

  useEffect(() => {
    const active = effectsEnabled && (isSpinning || (burstId === 0 && externalRotating));
    if (!active) {
      setSlideVisible(false);
      if (slideIntervalRef.current) { clearInterval(slideIntervalRef.current); slideIntervalRef.current = null; }
      if (slideFadeRef.current) { clearTimeout(slideFadeRef.current); slideFadeRef.current = null; }
      return;
    }
    setSlideIdx(0);
    setSlideVisible(true);
    slideIntervalRef.current = setInterval(() => {
      setSlideVisible(false);
      slideFadeRef.current = setTimeout(() => {
        setSlideIdx((i) => (i + 1) % SLIDESHOW_ICONS.length);
        setSlideVisible(true);
      }, 300);
    }, 1000);
    return () => {
      if (slideIntervalRef.current) { clearInterval(slideIntervalRef.current); slideIntervalRef.current = null; }
      if (slideFadeRef.current) { clearTimeout(slideFadeRef.current); slideFadeRef.current = null; }
    };
  }, [effectsEnabled, isSpinning, burstId, externalRotating]);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const isBursting = burstId > 0;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-block", flexShrink: 0 }}>
      {/* Slideshow overlay — outside the rotating SVG so icons stay upright */}
      {(() => { const SlideIconComp = SLIDESHOW_ICONS[slideIdx]; return (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            opacity: slideVisible ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SlideIconComp
            size={Math.round(size * 0.52)}
            strokeWidth={1.8}
            style={{ color: "hsl(var(--foreground))" }}
          />
        </div>
      ); })()}
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        style={{ display: "block", cursor: effectsEnabled ? "pointer" : "default", overflow: "visible" }}
        className={`${isBursting ? "epe-icon-animating" : ""} ${(isSpinning || (!isBursting && externalRotating)) ? "epe-icon-spinning" : ""} ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={triggerBurst}
        aria-label="EPE icon"
      >
      <polygon className="epe-body" points={INNER_BODY} style={{ fill: "hsl(var(--primary))" }} />
      {TIPS.map((tip, i) => (
        <polygon
          key={`${i}-${burstId}`}
          className="epe-tip"
          points={tip.points}
          style={{ "--tip-dx": tip.dx, "--tip-dy": tip.dy, fill: "hsl(var(--primary))" } as React.CSSProperties}

        />
      ))}
      </svg>
    </div>
  );
}

// ── Info menu ──────────────────────────────────────────────────────────────

function InfoMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button"
          className="h-9 w-9 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          title="Informações do sistema"
          data-testid="button-info-menu"
          data-help="Informações — versão, tecnologias, criador e como contribuir com o projeto">
          <Info className="w-[18px] h-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        {/* System info — order: Criador / Data / Desenvolvido por */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Informações do Sistema</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Criador</span>
              <span className="font-medium text-right">Daniel Camilo</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Data</span>
              <span className="font-medium text-right">06/06/2026</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground shrink-0">Desenvolvido por</span>
              <span className="font-medium text-right">Replit</span>
            </div>
          </div>
        </div>

        {/* Technical info */}
        <div className="mt-3 pt-3 border-t border-border/40">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tecnologias</p>
          <div className="space-y-1 text-xs">
            <p><span className="text-foreground font-medium">Frontend:</span> <span className="text-muted-foreground">React 18 + Vite + TypeScript</span></p>
            <p><span className="text-foreground font-medium">UI:</span> <span className="text-muted-foreground">Tailwind CSS v4 + Radix UI</span></p>
            <p><span className="text-foreground font-medium">Arquitetura:</span> <span className="text-muted-foreground">SPA, Context API, localStorage</span></p>
            <p><span className="text-foreground font-medium">Compatibilidade:</span> <span className="text-muted-foreground">RME v3.7 oficial + forks compatíveis</span></p>
          </div>
        </div>

        {/* Replit platform + referral */}
        <div className="mt-3 pt-3 border-t border-border/40">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Plataforma</p>
          <p className="text-xs text-muted-foreground mb-2">Crie o seu próprio aplicativo ou ferramenta com IA no Replit — e aproveite descontos na assinatura usando o link abaixo:</p>
          <a
            href="https://replit.com/refer/elewental01"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-mono font-semibold text-primary hover:underline break-all"
          >
            replit.com/refer/elewental01
          </a>
        </div>

        {/* Donations */}
        <div className="mt-3 pt-3 border-t border-border/40">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contribuições</p>
          <p className="text-xs text-muted-foreground mb-2.5">Se você gostou do programa e quiser contribuir com qualquer valor:</p>
          <div className="bg-primary/8 border border-primary/25 rounded-lg px-3 py-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">PIX</p>
            <p className="text-xs font-mono font-semibold text-primary select-all cursor-text">dcep2020@gmail.com</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Styles menu (dark + effects + auth) ────────────────────────────────────────

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`w-7 h-4 rounded-full transition-colors flex items-center px-0.5 ${on ? "bg-primary" : "bg-muted-foreground/30"}`}>
      <span className={`w-3 h-3 rounded-full bg-white transition-transform ${on ? "translate-x-3" : "translate-x-0"}`} />
    </span>
  );
}

function StylesMenu({
  darkMode, onDarkMode, effectsEnabled, onEffects,
  colorTheme, onColorTheme, helpLang, onHelpLang,
  isLoggedIn, onLogin, onLogout, onReset, onClearData,
}: {
  darkMode: boolean; onDarkMode: (v: boolean) => void;
  effectsEnabled: boolean; onEffects: (v: boolean) => void;
  colorTheme: string; onColorTheme: (v: string) => void;
  helpLang: HelpLang; onHelpLang: (v: HelpLang) => void;
  isLoggedIn: boolean; onLogin: (u: string, p: string) => boolean; onLogout: () => void;
  onReset: () => void;
  onClearData: () => void;
}) {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);

  const handleLogin = () => {
    if (onLogin(user, pass)) { setUser(""); setPass(""); setErr(false); setShowLogin(false); }
    else setErr(true);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleLogin(); };

  return (
    <Popover onOpenChange={(open) => { if (!open) { setShowLogin(false); setErr(false); } }}>
      <PopoverTrigger asChild>
        <button type="button"
          className="h-9 w-9 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          title="Display settings" data-testid="button-styles-menu">
          <Settings2 className="w-[18px] h-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">Display</p>
        <button type="button" className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm"
          onClick={() => onDarkMode(!darkMode)}>
          <span className="flex items-center gap-2">
            {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            Dark mode
          </span>
          <Toggle on={darkMode} />
        </button>
        <button type="button" className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm"
          onClick={() => onEffects(!effectsEnabled)}>
          <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" />Effects</span>
          <Toggle on={effectsEnabled} />
        </button>

        {/* ── Color Theme ── */}
        <div className="mt-2 pt-2 border-t border-border/40">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">Color Theme</p>
          <div className="grid grid-cols-5 gap-1.5 px-1">
            {COLOR_THEMES.map((t) => (
              <button key={t.id} type="button" title={t.label}
                onClick={() => onColorTheme(t.id)}
                className={[
                  "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                  colorTheme === t.id
                    ? "border-foreground scale-110 shadow-md"
                    : "border-transparent hover:border-foreground/40 hover:scale-105",
                ].join(" ")}
                style={{ background: `hsl(${t.p})` }}>
                {colorTheme === t.id && <span className="w-2 h-2 rounded-full bg-white/80 shadow" />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Help Language ── */}
        <div className="mt-2 pt-2 border-t border-border/40">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">Help Language</p>
          <div className="flex gap-1 px-1">
            {(["en", "pt"] as const).map((lang) => (
              <button key={lang} type="button" onClick={() => onHelpLang(lang)}
                className={[
                  "flex-1 py-1 rounded text-[11px] font-mono font-bold uppercase transition-colors border",
                  helpLang === lang
                    ? "bg-primary/20 border-primary/60 text-primary"
                    : "border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                ].join(" ")}>
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* ── Reset All Settings + Clear Local Data ── */}
        <div className="mt-2 pt-2 border-t border-border/40 space-y-0.5">
          <button type="button"
            onClick={onReset}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-destructive/10 transition-colors text-sm text-muted-foreground hover:text-destructive"
            data-testid="button-reset-settings">
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            Reset All Settings
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button"
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-destructive/10 transition-colors text-sm text-muted-foreground hover:text-destructive"
                data-testid="button-clear-local-data"
                data-help="Clear Local Data — apaga permanentemente todos os dados salvos localmente: brushes, configurações, temas e posts. O aplicativo volta ao estado de primeira execução. Esta ação não pode ser desfeita">
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                Clear Local Data
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar dados locais?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja apagar todos os dados salvos localmente? Todos os brushes, configurações e posts serão removidos. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onClearData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-clear-data">
                  Apagar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* ── Auth section ── */}
        <div className="mt-2 pt-2 border-t border-border/40">
          {isLoggedIn ? (
            <button type="button" className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm text-muted-foreground hover:text-foreground"
              onClick={onLogout}>
              <LogOut className="w-3.5 h-3.5" />Sign out
            </button>
          ) : showLogin ? (
            <div className="space-y-1.5 px-1">
              <input type="text" placeholder="Username" value={user}
                onChange={(e) => setUser(e.target.value)} onKeyDown={handleKeyDown} autoFocus
                className="w-full h-7 px-2 text-xs rounded border border-border bg-background outline-none focus:ring-1 focus:ring-primary" />
              <input type="password" placeholder="Password" value={pass}
                onChange={(e) => setPass(e.target.value)} onKeyDown={handleKeyDown}
                className="w-full h-7 px-2 text-xs rounded border border-border bg-background outline-none focus:ring-1 focus:ring-primary" />
              {err && <p className="text-[11px] text-destructive">Invalid credentials.</p>}
              <div className="flex gap-1.5 pt-0.5">
                <button type="button" onClick={handleLogin}
                  className="flex-1 h-7 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
                  Sign in
                </button>
                <button type="button" onClick={() => { setShowLogin(false); setErr(false); setUser(""); setPass(""); }}
                  className="h-7 px-2 text-xs rounded border border-border hover:bg-accent transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowLogin(true)}>
              <Lock className="w-3.5 h-3.5" />Sign in to edit
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Sidebar item (editor) ──────────────────────────────────────────────────────

function SidebarItem({ id, label, active, onSelect, onDelete }: {
  id: string; label: string; active: boolean;
  onSelect: () => void; onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      role="button" tabIndex={0}
      className={["w-full text-left px-2.5 py-2 text-sm rounded-md flex items-center justify-between group transition-colors cursor-pointer",
        active ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent text-sidebar-foreground"].join(" ")}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      data-testid={`sidebar-item-${id}`}
    >
      <span className="truncate text-xs">{label}</span>
      <button type="button" aria-label="Delete"
        className={["w-5 h-5 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-colors shrink-0",
          active ? "text-primary-foreground hover:bg-primary-foreground/20" : "text-muted-foreground hover:text-destructive"].join(" ")}
        onClick={onDelete} data-testid={`button-delete-${id}`}>
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Landing page (home) ────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function LandingPage({ effectsEnabled, isLoggedIn }: {
  effectsEnabled: boolean;
  isLoggedIn: boolean;
}) {
  const [posts, setPosts] = useState<BlogPost[]>(() => loadPosts());
  const [blogSidebarOpen, setBlogSidebarOpen] = useState(true);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editHtml, setEditHtml] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [page, setPage] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);

  const updatePosts = (next: BlogPost[]) => { setPosts(next); savePosts(next); };

  // Always sorted by order — first item drives the feed
  const sorted = [...posts].sort((a, b) => a.order - b.order);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pagePosts = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const createPost = () => {
    const id = crypto.randomUUID();
    const order = posts.length;
    const newPost: BlogPost = {
      id, title: "New Page", order,
      html: "<h2>New Page</h2>\n<p>Edit this content using the Edit button.</p>",
    };
    const next = [...posts, newPost];
    updatePosts(next);
    // Jump to last page so new post is visible
    setPage(Math.floor(next.length / PAGE_SIZE));
    startEdit(newPost);
  };

  const deletePost = (id: string) => {
    const next = posts.filter((p) => p.id !== id);
    updatePosts(next);
    if (editingPostId === id) setEditingPostId(null);
    // Clamp page
    const newTotal = Math.ceil(next.length / PAGE_SIZE);
    if (page >= newTotal && newTotal > 0) setPage(newTotal - 1);
  };

  const movePost = (id: string, dir: -1 | 1) => {
    const s = [...posts].sort((a, b) => a.order - b.order);
    const idx = s.findIndex((p) => p.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= s.length) return;
    const next = posts.map((p) => {
      if (p.id === s[idx].id)    return { ...p, order: s[swapIdx].order };
      if (p.id === s[swapIdx].id) return { ...p, order: s[idx].order };
      return p;
    });
    updatePosts(next);
  };

  const startEdit = (post: BlogPost) => {
    setEditingPostId(post.id);
    setEditHtml(post.html);
    setEditTitle(post.title);
  };

  const saveEdit = () => {
    if (!editingPostId) return;
    const next = posts.map((p) =>
      p.id === editingPostId ? { ...p, html: editHtml, title: editTitle } : p
    );
    updatePosts(next);
    setEditingPostId(null);
  };

  const cancelEdit = () => setEditingPostId(null);

  const goToPage = (p: number) => {
    setPage(p);
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sidebar: clicking a post jumps to the page containing it
  const jumpToPost = (id: string) => {
    const idx = sorted.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const targetPage = Math.floor(idx / PAGE_SIZE);
    setPage(targetPage);
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Blog sidebar */}
      <aside
        className={[
          "border-r border-border bg-sidebar flex flex-col shrink-0 transition-all duration-200",
          blogSidebarOpen ? "w-52" : "w-10",
        ].join(" ")}
      >
        {blogSidebarOpen ? (
          <>
            <div className="p-3 border-b border-border flex items-center justify-between min-h-[48px]">
              <h2 className="font-semibold text-sidebar-foreground text-sm">Pages</h2>
              <div className="flex items-center gap-1">
                {isLoggedIn && (
                  <button
                    type="button" onClick={createPost}
                    disabled={sorted.length >= 50}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${sorted.length >= 50 ? "text-muted-foreground/30 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                    title={sorted.length >= 50 ? "Page limit reached (50 max)" : "New page"}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button" onClick={() => setBlogSidebarOpen(false)}
                  className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Collapse"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
            <ScrollArea className="flex-1 p-1.5">
              <div className="space-y-0.5">
                {sorted.map((post, sortedIdx) => {
                  const onCurrentPage =
                    sortedIdx >= page * PAGE_SIZE && sortedIdx < (page + 1) * PAGE_SIZE;
                  return (
                    <div
                      key={post.id}
                      className={[
                        "rounded-md flex items-center group transition-colors",
                        onCurrentPage ? "bg-primary/10" : "hover:bg-sidebar-accent",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        className="flex-1 text-left px-2.5 py-2 text-xs truncate text-sidebar-foreground"
                        onClick={() => jumpToPost(post.id)}
                      >
                        {post.title}
                      </button>
                      {isLoggedIn && (
                        <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button" onClick={() => movePost(post.id, -1)}
                            disabled={sortedIdx === 0}
                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 rounded transition-colors"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button" onClick={() => movePost(post.id, 1)}
                            disabled={sortedIdx === sorted.length - 1}
                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 rounded transition-colors"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button" onClick={() => deletePost(post.id)}
                            className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-destructive rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center pt-2 gap-2">
            <button
              type="button" onClick={() => setBlogSidebarOpen(true)}
              className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Expand"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <FileText className="w-4 h-4 text-muted-foreground/50" />
          </div>
        )}
      </aside>

      {/* Main content — blog feed */}
      <main ref={mainRef} className="flex-1 overflow-y-auto bg-background">
        {/* Hero — always at top */}
        <div className="flex flex-col items-center justify-center pt-14 pb-10 px-8">
          <div className="p-8 mb-2 flex items-center justify-center">
            <AnimatedDodecagramIcon size={92} effectsEnabled={effectsEnabled} className="drop-shadow-lg" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-1">Elewental Palette Editor</h1>
        </div>

        {/* Blog feed — posts in order */}
        {pagePosts.length > 0 ? (
          <div className="max-w-3xl mx-auto px-8 pb-8 space-y-12">
            {pagePosts.map((post) => (
              <article key={post.id} id={`post-${post.id}`}>
                {/* Post header */}
                <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                  {editingPostId === post.id ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg font-semibold bg-transparent border-b border-primary/50 outline-none px-1 min-w-[180px] flex-1 mr-4"
                    />
                  ) : (
                    <h2 className="text-lg font-semibold">{post.title}</h2>
                  )}
                  {isLoggedIn && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {editingPostId === post.id ? (
                        <>
                          <Button size="sm" className="h-7 text-xs gap-1.5" onClick={saveEdit}>
                            <Eye className="w-3.5 h-3.5" /> Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => startEdit(post)}>
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Post content */}
                {editingPostId === post.id ? (
                  <textarea
                    className="w-full h-80 font-mono text-sm bg-muted/30 border border-border rounded p-3 resize-y outline-none focus:ring-1 focus:ring-primary"
                    value={editHtml}
                    onChange={(e) => setEditHtml(e.target.value)}
                    spellCheck={false}
                    placeholder="Enter HTML content here…"
                  />
                ) : (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: post.html }}
                  />
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText className="w-10 h-10 mb-3 opacity-30" />
            <p>No pages yet. Click + in the sidebar to create one.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pb-12 mt-4">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              className="w-8 h-8 rounded border border-border flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages - 1}
              className="w-8 h-8 rounded border border-border flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Main Home component ────────────────────────────────────────────────────────

export default function Home() {
  const { state, dispatch } = useEditor();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("rme-theme") === "dark";
    return false;
  });
  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("epe-effects") !== "false";
    return true;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(loadAuth);
  const [iconHovered, setIconHovered] = useState(false);
  const [iconTrigger, setIconTrigger] = useState(0);
  const [iconRotating, setIconRotating] = useState(false);
  const [helpMode, setHelpMode] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEYS.helpMode) === "true"; } catch { return false; }
  });
  const [helpText, setHelpText] = useState<string | null>(null);
  const [helpPos, setHelpPos] = useState({ x: 0, y: 0 });
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem("epe-color-theme") || "yellow-light");
  const [helpLang, setHelpLang] = useState<HelpLang>(() => {
    const s = localStorage.getItem("epe-help-lang");
    return s === "pt" ? "pt" : "en";
  });
  const [landingKey, setLandingKey] = useState(0);

  const handleReset = () => {
    Object.values(STORAGE_KEYS).forEach((key) => { try { localStorage.removeItem(key); } catch {} });
    dispatch({ type: "RESET_ALL" });
    setColorTheme("yellow-light");
    setEffectsEnabled(true);
    setDarkMode(false);
    setHelpLang("en");
    setHelpMode(false);
    setLandingKey((k) => k + 1);
  };

  const handleClearData = () => {
    clearAllAppData();
    dispatch({ type: "RESET_ALL" });
    setColorTheme("yellow-light");
    setEffectsEnabled(true);
    setDarkMode(false);
    setHelpLang("en");
    setHelpMode(false);
    setLandingKey((k) => k + 1);
  };

  const handleLogin = (u: string, p: string): boolean => {
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      saveAuth(true);
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    saveAuth(false);
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.add("dark"); localStorage.setItem("rme-theme", "dark"); }
    else { root.classList.remove("dark"); localStorage.setItem("rme-theme", "light"); }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("epe-effects", String(effectsEnabled));
  }, [effectsEnabled]);

  useEffect(() => {
    localStorage.setItem("epe-help-lang", helpLang);
  }, [helpLang]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.helpMode, String(helpMode)); } catch {}
  }, [helpMode]);

  useEffect(() => {
    const theme = COLOR_THEMES.find((t) => t.id === colorTheme);
    if (!theme) return;
    localStorage.setItem("epe-color-theme", colorTheme);
    document.getElementById("epe-theme-style")?.remove();
    const style = document.createElement("style");
    style.id = "epe-theme-style";
    const bg7  = theme.sat === 0 ? "0 0% 7%"  : `${theme.hue} ${theme.sat}% 7%`;
    const bg10 = theme.sat === 0 ? "0 0% 10%" : `${theme.hue} ${theme.sat}% 10%`;
    const bg11 = theme.sat === 0 ? "0 0% 11%" : `${theme.hue} ${theme.sat}% 11%`;
    const bg15 = theme.sat === 0 ? "0 0% 15%" : `${theme.hue} ${theme.sat}% 15%`;
    const bg18 = theme.sat === 0 ? "0 0% 18%" : `${theme.hue} ${theme.sat}% 18%`;
    style.textContent = `
      :root {
        --primary: ${theme.p} !important;
        --primary-foreground: ${theme.fg} !important;
        --ring: ${theme.p} !important;
        --sidebar-primary: ${theme.p} !important;
        --sidebar-ring: ${theme.p} !important;
        --sidebar-primary-foreground: ${theme.fg} !important;
      }
      .dark {
        --primary: ${theme.p} !important;
        --primary-foreground: ${theme.fg} !important;
        --ring: ${theme.p} !important;
        --sidebar-primary: ${theme.p} !important;
        --sidebar-ring: ${theme.p} !important;
        --sidebar-primary-foreground: ${theme.fg} !important;
        --background: ${bg7} !important;
        --card: ${bg11} !important;
        --sidebar: ${bg10} !important;
        --popover: ${bg11} !important;
        --border: ${bg18} !important;
        --card-border: ${bg18} !important;
        --sidebar-border: ${bg18} !important;
        --sidebar-accent: ${bg18} !important;
        --popover-border: ${bg18} !important;
        --secondary: ${bg18} !important;
        --muted: ${bg15} !important;
        --accent: ${bg18} !important;
        --input: ${bg18} !important;
      }
    `;
    document.head.appendChild(style);

    // Update favicon to match the color theme
    const primaryHsl = `hsl(${theme.p})`;
    const svgStr = makeFaviconSvg(primaryHsl);
    const encoded = `data:image/svg+xml,${encodeURIComponent(svgStr)}`;
    let faviconLink = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement("link");
      faviconLink.rel = "icon";
      faviconLink.type = "image/svg+xml";
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = encoded;
  }, [colorTheme]);

  useEffect(() => {
    if (!helpMode) { setHelpText(null); return; }
    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element).closest("[data-help]") as HTMLElement | null;
      const pt = el?.dataset.help ?? null;
      if (!pt) { setHelpText(null); return; }
      if (helpLang === "pt") { setHelpText(pt); return; }
      setHelpText(HELP_EN[pt] ?? pt);
    };
    const onMove = (e: MouseEvent) => {
      const vpW = window.innerWidth;
      const vpH = window.innerHeight;
      setHelpPos({
        x: e.clientX > vpW - 310 ? e.clientX - 296 : e.clientX + 14,
        y: e.clientY > vpH - 110 ? e.clientY - 84  : e.clientY + 14,
      });
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mousemove", onMove);
    };
  }, [helpMode, helpLang]);

  const isHome = state.activeCategory === "home";

  const categories: { id: Category; label: string; icon: any }[] = [
    { id: "home",     label: "Home",     icon: HomeIcon  },
    { id: "tilesets", label: "Tilesets", icon: Database  },
    { id: "grounds",  label: "Grounds",  icon: Layers    },
    { id: "borders",  label: "Borders",  icon: Box       },
    { id: "doodads",  label: "Doodads",  icon: ImageIcon },
    { id: "walls",    label: "Walls",    icon: BrickWall },
  ];
  const visibleCategories = isHome ? categories : categories.filter((c) => c.id !== "home");

  // ── Items for non-doodad sidebar ──────────────────────────────────────────
  const currentItems: { id: string; [key: string]: any }[] = (() => {
    switch (state.activeCategory) {
      case "borders":  return state.borders;
      case "grounds":  return state.grounds;
      case "walls":    return state.walls;
      case "tilesets": return state.tilesets ?? [];
      default:         return [];
    }
  })();

  const handleCreate = () => {
    const id = crypto.randomUUID();
    const emptyItems = { n: null, s: null, e: null, w: null, cnw: null, cne: null, csw: null, cse: null, dnw: null, dne: null, dsw: null, dse: null } as const;
    switch (state.activeCategory) {
      case "borders":
        dispatch({ type: "ADD_BORDER", border: { id, borderId: undefined, items: emptyItems } });
        break;
      case "grounds":
        dispatch({ type: "ADD_GROUND", ground: { id, name: "New Ground", items: [], borders: [], friends: [] } });
        break;
      case "walls":
        dispatch({ type: "ADD_WALL", wall: { id, name: "New Wall", walls: {} } });
        break;
      case "tilesets":
        dispatch({ type: "ADD_TILESET", tileset: { id, name: "New Tileset", sections: [] } });
        break;
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    switch (state.activeCategory) {
      case "borders":  dispatch({ type: "DELETE_BORDER",  id }); break;
      case "grounds":  dispatch({ type: "DELETE_GROUND",  id }); break;
      case "walls":    dispatch({ type: "DELETE_WALL",    id }); break;
      case "tilesets": dispatch({ type: "DELETE_TILESET", id }); break;
    }
  };

  const getItemLabel = (item: any) =>
    state.activeCategory === "borders" ? `Border ${item.borderId ?? "New"}` : item.name || "Unnamed";

  const handleCreateDoodad = () => {
    const id = crypto.randomUUID();
    dispatch({ type: "ADD_DOODAD", doodad: { id, name: "New Doodad", serverLookId: 0, draggable: true, onBlocking: false, thickness: "10/100", elements: [] } });
  };
  const handleCreateCarpet = () => {
    const id = crypto.randomUUID();
    dispatch({ type: "ADD_CARPET", carpet: { id, name: "New Carpet", carpets: {} } });
  };
  const handleDeleteDoodad = (id: string, e: React.MouseEvent) => { e.stopPropagation(); dispatch({ type: "DELETE_DOODAD", id }); };
  const handleDeleteCarpet = (id: string, e: React.MouseEvent) => { e.stopPropagation(); dispatch({ type: "DELETE_CARPET", id }); };

  const isDoodadTab = state.activeCategory === "doodads";
  const activeDoodad = isDoodadTab ? state.doodads.find((d) => d.id === state.activeItemId) : undefined;
  const activeCarpet = isDoodadTab ? state.carpets.find((c) => c.id === state.activeItemId) : undefined;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* ── Header ── */}
      <header className="h-16 border-b border-border bg-card flex items-center px-5 shrink-0 gap-3">
        {/* Logo — hidden on home page (shown in hero), visible on editor pages */}
        {!isHome && (
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_CATEGORY", category: "home" })}
            className="flex items-center gap-2 mr-3 select-none shrink-0 rounded hover:opacity-75 transition-opacity"
            title="Go to Home"
            data-help="Logo EPE — clique para voltar à página inicial do Elewental Palette Editor"
            onMouseEnter={() => { setIconTrigger((t) => t + 1); setIconRotating(true); setIconHovered(true); }}
            onMouseLeave={() => { setIconRotating(false); setIconHovered(false); }}
          >
            <div>
              <AnimatedDodecagramIcon size={32} effectsEnabled={effectsEnabled} externalTrigger={iconTrigger} externalRotating={iconRotating} />
            </div>
            <div
              className="flex items-center overflow-hidden"
            >
              <span className="font-bold text-base tracking-tight">EPE</span>
              <span className={[
                "text-base font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ease-out text-muted-foreground",
                iconHovered ? "max-w-[260px] opacity-100" : "max-w-0 opacity-0",
              ].join(" ")}>
                &nbsp;— Elewental Palette Editor
              </span>
            </div>
          </button>
        )}

        <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
          {visibleCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = state.activeCategory === cat.id;
            return (
              <React.Fragment key={cat.id}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={`gap-2 shrink-0 ${isActive ? "bg-secondary text-secondary-foreground" : cat.id === "tilesets" ? "text-primary" : "text-muted-foreground"}`}
                onClick={() => dispatch({ type: "SET_CATEGORY", category: cat.id })}
                data-testid={`tab-${cat.id}`}
                data-help={
                  cat.id === "home"     ? "Home — página inicial do EPE com informações e novidades" :
                  cat.id === "tilesets" ? "Tilesets — agrupe brushes e itens em paletas para o RME" :
                  cat.id === "grounds"  ? "Grounds — edite terrain brushes com items, borders e friends" :
                  cat.id === "borders"  ? "Borders — configure as 12 direções de borda de cada terrain" :
                  cat.id === "doodads"  ? "Doodads / Carpets — edite doodad brushes (Simple, Composite, 3D) e tapetes" :
                  cat.id === "walls"    ? "Walls — configure muros com tipos horizontal, vertical, corner e pole" :
                  `Abrir editor de ${cat.label}`
                }
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </Button>
              {cat.id === "grounds" && (
                <span
                  data-help="Grounds e Borders possuem relação funcional entre si."
                  className="select-none pointer-events-auto shrink-0 text-xs font-bold px-1"
                  style={{ color: "hsl(var(--primary))", lineHeight: 1, opacity: 0.9, cursor: "default", userSelect: "none" }}
                >
                  ↔
                </span>
              )}
              </React.Fragment>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setHelpMode((m) => !m)}
          className={[
            "w-9 h-9 rounded flex items-center justify-center transition-colors shrink-0",
            helpMode
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-accent",
          ].join(" ")}
          title={helpMode ? "Sair do modo ajuda" : "Modo ajuda — passe o mouse sobre elementos para ver descrições"}
          data-help="Modo Ajuda — quando ativo, passe o mouse sobre qualquer elemento da interface para ver sua descrição"
        >
          <Search className="w-[18px] h-[18px]" />
        </button>
        <InfoMenu />
        <StylesMenu
          darkMode={darkMode} onDarkMode={setDarkMode}
          effectsEnabled={effectsEnabled} onEffects={setEffectsEnabled}
          colorTheme={colorTheme} onColorTheme={setColorTheme}
          helpLang={helpLang} onHelpLang={setHelpLang}
          isLoggedIn={isLoggedIn} onLogin={handleLogin} onLogout={handleLogout}
          onReset={handleReset} onClearData={handleClearData}
        />
      </header>

      {/* ── Body ── */}
      {isHome ? (
        <LandingPage key={landingKey} effectsEnabled={effectsEnabled} isLoggedIn={isLoggedIn} />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left Sidebar ── */}
          <aside className={["border-r border-border bg-sidebar flex flex-col shrink-0 transition-all duration-200", sidebarOpen ? "w-60" : "w-10"].join(" ")}>
            {sidebarOpen ? (
              <>
                {isDoodadTab ? (
                  /* Doodads tab: two sub-sections */
                  <ScrollArea className="flex-1">
                    <div className="p-3 pb-1 flex items-center justify-between">
                      <h2 className="font-semibold text-sidebar-foreground text-sm">Doodads</h2>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={handleCreateDoodad}
                          className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          data-testid="button-create-doodad" title="New doodad"
                          data-help="Novo Doodad — cria um doodad brush vazio na lista">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setSidebarOpen(false)}
                          className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          data-testid="button-collapse-sidebar" title="Collapse sidebar"
                          data-help="Recolher Sidebar — colapsa o painel lateral para ganhar mais espaço no editor">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="px-1.5 pb-1 space-y-0.5">
                      {state.doodads.map((item) => (
                        <SidebarItem key={item.id} id={item.id} label={item.name || "Unnamed"} active={state.activeItemId === item.id}
                          onSelect={() => dispatch({ type: "SET_ACTIVE_ITEM", id: item.id })}
                          onDelete={(e) => handleDeleteDoodad(item.id, e)} />
                      ))}
                      {state.doodads.length === 0 && <p className="text-center px-2 py-2 text-xs text-muted-foreground">No doodads yet.</p>}
                    </div>
                    <div className="p-3 pb-1 flex items-center justify-between border-t border-border/40 mt-2">
                      <h2 className="font-semibold text-sidebar-foreground text-sm">Carpets</h2>
                      <button type="button" onClick={handleCreateCarpet}
                        className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        data-testid="button-create-carpet" title="New carpet"
                        data-help="Novo Carpet — cria um carpet brush vazio para configurar tiles de tapete">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="px-1.5 pb-3 space-y-0.5">
                      {state.carpets.map((item) => (
                        <SidebarItem key={item.id} id={item.id} label={item.name || "Unnamed"} active={state.activeItemId === item.id}
                          onSelect={() => dispatch({ type: "SET_ACTIVE_ITEM", id: item.id })}
                          onDelete={(e) => handleDeleteCarpet(item.id, e)} />
                      ))}
                      {state.carpets.length === 0 && <p className="text-center px-2 py-2 text-xs text-muted-foreground">No carpets yet.</p>}
                    </div>
                  </ScrollArea>
                ) : (
                  /* Other categories: single list */
                  <>
                    <div className="p-3 border-b border-border flex items-center justify-between min-h-[48px]">
                      <h2 className="font-semibold text-sidebar-foreground capitalize text-sm">{state.activeCategory}</h2>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={handleCreate}
                          className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          data-testid="button-create-item" title="New item"
                          data-help="Novo Item — cria um novo brush/item vazio na categoria ativa">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setSidebarOpen(false)}
                          className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          data-testid="button-collapse-sidebar" title="Collapse sidebar"
                          data-help="Recolher Sidebar — colapsa o painel lateral para ganhar mais espaço no editor">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <ScrollArea className="flex-1 p-1.5">
                      <div className="space-y-0.5">
                        {currentItems.map((item) => (
                          <SidebarItem key={item.id} id={item.id} label={getItemLabel(item)} active={state.activeItemId === item.id}
                            onSelect={() => dispatch({ type: "SET_ACTIVE_ITEM", id: item.id })}
                            onDelete={(e) => handleDelete(item.id, e)} />
                        ))}
                        {currentItems.length === 0 && (
                          <div className="text-center p-4 text-xs text-muted-foreground">No items yet.<br />Click + to create one.</div>
                        )}
                      </div>
                    </ScrollArea>
                  </>
                )}
              </>
            ) : (
              /* Collapsed sidebar */
              <div className="flex flex-col items-center pt-2 gap-2">
                <button type="button" onClick={() => setSidebarOpen(true)}
                  className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  data-testid="button-expand-sidebar" title="Expand sidebar"
                  data-help="Expandir Sidebar — abre o painel lateral com a lista de brushes da categoria ativa">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button type="button" onClick={isDoodadTab ? handleCreateDoodad : handleCreate}
                  className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  data-testid="button-create-collapsed" title="New item"
                  data-help="Novo Item (sidebar recolhida) — cria um novo brush na categoria ativa sem precisar expandir o painel lateral">
                  <Plus className="w-4 h-4" />
                </button>
                {(isDoodadTab ? state.doodads.length + state.carpets.length : currentItems.length) > 0 && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {isDoodadTab ? state.doodads.length + state.carpets.length : currentItems.length}
                  </span>
                )}
              </div>
            )}
          </aside>

          {/* ── Main Editor ── */}
          <main className="flex-1 overflow-y-auto bg-background">
            {state.activeCategory === "borders"  && <BorderEditor />}
            {state.activeCategory === "grounds"  && <GroundEditor />}
            {state.activeCategory === "walls"    && <WallEditor />}
            {state.activeCategory === "tilesets" && <TilesetEditor />}
            {isDoodadTab && (
              activeDoodad ? <DoodadEditor /> :
              activeCarpet ? <CarpetEditor /> : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Select a doodad or carpet from the sidebar, or create a new one.
                </div>
              )
            )}
          </main>

          {/* ── XML Preview ── */}
          <aside className="shrink-0 flex flex-col">
            <XmlPreview />
          </aside>
        </div>
      )}
      {helpMode && helpText && (
        <div
          className="fixed z-[9999] pointer-events-none px-3 py-2 rounded-lg text-xs font-medium shadow-xl border animate-in fade-in duration-100 bg-background/95 dark:bg-background/95 text-foreground border-primary/40"
          style={{ left: helpPos.x, top: helpPos.y, maxWidth: 280 }}
        >
          {helpText}
        </div>
      )}
    </div>
  );
}
