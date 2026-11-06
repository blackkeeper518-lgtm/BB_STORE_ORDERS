import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Check,
  Clipboard,
  ClipboardCopy,
  Code2,
  FileCode2,
  FilePlus2,
  Home,
  ImagePlus,
  LockKeyhole,
  LogOut,
  MessageCircle,
  PackageOpen,
  Pencil,
  Search,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";
import Prism from "prismjs";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-java";
import "prismjs/components/prism-markdown";
import ConnectSupabase from "./ConnectSupabase";
import {
  clearSupabaseConfig,
  getActiveCamp,
  getSupabase,
  getSupabaseConfig,
  saveSupabaseConfig,
} from "@/lib/canonical";

type CodeLanguage = "sql" | "java" | "md";
type VaultDoc = {
  id: string;
  title: string;
  language: CodeLanguage;
  note: string;
  code: string;
  updatedAt: string;
};
type GalleryItem = { id: string; src: string; name: string; createdAt: string };
const ROOM_PASSWORD = "1234";
const DOCS_KEY = "nightops-secret-vault-v2";
const IMAGES_KEY = "nightops-secret-gallery-v1";
const SOUND_KEY = "nightops-chat-sound-v1";
type ChatSoundSettings = { enabled: boolean; tone: "ping" | "bell" | "pop"; volume: number };
const DEFAULT_SOUND_SETTINGS: ChatSoundSettings = { enabled: true, tone: "ping", volume: 0.35 };
const languageMeta: Record<
  CodeLanguage,
  { label: string; icon: string; tint: string }
> = {
  sql: { label: "SQL", icon: "▣", tint: "text-cyan-300" },
  java: { label: "Java", icon: "◈", tint: "text-fuchsia-300" },
  md: { label: "Markdown", icon: "#", tint: "text-yellow-300" },
};
const prismLanguage: Record<CodeLanguage, string> = {
  sql: "sql",
  java: "java",
  md: "markdown",
};

const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(
      localStorage.getItem(key) || JSON.stringify(fallback)
    ) as T;
  } catch {
    return fallback;
  }
};

