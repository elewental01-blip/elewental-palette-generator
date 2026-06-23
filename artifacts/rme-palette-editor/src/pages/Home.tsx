import { useState, useEffect, useRef } from "react";
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
  ChevronUp, ChevronDown, Edit3, Eye, FileText, Lock, LogOut, Search,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

const DEFAULT_POSTS: BlogPost[] = [
  {
    id: "welcome",
    title: "Welcome",
    order: 0,
    html: `<h2 style="font-size:1.5rem;font-weight:700;margin-bottom:0.75rem">Welcome to Elewental Palette Editor</h2>
<p style="margin-bottom:1rem">EPE is a visual XML palette editor for <strong>Remere's Map Editor (RME)</strong>. It lets you create and edit palette configurations for borders, grounds, doodads, walls, carpets, and tilesets — and export them as valid RME XML.</p>
<h3 style="font-size:1.1rem;font-weight:600;margin-bottom:0.5rem">Getting Started</h3>
<ul style="list-style:disc;padding-left:1.5rem;margin-bottom:1rem;display:flex;flex-direction:column;gap:0.25rem">
  <li>Use the navigation tabs above to switch between editors.</li>
  <li>Create items using the <strong>+</strong> button in the sidebar.</li>
  <li>Fill in the fields — the XML output updates live.</li>
  <li>Copy or download the XML when ready.</li>
</ul>
<h3 style="font-size:1.1rem;font-weight:600;margin-bottom:0.5rem">Modules</h3>
<ul style="list-style:disc;padding-left:1.5rem;display:flex;flex-direction:column;gap:0.25rem">
  <li><strong>Tilesets</strong> — Register brushes into terrain, doodad, or raw sections.</li>
  <li><strong>Grounds</strong> — Configure ground brushes with items, borders, and friends.</li>
  <li><strong>Borders</strong> — Set border IDs per direction using the direction grid.</li>
  <li><strong>Doodads &amp; Carpets</strong> — Compose simple or multi-tile brushes.</li>
  <li><strong>Walls</strong> — Configure wall types with doors (horizontal, vertical, corner, pole).</li>
</ul>`,
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

function AnimatedDodecagramIcon({ size = 32, effectsEnabled = true, className = "", externalTrigger }: {
  size?: number;
  effectsEnabled?: boolean;
  className?: string;
  externalTrigger?: number;
}) {
  const [burstId, setBurstId] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTriggerRef = useRef(0);

  const triggerBurst = () => {
    if (!effectsEnabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setBurstId((id) => (id === 0 ? 1 : id + 1));
    timeoutRef.current = setTimeout(() => setBurstId(0), 360);
  };

  useEffect(() => {
    if (externalTrigger && externalTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = externalTrigger;
      triggerBurst();
    }
  }, [externalTrigger, effectsEnabled]);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const isBursting = burstId > 0;

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      style={{ display: "block", flexShrink: 0, cursor: effectsEnabled ? "pointer" : "default", overflow: "visible" }}
      className={`${isBursting ? "epe-icon-animating" : ""} ${className}`}
      onMouseEnter={triggerBurst}
      onClick={triggerBurst}
      aria-label="EPE icon"
    >
      <polygon className="epe-body" points={INNER_BODY} fill="#EAB308" />
      {TIPS.map((tip, i) => (
        <polygon
          key={`${i}-${burstId}`}
          className="epe-tip"
          points={tip.points}
          fill="#EAB308"
          style={{
            "--tip-dx": tip.dx,
            "--tip-dy": tip.dy,
          } as React.CSSProperties}
        />
      ))}
    </svg>
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
  isLoggedIn, onLogin, onLogout,
}: {
  darkMode: boolean; onDarkMode: (v: boolean) => void;
  effectsEnabled: boolean; onEffects: (v: boolean) => void;
  isLoggedIn: boolean; onLogin: (u: string, p: string) => boolean; onLogout: () => void;
}) {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);

  const handleLogin = () => {
    if (onLogin(user, pass)) {
      setUser(""); setPass(""); setErr(false); setShowLogin(false);
    } else {
      setErr(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <Popover onOpenChange={(open) => { if (!open) { setShowLogin(false); setErr(false); } }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          title="Display settings"
          data-testid="button-styles-menu"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="end">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">Display</p>
        <button
          type="button"
          className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm"
          onClick={() => onDarkMode(!darkMode)}
        >
          <span className="flex items-center gap-2">
            {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            Dark mode
          </span>
          <Toggle on={darkMode} />
        </button>
        <button
          type="button"
          className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm"
          onClick={() => onEffects(!effectsEnabled)}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Effects
          </span>
          <Toggle on={effectsEnabled} />
        </button>

        {/* ── Auth section ── */}
        <div className="mt-2 pt-2 border-t border-border/40">
          {isLoggedIn ? (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm text-muted-foreground hover:text-foreground"
              onClick={onLogout}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          ) : showLogin ? (
            <div className="space-y-1.5 px-1">
              <input
                type="text"
                placeholder="Username"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full h-7 px-2 text-xs rounded border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="password"
                placeholder="Password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-7 px-2 text-xs rounded border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
              />
              {err && <p className="text-[11px] text-destructive">Invalid credentials.</p>}
              <div className="flex gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleLogin}
                  className="flex-1 h-7 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { setShowLogin(false); setErr(false); setUser(""); setPass(""); }}
                  className="h-7 px-2 text-xs rounded border border-border hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowLogin(true)}
            >
              <Lock className="w-3.5 h-3.5" />
              Sign in to edit
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
  const [helpMode, setHelpMode] = useState(false);
  const [helpText, setHelpText] = useState<string | null>(null);
  const [helpPos, setHelpPos] = useState({ x: 0, y: 0 });

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
    if (!helpMode) { setHelpText(null); return; }
    const onOver = (e: MouseEvent) => {
      const el = (e.target as Element).closest("[data-help]") as HTMLElement | null;
      setHelpText(el?.dataset.help ?? null);
    };
    const onMove = (e: MouseEvent) => setHelpPos({ x: e.clientX + 14, y: e.clientY + 14 });
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mousemove", onMove);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mousemove", onMove);
    };
  }, [helpMode]);

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
      <header className="h-14 border-b border-border bg-card flex items-center px-4 shrink-0 gap-3">
        {/* Logo — hidden on home page (shown in hero), visible on editor pages */}
        {!isHome && (
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_CATEGORY", category: "home" })}
            className="flex items-center gap-2 mr-3 select-none shrink-0 rounded hover:opacity-75 transition-opacity"
            title="Go to Home"
          >
            <div
              onMouseEnter={() => setIconHovered(true)}
              onMouseLeave={() => setIconHovered(false)}
            >
              <AnimatedDodecagramIcon size={28} effectsEnabled={effectsEnabled} externalTrigger={iconTrigger} />
            </div>
            <div
              className="flex items-center overflow-hidden"
              onMouseEnter={() => setIconTrigger((t) => t + 1)}
            >
              <span className="font-bold text-sm tracking-tight">EPE</span>
              <span className={[
                "text-sm font-medium overflow-hidden whitespace-nowrap transition-all duration-300 ease-out text-muted-foreground",
                iconHovered ? "max-w-[180px] opacity-100" : "max-w-0 opacity-0",
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
              <Button
                key={cat.id}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={`gap-2 shrink-0 ${isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`}
                onClick={() => dispatch({ type: "SET_CATEGORY", category: cat.id })}
                data-testid={`tab-${cat.id}`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </Button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setHelpMode((m) => !m)}
          className={[
            "w-8 h-8 rounded flex items-center justify-center transition-colors shrink-0",
            helpMode
              ? "bg-yellow-400/20 text-yellow-500 border border-yellow-400/30"
              : "text-muted-foreground hover:text-foreground hover:bg-accent",
          ].join(" ")}
          title={helpMode ? "Sair do modo ajuda" : "Modo ajuda — passe o mouse sobre elementos para ver descrições"}
        >
          <Search className="w-4 h-4" />
        </button>
        <StylesMenu
          darkMode={darkMode} onDarkMode={setDarkMode}
          effectsEnabled={effectsEnabled} onEffects={setEffectsEnabled}
          isLoggedIn={isLoggedIn} onLogin={handleLogin} onLogout={handleLogout}
        />
      </header>

      {/* ── Body ── */}
      {isHome ? (
        <LandingPage effectsEnabled={effectsEnabled} isLoggedIn={isLoggedIn} />
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
                          data-testid="button-create-doodad" title="New doodad">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setSidebarOpen(false)}
                          className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          data-testid="button-collapse-sidebar" title="Collapse sidebar">
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
                        data-testid="button-create-carpet" title="New carpet">
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
                          data-testid="button-create-item" title="New item">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setSidebarOpen(false)}
                          className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                          data-testid="button-collapse-sidebar" title="Collapse sidebar">
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
                  data-testid="button-expand-sidebar" title="Expand sidebar">
                  <ChevronRight className="w-4 h-4" />
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
          <aside className="w-96 shrink-0">
            <XmlPreview />
          </aside>
        </div>
      )}
      {helpMode && helpText && (
        <div
          className="fixed z-[9999] pointer-events-none px-3 py-2 rounded-lg text-xs font-medium shadow-xl border animate-in fade-in duration-100 bg-yellow-100/95 dark:bg-black/85 text-yellow-900 dark:text-white border-yellow-300/60 dark:border-white/10"
          style={{ left: helpPos.x, top: helpPos.y, maxWidth: 280 }}
        >
          {helpText}
        </div>
      )}
    </div>
  );
}