export default function SecretGallery() {
  const [location, setLocation] = useLocation();
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("nightops-gallery-unlocked") === "1"
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const camp = getActiveCamp();
  const connection = getSupabaseConfig(camp);
  const [supabaseUrl, setSupabaseUrl] = useState(connection?.url || "");
  const [supabaseKey, setSupabaseKey] = useState(connection?.anonKey || "");
  const [orderTable, setOrderTable] = useState("🗝️HERMES_ARCHIVE");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connectionBusy, setConnectionBusy] = useState(false);
  const chatConnection = getSupabaseConfig(camp, "chat");
  const [chatUrl, setChatUrl] = useState(chatConnection?.url || "");
  const [chatKey, setChatKey] = useState(chatConnection?.anonKey || "");
  const [chatMessage, setChatMessage] = useState(chatConnection ? "ตั้งค่าไว้ในเครื่องนี้แล้ว" : "");
  const [chatBusy, setChatBusy] = useState(false);
  const parcelConnection = getSupabaseConfig(camp, "parcel");
  const [parcelUrl, setParcelUrl] = useState(parcelConnection?.url || "");
  const [parcelKey, setParcelKey] = useState(parcelConnection?.anonKey || "");
  const [parcelMessage, setParcelMessage] = useState(parcelConnection ? "ตั้งค่าไว้ในเครื่องนี้แล้ว" : "");
  const [parcelBusy, setParcelBusy] = useState(false);
  const [docs, setDocs] = useState<VaultDoc[]>(() => readLocal(DOCS_KEY, []));
  const [images, setImages] = useState<GalleryItem[]>(() =>
    readLocal(IMAGES_KEY, [])
  );
  const [soundSettings, setSoundSettings] = useState<ChatSoundSettings>(() =>
    readLocal(SOUND_KEY, DEFAULT_SOUND_SETTINGS)
  );
  const [activeId, setActiveId] = useState<string | null>(
    () => readLocal<VaultDoc[]>(DOCS_KEY, [])[0]?.id ?? null
  );
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"vault" | "images" | "connect">("vault");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<GalleryItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const [imageMessage, setImageMessage] = useState("");
  const setGalleryView = (next: "vault" | "images" | "connect") => {
    setView(next);
    setLocation(
      next === "images"
        ? "/secret-gallery/images"
        : next === "connect"
          ? "/secret-gallery/connect"
          : "/secret-gallery"
    );
  };
  useEffect(() => {
    setView(
      location === "/secret-gallery/images"
        ? "images"
        : location === "/secret-gallery/connect"
          ? "connect"
          : "vault"
    );
  }, [location]);
  const activeDoc = docs.find(doc => doc.id === activeId) ?? null;
  const highlightedCode = useMemo(() => {
    if (!activeDoc) return "";
    const lang = prismLanguage[activeDoc.language];
    return Prism.highlight(
      activeDoc.code,
      Prism.languages[lang] ?? Prism.languages.plain,
      lang
    );
  }, [activeDoc?.code, activeDoc?.language]);
  const syncEditorScroll = () => {
    const editor = editorRef.current;
    const code = highlightRef.current;
    if (editor && code) {
      code.style.transform = `translate(${-editor.scrollLeft}px, ${-editor.scrollTop}px)`;
    }
  };
  const filteredDocs = useMemo(
    () =>
      docs.filter(doc =>
        `${doc.title} ${doc.note} ${doc.code}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [docs, query]
  );
  useEffect(() => {
    localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  }, [docs]);
  useEffect(() => {
    localStorage.setItem(IMAGES_KEY, JSON.stringify(images));
  }, [images]);
  useEffect(() => {
    localStorage.setItem(SOUND_KEY, JSON.stringify(soundSettings));
  }, [soundSettings]);
  const previewSound = () => {
    if (typeof window === "undefined") return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const frequency = soundSettings.tone === "bell" ? 880 : soundSettings.tone === "pop" ? 520 : 660;
    oscillator.type = soundSettings.tone === "pop" ? "square" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.01, soundSettings.volume), context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (soundSettings.tone === "bell" ? 0.42 : 0.18));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.45);
    window.setTimeout(() => void context.close(), 700);
  };
  const saveConnection = async () => {
    setConnectionBusy(true);
    setConnectionMessage("");
    try {
      const url = supabaseUrl.trim().replace(/\/$/, "");
      const anonKey = supabaseKey.trim();
      const table = orderTable.trim() || "🗝️HERMES_ARCHIVE";
      if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url))
        throw new Error("URL Supabase ไม่ถูกต้อง");
      if (!anonKey) throw new Error("กรุณาใส่ Anon/Publishable Key");
      if (/service_role|secret/i.test(anonKey))
        throw new Error("ห้ามใส่ service-role หรือ secret key ในหน้าเว็บ");
      saveSupabaseConfig({ url, anonKey, orderTable: table }, camp);
      const api = getSupabase();
      if (!api) throw new Error("สร้าง Supabase client ไม่สำเร็จ");
      const { error: queryError } = await api
        .from(table)
        .select("*", { count: "exact", head: true });
      if (queryError) throw queryError;
      setConnectionMessage("เชื่อมต่อแล้ว · บันทึกไว้ในเครื่องนี้");
    } catch (e) {
      setConnectionMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setConnectionBusy(false);
    }
  };
  const saveLaneConnection = async (lane: "chat" | "parcel", urlValue: string, keyValue: string, setBusy: (value: boolean) => void, setMessage: (value: string) => void) => {
    setBusy(true);
    setMessage("");
    try {
      const url = urlValue.trim().replace(/\/$/, "");
      const anonKey = keyValue.trim();
      const label = lane === "chat" ? "Chat" : "Parcel";
      const relations = lane === "chat" ? ["chat_customer_messages", "chat_page_messages"] : ["parcels", "🦅ROGUE_xXx_SHIPPINGz", "📓DEAD_xXx_NOTE"];
      if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) throw new Error(`URL โปรเจกต์ ${label} ไม่ถูกต้อง`);
      if (!anonKey) throw new Error(`กรุณาใส่ Anon/Publishable Key ของ ${label}`);
      if (/service_role|secret/i.test(anonKey)) throw new Error("ห้ามใส่ service-role หรือ secret key ในหน้าเว็บ");
      saveSupabaseConfig({ url, anonKey }, camp, lane);
      const api = getSupabase(lane);
      if (!api) throw new Error(`สร้าง ${label} Supabase client ไม่สำเร็จ`);
      const results = await Promise.all(relations.map(async relation => ({ relation, error: (await api.from(relation).select("*", { count: "exact", head: true })).error })));
      const failed = results.find(result => result.error);
      if (failed?.error) throw new Error(`${failed.relation}: ${failed.error.message}`);
      setMessage(`เชื่อมแล้ว · ตรวจ ${relations.length} จุด`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const clearLaneConnection = (lane: "chat" | "parcel", setUrl: (value: string) => void, setKey: (value: string) => void, setMessage: (value: string) => void) => {
    clearSupabaseConfig(camp, lane);
    setUrl("");
    setKey("");
    setMessage(`ล้าง connection ${lane === "chat" ? "Chat" : "Parcel"} แล้ว · จะ fallback ไป Tracking เดิม`);
  };
  const login = () => {
    if (password === ROOM_PASSWORD) {
      sessionStorage.setItem("nightops-gallery-unlocked", "1");
      setUnlocked(true);
      setPassword("");
      setError("");
    } else setError("รหัสไม่ถูกต้อง");
  };
  const createDoc = (language: CodeLanguage = "sql") => {
    const doc: VaultDoc = {
      id: crypto.randomUUID(),
      title: `ไฟล์ใหม่ · ${languageMeta[language].label}`,
      language,
      note: "เขียนโน้ตอธิบายไฟล์นี้ไว้ตรงนี้",
      code:
        language === "sql"
          ? "-- พิมพ์ SQL ของคุณตรงนี้\n"
          : language === "java"
            ? "// Java playground\n"
            : "# บันทึกโปรเจค\n",
      updatedAt: new Date().toISOString(),
    };
    setDocs(current => [doc, ...current]);
    setActiveId(doc.id);
    setGalleryView("vault");
  };
  const updateActive = (patch: Partial<VaultDoc>) => {
    if (!activeId) return;
    setDocs(current =>
      current.map(doc =>
        doc.id === activeId
          ? { ...doc, ...patch, updatedAt: new Date().toISOString() }
          : doc
      )
    );
  };
  const deleteDoc = (id: string) => {
    if (!window.confirm("ลบไฟล์นี้จากเครื่องนี้ใช่ไหม?")) return;
    setDocs(current => {
      const next = current.filter(doc => doc.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };
  const copyCode = async () => {
    if (!activeDoc) return;
    await navigator.clipboard?.writeText(activeDoc.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  const addFiles = useCallback((files: FileList | File[] | null) => {
    if (!files) return;
    Array.from(files)
      .filter(file => file.type.startsWith("image/"))
      .forEach(file => {
        const reader = new FileReader();
        reader.onload = () =>
          setImages(current => [
            {
              id: crypto.randomUUID(),
              src: String(reader.result),
              name: file.name,
              createdAt: new Date().toISOString(),
            },
            ...current,
          ]);
        reader.readAsDataURL(file);
      });
  }, []);
  useEffect(() => {
    if (view !== "images") return;
    const pasteImages = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.items ?? [])
        .filter(item => item.kind === "file" && item.type.startsWith("image/"))
        .map(item => item.getAsFile())
        .filter((file): file is File => Boolean(file));
      if (!files.length) return;
      event.preventDefault();
      addFiles(files);
      setImageMessage(`${files.length} ภาพถูกวางจากคลิปบอร์ดแล้ว`);
    };
    window.addEventListener("paste", pasteImages);
    return () => window.removeEventListener("paste", pasteImages);
  }, [addFiles, view]);
  const pasteImageFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.read || typeof ClipboardItem === "undefined") {
        throw new Error(
          "เบราว์เซอร์ไม่รองรับวางรูปโดยตรง — ลองวางด้วย Ctrl+V บนหน้าเก็บภาพ"
        );
      }
      const clipboardItems = await navigator.clipboard.read();
      const imageFiles: File[] = [];
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith("image/"));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        imageFiles.push(
          new File(
            [blob],
            `clipboard-${Date.now()}.${imageType.split("/")[1] || "png"}`,
            { type: imageType }
          )
        );
      }
      if (!imageFiles.length) {
        setImageMessage(
          "ยังไม่พบรูปในคลิปบอร์ด — คัดลอกรูปก่อนแล้ววางด้วย Ctrl+V"
        );
        return;
      }
      addFiles(imageFiles);
      setImageMessage(`${imageFiles.length} ภาพถูกวางจากคลิปบอร์ดแล้ว`);
    } catch (e) {
      setImageMessage(
        e instanceof Error
          ? e.message
          : "วางรูปไม่สำเร็จ — ลอง Ctrl+V บนหน้านี้"
      );
    }
  };
  const copyImage = async (item: GalleryItem) => {
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
        throw new Error("เบราว์เซอร์ไม่รองรับการคัดลอกรูป");
      }
      const blob = await (await fetch(item.src)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || "image/png"]: blob }),
      ]);
      setImageMessage(`คัดลอกรูป ${item.name} แล้ว`);
    } catch (e) {
      setImageMessage(e instanceof Error ? e.message : "คัดลอกรูปไม่สำเร็จ");
    }
  };
  if (!unlocked)
    return (
      <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center bg-[#090611] p-4 text-white">
        <Card className="neon-card w-full max-w-md rounded-3xl border-fuchsia-400/30 bg-[#130b1e]">
          <CardHeader className="text-center">
            <LockKeyhole className="mx-auto h-10 w-10 text-cyan-300" />
            <CardTitle className="mt-2 text-2xl text-white">
              DRAKSIDE MARKETING
            </CardTitle>
            <p className="text-sm text-fuchsia-100/55">
              การตลาดที่ไม่แข่งขัน แต่ไม่มีใครตามทัน
            </p>
          </CardHeader>
          <CardContent>
            <Input
              autoFocus
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") login();
              }}
              placeholder="ใส่รหัสห้อง"
              className="border-cyan-400/25 bg-black/35 text-center tracking-[0.3em] text-white"
            />
            {error ? (
              <p className="mt-2 text-center text-xs text-pink-300">{error}</p>
            ) : null}
            <Button
              onClick={login}
              className="mt-4 w-full bg-gradient-to-r from-fuchsia-600 to-violet-700"
            >
              ปลดล็อกห้อง
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="secret-gallery-page cyber-grid h-[100dvh] min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#090611] p-2 text-white sm:p-4 lg:p-6">
      <div className="mx-auto min-w-0 max-w-[1500px] space-y-4">
        <header className="neon-card relative overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-[#130b1e] p-5 sm:p-6">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300">
                <Sparkles className="h-4 w-4" /> DRAKSIDE MARKETING
              </div>
              <h1 className="cyber-title mt-2 text-3xl font-bold text-white sm:text-4xl">
                DRAKSIDE MARKETING
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-fuchsia-100/60">
                การตลาดที่ไม่แข่งขัน แต่ไม่มีใครตามทัน
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setLocation("/orders")}
                variant="outline"
                className="border-cyan-400/30 bg-transparent text-cyan-200"
              >
                <Home className="mr-2 h-4 w-4" />
                หน้าออเดอร์
              </Button>
              <Button
                onClick={() => createDoc("sql")}
                className="bg-gradient-to-r from-fuchsia-600 to-violet-700"
              >
                <FilePlus2 className="mr-2 h-4 w-4" />
                ไฟล์ใหม่
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  sessionStorage.removeItem("nightops-gallery-unlocked");
                  setUnlocked(false);
                }}
                className="border-fuchsia-400/25 bg-transparent text-fuchsia-100"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ล็อกห้อง
              </Button>
            </div>
          </div>
        </header>
        <Card className="neon-card project-room-card rounded-3xl border-cyan-400/20 bg-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-white">
              <LockKeyhole className="h-4 w-4 text-cyan-300" />
              ROOM 01 · ORDER CORE · HERMES / MULTIVERSE / SINGULARITY
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              placeholder="https://ชื่อโปรเจกต์.supabase.co"
              className="border-fuchsia-400/20 bg-black/25 text-white"
            />
            <Input
              type="password"
              value={supabaseKey}
              onChange={e => setSupabaseKey(e.target.value)}
              placeholder="Anon / Publishable Key"
              className="border-fuchsia-400/20 bg-black/25 text-white"
            />
            <Input
              value={orderTable}
              onChange={e => setOrderTable(e.target.value)}
              placeholder="🗝️HERMES_ARCHIVE"
              className="border-fuchsia-400/20 bg-black/25 font-mono text-white"
            />
            <div className="flex items-center gap-2 md:col-span-3">
              <Button
                onClick={() => void saveConnection()}
                disabled={connectionBusy}
                className="bg-gradient-to-r from-fuchsia-600 to-violet-700"
              >
                {connectionBusy ? "กำลังตรวจ…" : "บันทึกและทดสอบการเชื่อมต่อ"}
              </Button>
              <span className="text-xs text-white/50">{connectionMessage}</span>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="group project-room-card relative overflow-hidden rounded-3xl border-cyan-300/35 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,.2),transparent_42%),linear-gradient(135deg,rgba(7,22,47,.98),rgba(11,10,37,.96))] shadow-[0_0_34px_rgba(34,211,238,.16)] transition duration-300 hover:-translate-y-1 hover:border-cyan-200/70 hover:shadow-[0_0_50px_rgba(34,211,238,.3)]">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full border border-cyan-200/20 shadow-[0_0_45px_rgba(34,211,238,.35)]" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-cyan-100"><MessageCircle className="h-5 w-5 text-cyan-300" />ROOM 02 · CHAT CORE · MESSENGER</CardTitle>
              <p className="text-xs leading-5 text-cyan-100/65">แชทและ Page Token อ่านจาก <span className="font-mono text-cyan-200">page_tokens_vault</span> · ไม่ใช่ช่อง Page Token</p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-[11px] text-cyan-100/70">CHAT SUPABASE URL<Input value={chatUrl} onChange={event => setChatUrl(event.target.value)} placeholder="https://chat-project.supabase.co" className="border-cyan-300/25 bg-black/35 text-white placeholder:text-cyan-100/30" /></label>
              <label className="grid gap-1 text-[11px] text-cyan-100/70">CHAT ANON / PUBLISHABLE KEY<Input type="password" value={chatKey} onChange={event => setChatKey(event.target.value)} placeholder="sb_publishable_… หรือ anon key" className="border-cyan-300/25 bg-black/35 font-mono text-white placeholder:text-cyan-100/30" /></label>
              <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                <Button type="button" onClick={() => void saveLaneConnection("chat", chatUrl, chatKey, setChatBusy, setChatMessage)} disabled={chatBusy} className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 text-[#06101e] shadow-[0_0_22px_rgba(34,211,238,.3)] hover:brightness-110">{chatBusy ? "กำลังตรวจ…" : "บันทึก Chat"}</Button>
                <Button type="button" variant="outline" onClick={() => clearLaneConnection("chat", setChatUrl, setChatKey, setChatMessage)} className="border-cyan-300/25 bg-black/20 text-cyan-100 hover:bg-cyan-300/10">ล้าง</Button>
                <span className="text-xs text-cyan-100/70">{chatMessage}</span>
              </div>
              <p className="text-[10px] leading-4 text-cyan-100/45 md:col-span-2">ใส่เฉพาะ Anon/Publishable Key · ห้ามใส่ service-role, secret key หรือ Page Token · ถ้าไม่กรอกจะใช้ Tracking เดิม</p>
            </CardContent>
          </Card>
          <Card className="group project-room-card relative overflow-hidden rounded-3xl border-fuchsia-300/35 bg-[radial-gradient(ellipse_at_top_right,rgba(244,114,182,.2),transparent_42%),linear-gradient(135deg,rgba(35,12,48,.98),rgba(15,9,35,.96))] shadow-[0_0_34px_rgba(217,70,239,.16)] transition duration-300 hover:-translate-y-1 hover:border-fuchsia-200/70 hover:shadow-[0_0_50px_rgba(217,70,239,.3)]">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full border border-fuchsia-200/20 shadow-[0_0_45px_rgba(217,70,239,.35)]" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-fuchsia-100"><PackageOpen className="h-5 w-5 text-fuchsia-300" />ROOM 03 · PARCEL RETURN · SHIPPING</CardTitle>
              <p className="text-xs leading-5 text-fuchsia-100/65">พัสดุ คิวจับคู่ และประวัติส่งเลข · แยกจากฐานแชทและฐานออเดอร์</p>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-[11px] text-fuchsia-100/70">PARCEL SUPABASE URL<Input value={parcelUrl} onChange={event => setParcelUrl(event.target.value)} placeholder="https://parcel-project.supabase.co" className="border-fuchsia-300/25 bg-black/35 text-white placeholder:text-fuchsia-100/30" /></label>
              <label className="grid gap-1 text-[11px] text-fuchsia-100/70">PARCEL ANON / PUBLISHABLE KEY<Input type="password" value={parcelKey} onChange={event => setParcelKey(event.target.value)} placeholder="sb_publishable_… หรือ anon key" className="border-fuchsia-300/25 bg-black/35 font-mono text-white placeholder:text-fuchsia-100/30" /></label>
              <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                <Button type="button" onClick={() => void saveLaneConnection("parcel", parcelUrl, parcelKey, setParcelBusy, setParcelMessage)} disabled={parcelBusy} className="bg-gradient-to-r from-fuchsia-500 via-violet-600 to-indigo-600 text-white shadow-[0_0_22px_rgba(217,70,239,.3)] hover:brightness-110">{parcelBusy ? "กำลังตรวจ…" : "บันทึก Parcel"}</Button>
                <Button type="button" variant="outline" onClick={() => clearLaneConnection("parcel", setParcelUrl, setParcelKey, setParcelMessage)} className="border-fuchsia-300/25 bg-black/20 text-fuchsia-100 hover:bg-fuchsia-300/10">ล้าง</Button>
                <span className="text-xs text-fuchsia-100/70">{parcelMessage}</span>
              </div>
              <p className="text-[10px] leading-4 text-fuchsia-100/45 md:col-span-2">ใส่เฉพาะ Anon/Publishable Key · ห้ามใส่ service-role หรือ secret key · ถ้าไม่กรอกจะใช้ Tracking เดิม</p>
            </CardContent>
          </Card>
        </div>
        <Card className="neon-card rounded-3xl border-fuchsia-400/20 bg-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-white"><span className="text-lg">🔔</span> LOCAL VAULT · AUTOSAVE · เสียงแจ้งเตือนแชท</CardTitle>
            <p className="text-xs text-fuchsia-100/50">ตั้งค่าเก็บไว้ในเครื่องนี้เท่านั้น ไม่ส่งไป Supabase</p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[auto_1fr_1fr_auto] md:items-center">
            <label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={soundSettings.enabled} onChange={event => setSoundSettings(current => ({ ...current, enabled: event.target.checked }))} className="h-4 w-4 accent-fuchsia-500" /> เปิดเสียง</label>
            <label className="grid gap-1 text-xs text-fuchsia-100/60">โทนเสียง<select value={soundSettings.tone} onChange={event => setSoundSettings(current => ({ ...current, tone: event.target.value as ChatSoundSettings["tone"] }))} className="h-9 rounded-lg border border-fuchsia-400/20 bg-[#160d22] px-2 text-sm text-white"><option value="ping">Ping · ใส</option><option value="bell">Bell · กังวาน</option><option value="pop">Pop · สั้น</option></select></label>
            <label className="grid gap-1 text-xs text-fuchsia-100/60">ระดับเสียง · {Math.round(soundSettings.volume * 100)}%<input type="range" min="0.05" max="1" step="0.05" value={soundSettings.volume} onChange={event => setSoundSettings(current => ({ ...current, volume: Number(event.target.value) }))} className="accent-cyan-400" /></label>
            <Button type="button" variant="outline" onClick={previewSound} className="border-cyan-400/25 text-cyan-200">ทดสอบเสียง</Button>
          </CardContent>
        </Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setGalleryView("vault")}
              variant="outline"
              className={
                view === "vault"
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                  : "border-white/10 bg-transparent text-white/60"
              }
            >
              <Code2 className="mr-2 h-4 w-4" />
              CODE VAULT · {docs.length}
            </Button>
            <Button
              onClick={() => setGalleryView("images")}
              variant="outline"
              className={
                view === "images"
                  ? "border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200"
                  : "border-white/10 bg-transparent text-white/60"
              }
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              ภาพอ้างอิง · {images.length}
            </Button>
            <Button
              onClick={() => setGalleryView("connect")}
              variant="outline"
              className={
                view === "connect"
                  ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                  : "border-white/10 bg-transparent text-white/60"
              }
            >
              <LockKeyhole className="mr-2 h-4 w-4" />
              ฐานค่าย · ตั้งค่าการเชื่อมต่อ
            </Button>
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200/45">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />{" "}
            LOCAL VAULT · AUTOSAVE
          </div>
        </div>
        {view === "connect" ? (
          <ConnectSupabase />
        ) : view === "images" ? (
          <Card className="neon-card rounded-3xl border-fuchsia-500/20 bg-[#100817]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base text-white">
                กล่องเก็บภาพ · {images.length} ภาพ
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => void pasteImageFromClipboard()}
                  className="border-cyan-400/30 bg-transparent text-cyan-100"
                >
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  วางภาพจากคลิปบอร์ด
                </Button>
                <Button
                  onClick={() => inputRef.current?.click()}
                  className="bg-gradient-to-r from-fuchsia-600 to-violet-700"
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  เพิ่มรูป
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => {
                    addFiles(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-white/40">
                กด “วางภาพจากคลิปบอร์ด” หรือกด Ctrl+V เพื่อเก็บภาพทันที ·
                คลิกไอคอนคัดลอกใต้รูปเพื่อคัดลอกรูปไปใช้
              </p>
              {imageMessage ? (
                <p role="status" className="mb-3 text-xs text-cyan-200">
                  {imageMessage}
                </p>
              ) : null}
              {images.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {images.map(item => (
                    <div
                      key={item.id}
                      className="group overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-black/20"
                    >
                      <button
                        type="button"
                        onClick={() => setPreview(item)}
                        className="block aspect-[4/3] w-full overflow-hidden"
                      >
                        <img
                          src={item.src}
                          alt={item.name}
                          className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                        />
                      </button>
                      <div className="flex items-center justify-between gap-2 p-2">
                        <p className="truncate text-[10px] text-fuchsia-100/65">
                          {item.name}
                        </p>
                        <button
                          type="button"
                          title="คัดลอกรูป"
                          aria-label={`คัดลอกรูป ${item.name}`}
                          onClick={() => void copyImage(item)}
                          className="shrink-0 text-cyan-200/75 hover:text-cyan-100"
                        >
                          <ClipboardCopy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setImages(current =>
                              current.filter(x => x.id !== item.id)
                            )
                          }
                          className="text-pink-300/70"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<ImagePlus />} text="ยังไม่มีภาพอ้างอิง" />
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid min-h-[620px] gap-4 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
            <Card className="neon-card overflow-hidden rounded-3xl border-fuchsia-500/20 bg-[#100817]">
              <CardHeader className="border-b border-white/5 p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-white">
                    FILES / NOTES
                  </CardTitle>
                  <button
                    type="button"
                    onClick={() => createDoc("sql")}
                    className="rounded-lg p-2 text-cyan-300 hover:bg-cyan-500/10"
                  >
                    <FilePlus2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative mt-3">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/30" />
                  <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="ค้นหาไฟล์..."
                    className="h-9 border-white/10 bg-black/25 pl-9 text-xs text-white"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[540px] space-y-2 overflow-auto p-3">
                {filteredDocs.length ? (
                  filteredDocs.map(doc => (
                    <button
                      key={doc.id}
                      type="button"
                      draggable
                      onDragStart={e => {
                        setDraggedDocId(doc.id);
                        e.dataTransfer.setData("text/plain", doc.id);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onDragEnd={() => setDraggedDocId(null)}
                      onClick={() => setActiveId(doc.id)}
                      className={`w-full rounded-2xl border p-3 text-left transition ${activeId === doc.id ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/5 bg-black/15 hover:border-fuchsia-400/30"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-mono text-[10px] font-bold ${languageMeta[doc.language].tint}`}
                        >
                          {languageMeta[doc.language].icon}{" "}
                          {languageMeta[doc.language].label}
                        </span>
                        <span className="text-[9px] text-white/25">
                          {new Date(doc.updatedAt).toLocaleDateString("th-TH")}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-white/85">
                        {doc.title}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-white/35">
                        {doc.note}
                      </p>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    icon={<FileCode2 />}
                    text="ยังไม่มีไฟล์ · กด + เพื่อสร้าง"
                  />
                )}
              </CardContent>
            </Card>
            <Card className="neon-card overflow-hidden rounded-3xl border-fuchsia-500/20 bg-[#0e0715]">
              <CardHeader className="border-b border-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Pencil className="h-4 w-4 shrink-0 text-cyan-300" />
                    <Input
                      value={activeDoc?.title ?? "ยังไม่ได้เลือกไฟล์"}
                      onChange={e => updateActive({ title: e.target.value })}
                      className="h-9 min-w-0 border-white/10 bg-black/20 text-sm font-semibold text-white"
                      disabled={!activeDoc}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSaved(true);
                        window.setTimeout(() => setSaved(false), 1400);
                      }}
                      disabled={!activeDoc}
                      className="h-9 bg-gradient-to-r from-fuchsia-600 to-violet-700"
                    >
                      {saved ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {saved ? "บันทึกแล้ว" : "บันทึก"}
                    </Button>
                    <Button
                      onClick={copyCode}
                      disabled={!activeDoc}
                      variant="outline"
                      className="h-9 border-white/10 bg-transparent text-white"
                    >
                      {copied ? (
                        <Check className="mr-2 h-4 w-4 text-emerald-300" />
                      ) : (
                        <Clipboard className="mr-2 h-4 w-4" />
                      )}
                      {copied ? "คัดลอกแล้ว" : "คัดลอก"}
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <select
                    value={activeDoc?.language ?? "sql"}
                    onChange={e =>
                      updateActive({ language: e.target.value as CodeLanguage })
                    }
                    disabled={!activeDoc}
                    className="h-8 rounded-lg border border-fuchsia-400/25 bg-black/35 px-3 font-mono text-xs text-fuchsia-200 outline-none"
                  >
                    <option value="sql">SQL</option>
                    <option value="java">Java</option>
                    <option value="md">Markdown</option>
                  </select>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                    ลากรายการซ้ายไปเก็บที่ภาพอ้างอิง · autosave local
                  </span>
                </div>
              </CardHeader>
              {activeDoc ? (
                <CardContent className="space-y-3 p-4">
                  <textarea
                    value={activeDoc.note}
                    onChange={e => updateActive({ note: e.target.value })}
                    placeholder="โน้ตอธิบายไฟล์นี้..."
                    className="min-h-16 w-full resize-y rounded-xl border border-fuchsia-400/15 bg-fuchsia-500/[0.04] p-3 text-sm text-fuchsia-100/75 outline-none focus:border-cyan-400/50"
                  />
                  <div className="code-shell min-w-0 overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#08050e]">
                    <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-4 py-2">
                      <span className="font-mono text-[10px] text-cyan-300">
                        {languageMeta[activeDoc.language].icon}{" "}
                        {languageMeta[activeDoc.language].label} · LIVE EDITOR
                      </span>
                      <span className="text-[10px] text-white/25">
                        {activeDoc.code.split("\n").length} lines ·
                        เลื่อนแนวตั้ง/แนวนอนได้
                      </span>
                    </div>
                    <div className="code-editor relative h-[62vh] min-h-[360px] max-h-[680px] min-w-0 overflow-hidden">
                      <pre
                        aria-hidden="true"
                        ref={highlightRef}
                        className="code-highlight pointer-events-none absolute left-0 top-0 m-0 min-h-full min-w-full whitespace-pre p-4 font-mono text-[12px] leading-6"
                      >
                        <code
                          className={`language-${prismLanguage[activeDoc.language]}`}
                          dangerouslySetInnerHTML={{
                            __html: highlightedCode || "\u200b",
                          }}
                        />
                      </pre>
                      <textarea
                        ref={editorRef}
                        aria-label={`แก้ไขโค้ด ${activeDoc.title}`}
                        spellCheck={false}
                        wrap="off"
                        value={activeDoc.code}
                        onScroll={syncEditorScroll}
                        onChange={e => updateActive({ code: e.target.value })}
                        className="code-input absolute inset-0 m-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent p-4 font-mono text-[12px] leading-6 outline-none selection:bg-fuchsia-400/30"
                      />
                    </div>
                  </div>
                </CardContent>
              ) : (
                <EmptyState
                  icon={<Code2 />}
                  text="เลือกไฟล์ทางซ้าย หรือสร้างไฟล์ใหม่"
                />
              )}
            </Card>
            <Card className="neon-card rounded-3xl border-fuchsia-500/20 bg-[#100817]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-white">
                  <FileCode2 className="h-4 w-4 text-cyan-300" />
                  VAULT CONTROL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs text-white/55">
                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.04] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">
                    ACTIVE FILE
                  </p>
                  <p className="mt-2 truncate text-base font-semibold text-white">
                    {activeDoc?.title ?? "—"}
                  </p>
                  <p className="mt-1 text-white/35">
                    {activeDoc
                      ? `${languageMeta[activeDoc.language].label} · ${activeDoc.code.length.toLocaleString()} chars`
                      : "ยังไม่ได้เลือก"}
                  </p>
                </div>
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/30">
                    QUICK CREATE
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["sql", "java", "md"] as CodeLanguage[]).map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => createDoc(lang)}
                        className="rounded-xl border border-white/10 bg-black/20 p-3 font-mono text-xs text-cyan-200 hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10"
                      >
                        {languageMeta[lang].icon} {languageMeta[lang].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-pink-400/20 bg-pink-500/[0.04] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-pink-300">
                    DANGER ZONE
                  </p>
                  <Button
                    onClick={() => activeId && deleteDoc(activeId)}
                    disabled={!activeDoc}
                    variant="outline"
                    className="mt-3 w-full border-pink-400/25 bg-transparent text-pink-200"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    ลบไฟล์นี้
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {preview ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white"
            onClick={() => setPreview(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={preview.src}
            alt={preview.name}
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-500/20 p-6 text-center text-xs text-white/35">
      {icon}
      <span className="mt-2">{text}</span>
    </div>
  );
}
