import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Check,
  Clipboard,
  ClipboardCopy,
  Code2,
  FileCode2,
  FilePlus2,
  Facebook,
  Home,
  ImagePlus,
  LockKeyhole,
  LogOut,
  MessageCircle,
  PackageOpen,
  Palette,
  Pencil,
  Play,
  Search,
  Save,
  Sparkles,
  Trash2,
  Volume2,
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
import { ServerProjectConnection } from "@/components/ServerProjectConnection";
import { getActiveCamp, getSupabase } from "@/lib/canonical";
import { trpc } from "@/lib/trpc";
import { CHAT_NOTIFICATION_SETTINGS_EVENT, readChatNotificationPageSettings, readChatNotificationPageSounds, setChatNotificationPageEnabled, setChatNotificationPageSound } from "@/lib/chat-notifications";
import { CyberFrameVault } from "@/components/CyberFrameVault";
import { CustomizationAdmin } from "@/components/CustomizationAdmin";

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
type ChatSoundSettings = { enabled: boolean; tone: "ping" | "bell" | "pop"; volume: number; soundKey?: string };
type SoundRow = { sound_key: string; name: string; event_type: string; storage_bucket: string | null; storage_path: string | null; mime_type: string | null; volume: number | null; is_enabled: boolean };
type LineChannelRow = { id: number; channel_id: string; channel_name: string; oa_id: string; is_active: boolean; status?: string | null; status_web?: string | null; hasToken?: boolean };
type FacebookPageRow = { pageId: string; pageName: string; status?: string | null; statusWeb?: string | null; enabledMobile: boolean; enabledWeb: boolean };
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
  const [notificationPageSettings, setNotificationPageSettings] = useState(() => readChatNotificationPageSettings());
  const [notificationPageSounds, setNotificationPageSounds] = useState(() => readChatNotificationPageSounds());
  useEffect(() => {
    const refreshNotificationPageSettings = () => {
      setNotificationPageSettings(readChatNotificationPageSettings());
      setNotificationPageSounds(readChatNotificationPageSounds());
    };
    window.addEventListener("storage", refreshNotificationPageSettings);
    window.addEventListener(CHAT_NOTIFICATION_SETTINGS_EVENT, refreshNotificationPageSettings);
    return () => { window.removeEventListener("storage", refreshNotificationPageSettings); window.removeEventListener(CHAT_NOTIFICATION_SETTINGS_EVENT, refreshNotificationPageSettings); };
  }, []);
  const [docs, setDocs] = useState<VaultDoc[]>(() => readLocal(DOCS_KEY, []));
  const [images, setImages] = useState<GalleryItem[]>(() =>
    readLocal(IMAGES_KEY, [])
  );
  const [soundSettings, setSoundSettings] = useState<ChatSoundSettings>(() =>
    readLocal(SOUND_KEY, DEFAULT_SOUND_SETTINGS)
  );
  const [soundFile, setSoundFile] = useState<File | null>(null);
  const [soundName, setSoundName] = useState("");
  const [soundEvent, setSoundEvent] = useState<"new_message" | "message_sent" | "message_failed" | "new_order" | "custom">("custom");
  const [soundUploadMessage, setSoundUploadMessage] = useState("");
  const [soundRows, setSoundRows] = useState<SoundRow[]>([]);
  const [selectedSoundKey, setSelectedSoundKey] = useState("");
  const [soundListBusy, setSoundListBusy] = useState(false);
  const [lineForm, setLineForm] = useState<{ id?: number; channelId: string; channelName: string; oaId: string; accessToken: string; channelSecret: string; isActive: boolean; isWebActive: boolean }>({ channelId: "", channelName: "", oaId: "", accessToken: "", channelSecret: "", isActive: true, isWebActive: true });
  const [lineMessage, setLineMessage] = useState("");
  const [facebookForm, setFacebookForm] = useState<{ pageId: string; pageName: string; accessToken: string; enabledMobile: boolean; enabledWeb: boolean }>({ pageId: "", pageName: "", accessToken: "", enabledMobile: true, enabledWeb: true });
  const [facebookMessage, setFacebookMessage] = useState("");
  const lineChannelsQuery = trpc.line.channels.useQuery(undefined, { enabled: unlocked, retry: false });
  const saveLineChannel = trpc.line.saveChannel.useMutation({ onSuccess: () => { setLineMessage("บันทึก LINE OA แล้ว"); setLineForm({ channelId: "", channelName: "", oaId: "", accessToken: "", channelSecret: "", isActive: true, isWebActive: true }); void lineChannelsQuery.refetch(); }, onError: error => setLineMessage(error.message) });
  const toggleLineChannel = trpc.line.toggleChannel.useMutation({ onSuccess: () => void lineChannelsQuery.refetch(), onError: error => setLineMessage(error.message) });
  const deleteLineChannel = trpc.line.deleteChannel.useMutation({ onSuccess: () => { setLineMessage("ลบ LINE OA แล้ว"); void lineChannelsQuery.refetch(); }, onError: error => setLineMessage(error.message) });
  const facebookPagesQuery = trpc.chat.pages.useQuery(undefined, { enabled: unlocked, retry: false });
  const setFacebookAppStatus = trpc.chat.setPageAppStatus.useMutation({ onSuccess: () => void facebookPagesQuery.refetch() });
  const setFacebookWebStatus = trpc.chat.setPageWebStatus.useMutation({ onSuccess: () => void facebookPagesQuery.refetch() });
  const saveFacebookPage = trpc.chat.savePage.useMutation({ onSuccess: () => { setFacebookMessage("บันทึก Facebook Page แล้ว"); setFacebookForm({ pageId: "", pageName: "", accessToken: "", enabledMobile: true, enabledWeb: true }); void facebookPagesQuery.refetch(); }, onError: error => setFacebookMessage(error.message) });
  const deleteFacebookPage = trpc.chat.deletePage.useMutation({ onSuccess: () => { setFacebookMessage("ลบ Facebook Page แล้ว"); void facebookPagesQuery.refetch(); }, onError: error => setFacebookMessage(error.message) });
  const soundFileRef = useRef<HTMLInputElement>(null);
  const [activeId, setActiveId] = useState<string | null>(
    () => readLocal<VaultDoc[]>(DOCS_KEY, [])[0]?.id ?? null
  );
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"vault" | "images" | "connect" | "cyber" | "theme" | "sound">("theme");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<GalleryItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const [imageMessage, setImageMessage] = useState("");
  const setGalleryView = (next: "vault" | "images" | "connect" | "cyber" | "theme" | "sound") => {
    setView(next);
    setLocation(
      next === "images"
        ? "/secret-gallery/images"
        : next === "connect"
          ? "/secret-gallery/connect"
          : next === "cyber"
            ? "/secret-gallery?tab=cyber-frames"
            : next === "theme"
              ? "/secret-gallery?tab=theme"
              : next === "sound"
                ? "/secret-gallery?tab=sound"
                : "/secret-gallery"
    );
  };
  useEffect(() => {
    setView(
        location === "/secret-gallery/images"
          ? "images"
        : location === "/secret-gallery/connect"
          ? "connect"
          : location.includes("tab=cyber-frames")
            ? "cyber"
            : location.includes("tab=theme")
              ? "theme"
              : location.includes("tab=sound")
                ? "sound"
                : "theme"
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
  useEffect(() => {
    localStorage.setItem(SOUND_KEY, JSON.stringify({ ...soundSettings, soundKey: selectedSoundKey || undefined }));
  }, [selectedSoundKey, soundSettings]);
  const loadSoundRows = useCallback(async (chooseDefault = false) => {
    const api = getSupabase("vault");
    if (!api) return;
    setSoundListBusy(true);
    const result = await api.from("app_sounds").select("sound_key,name,event_type,storage_bucket,storage_path,mime_type,volume,is_enabled").eq("is_enabled", true).order("sort_order", { ascending: true });
    if (!result.error) {
      const nextRows = (result.data ?? []) as SoundRow[];
      setSoundRows(nextRows);
      if (chooseDefault) setSelectedSoundKey(current => current && nextRows.some(row => row.sound_key === current) ? current : nextRows[0]?.sound_key ?? "");
    }
    setSoundListBusy(false);
  }, []);
  useEffect(() => { if ((view === "sound" || view === "connect") && unlocked) void loadSoundRows(view === "sound"); }, [loadSoundRows, view, unlocked]);
  const uploadSoundFile = async () => {
    const file = soundFile;
    if (!file) { setSoundUploadMessage("เลือกไฟล์เสียงก่อนครับ"); return; }
    if (!file.type.startsWith("audio/")) { setSoundUploadMessage("รองรับเฉพาะไฟล์เสียงเท่านั้น"); return; }
    if (file.size > 18_000_000) { setSoundUploadMessage("ไฟล์เสียงต้องไม่เกิน 18 MB"); return; }
    const api = getSupabase("vault");
    const name = soundName.trim() || file.name.replace(/\.[^.]+$/, "");
    const safeName = name.toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "custom-sound";
    const extension = file.name.split(".").pop()?.toLowerCase() || "audio";
    const storagePath = `sounds/${Date.now()}-${safeName}.${extension}`;
    setSoundUploadMessage("กำลังโยนไฟล์เสียง…");
    try {
      const upload = await api.storage.from("chat-sounds").upload(storagePath, file, { contentType: file.type, upsert: false });
      if (upload.error) throw upload.error;
      const soundKey = `sound-${safeName}-${Date.now()}`;
      const insert = await api.from("app_sounds").insert({ sound_key: soundKey, name, description: `อัปโหลดจาก Secret Gallery · ${file.name}`, event_type: soundEvent, storage_bucket: "chat-sounds", storage_path: storagePath, mime_type: file.type, volume: soundSettings.volume, is_enabled: true, sort_order: 100 });
      if (insert.error) { await api.storage.from("chat-sounds").remove([storagePath]); throw insert.error; }
      setSoundUploadMessage(`บันทึกแล้ว · ${name}`);
      setSoundFile(null); setSoundName("");
      if (soundFileRef.current) soundFileRef.current.value = "";
      await loadSoundRows(true);
    } catch (error) {
      setSoundUploadMessage(`โยนไฟล์ไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const previewSound = async () => {
    const selected = soundRows.find(row => row.sound_key === selectedSoundKey);
    if (!selected?.storage_path) { setSoundUploadMessage("ยังไม่มีไฟล์เสียงจริงให้ทดลองเล่น"); return; }
    const api = getSupabase("vault");
    if (!api) return;
    const bucket = selected.storage_bucket || "chat-sounds";
    const signed = await api.storage.from(bucket).createSignedUrl(selected.storage_path, 3600);
    if (signed.error || !signed.data?.signedUrl) { setSoundUploadMessage(`เปิดเสียงไม่สำเร็จ: ${signed.error?.message || "หาไฟล์ไม่เจอ"}`); return; }
    const audio = new Audio(signed.data.signedUrl);
    audio.volume = Math.max(0, Math.min(1, Number(selected.volume ?? soundSettings.volume)));
    await audio.play();
  };
  const editLineChannel = (row: LineChannelRow) => setLineForm({ id: row.id, channelId: row.channel_id, channelName: row.channel_name, oaId: row.oa_id, accessToken: "", channelSecret: "", isActive: row.is_active, isWebActive: String(row.status_web ?? "ON").toUpperCase() !== "OFF" });
  const submitLineChannel = () => { setLineMessage(""); saveLineChannel.mutate(lineForm); };
  const editFacebookPage = (page: FacebookPageRow) => setFacebookForm({ pageId: page.pageId, pageName: page.pageName, accessToken: "", enabledMobile: page.enabledMobile, enabledWeb: page.enabledWeb });
  const submitFacebookPage = () => { setFacebookMessage(""); saveFacebookPage.mutate(facebookForm); };
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
              <h1 onDoubleClick={() => setGalleryView("connect")} title="DRAKSIDE" className="cyber-title mt-2 cursor-default select-none text-3xl font-bold text-white sm:text-4xl">
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
        {view === "connect" ? <>
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rose-300/10 pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-rose-300/75">CHANNEL CONTROL · LINE / META</p>
              <h2 className="mt-1 text-lg font-semibold text-white">จัดการช่องทางแชท</h2>
              <p className="mt-1 text-xs text-white/50">ตั้งค่า LINE OA และสถานะ Facebook แยกจากการเชื่อมฐานข้อมูล</p>
            </div>
            <span className="rounded-full border border-rose-300/20 bg-rose-400/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-rose-200/70">LINE OA · FACEBOOK</span>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="project-room-card relative h-full min-w-0 overflow-hidden rounded-3xl border border-rose-300/20 bg-[#100a12] shadow-[0_18px_55px_rgba(0,0,0,.35)] transition duration-300 hover:-translate-y-0.5 hover:border-rose-300/45">
              <CardHeader className="border-b border-rose-300/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-rose-100"><MessageCircle className="h-5 w-5 text-lime-300" />LINE OA MANAGER · หลายบัญชี</CardTitle>
                <p className="text-xs leading-5 text-lime-100/65">เพิ่ม แก้ไข ทดสอบ เปิด/ปิด และลบ LINE OA จากหน้าเว็บได้เลย · Token และ Secret ไม่ถูกส่งกลับมาแสดงเต็มหลังบันทึก</p>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1 text-[11px] text-lime-100/70">ชื่อ OA<Input value={lineForm.channelName} onChange={event => setLineForm(current => ({ ...current, channelName: event.target.value }))} placeholder="เช่น SINGTO_ORDER" className="border-lime-300/25 bg-black/35 text-white" /></label>
                  <label className="grid gap-1 text-[11px] text-lime-100/70">Channel ID<Input value={lineForm.channelId} onChange={event => setLineForm(current => ({ ...current, channelId: event.target.value }))} placeholder="2012666328" className="border-lime-300/25 bg-black/35 font-mono text-white" /></label>
                  <label className="grid gap-1 text-[11px] text-lime-100/70">OA ID<Input value={lineForm.oaId} onChange={event => setLineForm(current => ({ ...current, oaId: event.target.value }))} placeholder="U..." className="border-lime-300/25 bg-black/35 font-mono text-white" /></label>
                  <label className="grid gap-1 text-[11px] text-lime-100/70 md:col-span-2">Channel Access Token<Input type="password" autoComplete="new-password" value={lineForm.accessToken} onChange={event => setLineForm(current => ({ ...current, accessToken: event.target.value }))} placeholder={lineForm.id ? "เว้นว่างเพื่อใช้ค่าเดิม" : "วาง Channel Access Token"} className="border-lime-300/25 bg-black/35 font-mono text-white" /></label>
                  <label className="grid gap-1 text-[11px] text-lime-100/70">Channel Secret<Input type="password" autoComplete="new-password" value={lineForm.channelSecret} onChange={event => setLineForm(current => ({ ...current, channelSecret: event.target.value }))} placeholder={lineForm.id ? "เว้นว่างเพื่อใช้ค่าเดิม" : "วาง Channel Secret"} className="border-lime-300/25 bg-black/35 font-mono text-white" /></label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-lime-100/70"><input type="checkbox" checked={lineForm.isActive} onChange={event => setLineForm(current => ({ ...current, isActive: event.target.checked }))} className="accent-lime-400" /> เปิดใช้งาน</label><label className="flex items-center gap-2 text-xs text-emerald-100/70"><input type="checkbox" checked={lineForm.isWebActive} onChange={event => setLineForm(current => ({ ...current, isWebActive: event.target.checked }))} className="accent-emerald-400" /> เว็บ ON</label>
                  <Button type="button" onClick={submitLineChannel} disabled={saveLineChannel.isPending} className="bg-lime-400 text-black hover:bg-lime-300">{saveLineChannel.isPending ? "กำลังบันทึก…" : lineForm.id ? "บันทึกการแก้ไข" : "เพิ่ม LINE OA"}</Button>
                  {lineForm.id ? <Button type="button" variant="outline" onClick={() => setLineForm({ channelId: "", channelName: "", oaId: "", accessToken: "", channelSecret: "", isActive: true, isWebActive: true })} className="border-lime-300/25 text-lime-100">ยกเลิกแก้ไข</Button> : null}
                  <span className="text-xs text-lime-100/70">{lineMessage}</span>
                </div>
                {lineChannelsQuery.isError ? <p className="rounded-xl border border-red-300/25 bg-red-400/10 p-3 text-xs text-red-200">โหลดรายการ LINE ไม่สำเร็จ: {lineChannelsQuery.error.message}</p> : null}
                <div className="grid gap-2">
                  {(lineChannelsQuery.data as LineChannelRow[] | undefined)?.map(row => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lime-300/15 bg-black/20 p-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-lime-100">{row.channel_name} <span className="ml-2 rounded-full bg-lime-400/15 px-2 py-0.5 text-[10px] text-lime-200">{row.is_active ? "ON" : "OFF"}</span></p><p className="mt-1 truncate font-mono text-[10px] text-lime-100/55">Channel {row.channel_id} · OA {row.oa_id} · แอป {row.is_active ? "ON" : "OFF"} · เว็บ {String(row.status_web ?? "ON").toUpperCase() === "OFF" ? "OFF" : "ON"} · Token {row.hasToken ? "บันทึกแล้ว" : "ยังไม่มี"}</p></div>
                    <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => editLineChannel(row)} className="border-lime-300/25 text-lime-100">แก้ไข</Button><Button type="button" size="sm" variant="outline" onClick={() => toggleLineChannel.mutate({ id: row.id, isActive: !row.is_active, scope: "app" })} className="border-cyan-300/25 text-cyan-100">{row.is_active ? "แอป ON" : "แอป OFF"}</Button><Button type="button" size="sm" variant="outline" onClick={() => toggleLineChannel.mutate({ id: row.id, isActive: String(row.status_web ?? "ON").toUpperCase() === "OFF", scope: "web" })} className="border-emerald-300/25 text-emerald-100">{String(row.status_web ?? "ON").toUpperCase() === "OFF" ? "เว็บ OFF" : "เว็บ ON"}</Button><Button type="button" size="sm" variant="outline" onClick={() => { if (window.confirm(`ลบ ${row.channel_name} หรือไม่`)) deleteLineChannel.mutate({ id: row.id }); }} className="border-red-300/25 text-red-200"><Trash2 className="mr-1 h-3.5 w-3.5" />ลบ</Button></div>
                  </div>)}
                  {!lineChannelsQuery.isLoading && !lineChannelsQuery.data?.length ? <p className="rounded-xl border border-lime-300/10 p-4 text-center text-xs text-lime-100/50">ยังไม่มี LINE OA ในระบบ</p> : null}
                </div>
              </CardContent>
            </Card>
            <Card className="project-room-card relative h-full min-w-0 overflow-hidden rounded-3xl border border-rose-300/20 bg-[#100a12] shadow-[0_18px_55px_rgba(0,0,0,.35)] transition duration-300 hover:-translate-y-0.5 hover:border-rose-300/45">
              <CardHeader className="border-b border-rose-300/10 pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-rose-100"><Facebook className="h-5 w-5 text-blue-300" />FACEBOOK PAGE MANAGER · WEB / NOTIFICATIONS</CardTitle>
                <p className="text-xs leading-5 text-blue-100/65">ตั้งค่าแอปและเว็บแยกกัน · ปิดแจ้งเตือนได้โดยไม่ซ่อนเพจ และเลือกเสียงแยกแต่ละเพจได้ · ค่านี้บันทึกไว้ใน browser นี้</p>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-1 text-[11px] text-blue-100/70">Page ID<Input value={facebookForm.pageId} onChange={event => setFacebookForm(current => ({ ...current, pageId: event.target.value }))} placeholder="Facebook Page ID" className="border-blue-300/25 bg-black/35 font-mono text-white" /></label>
                  <label className="grid gap-1 text-[11px] text-blue-100/70">ชื่อเพจ<Input value={facebookForm.pageName} onChange={event => setFacebookForm(current => ({ ...current, pageName: event.target.value }))} placeholder="ชื่อเพจ Facebook" className="border-blue-300/25 bg-black/35 text-white" /></label>
                  <label className="grid gap-1 text-[11px] text-blue-100/70 md:col-span-2">Page Access Token<Input type="password" autoComplete="new-password" value={facebookForm.accessToken} onChange={event => setFacebookForm(current => ({ ...current, accessToken: event.target.value }))} placeholder={facebookForm.pageId ? "เว้นว่างเพื่อใช้ Token เดิม" : "วาง Page Access Token"} className="border-blue-300/25 bg-black/35 font-mono text-white" /></label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-cyan-100/75"><input type="checkbox" checked={facebookForm.enabledMobile} onChange={event => setFacebookForm(current => ({ ...current, enabledMobile: event.target.checked }))} className="accent-cyan-400" /> แอป ON</label>
                  <label className="flex items-center gap-2 text-xs text-emerald-100/75"><input type="checkbox" checked={facebookForm.enabledWeb} onChange={event => setFacebookForm(current => ({ ...current, enabledWeb: event.target.checked }))} className="accent-emerald-400" /> เว็บ ON</label>
                  <Button type="button" onClick={submitFacebookPage} disabled={saveFacebookPage.isPending} className="bg-blue-500 text-white hover:bg-blue-400">{saveFacebookPage.isPending ? "กำลังบันทึก…" : facebookForm.pageId && (facebookPagesQuery.data ?? []).some(page => page.pageId === facebookForm.pageId) ? "บันทึกการแก้ไข" : "เพิ่ม Facebook Page"}</Button>
                  {facebookForm.pageId ? <Button type="button" variant="outline" onClick={() => setFacebookForm({ pageId: "", pageName: "", accessToken: "", enabledMobile: true, enabledWeb: true })} className="border-blue-300/25 text-blue-100">ยกเลิกแก้ไข</Button> : null}
                  <span className="text-xs text-blue-100/70">{facebookMessage}</span>
                </div>
                {facebookPagesQuery.isError ? <p className="rounded-xl border border-amber-300/25 bg-amber-400/10 p-3 text-xs text-amber-100">โหลดเพจไม่ได้: {facebookPagesQuery.error.message} · ตรวจ Chat config ใน ROOM 02</p> : null}
                {(facebookPagesQuery.data as FacebookPageRow[] | undefined)?.map(page => <div key={page.pageId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-300/15 bg-black/20 p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-blue-100">{page.pageName}</p><p className="mt-1 font-mono text-[10px] text-blue-100/55">Page {page.pageId} · แอป {page.enabledMobile ? "ON" : "OFF"} · เว็บ {page.enabledWeb ? "ON" : "OFF"}</p></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => editFacebookPage(page)} className="border-blue-300/25 text-blue-100">แก้ไข</Button><Button type="button" size="sm" variant="outline" disabled={setFacebookAppStatus.isPending} onClick={() => setFacebookAppStatus.mutate({ pageId: page.pageId, enabled: !page.enabledMobile })} className={page.enabledMobile ? "border-cyan-300/25 text-cyan-100" : "border-red-300/25 text-red-200"}>{page.enabledMobile ? "แอป ON" : "แอป OFF"}</Button><Button type="button" size="sm" variant="outline" disabled={setFacebookWebStatus.isPending} onClick={() => setFacebookWebStatus.mutate({ pageId: page.pageId, enabled: !page.enabledWeb })} className={page.enabledWeb ? "border-emerald-300/25 text-emerald-100" : "border-red-300/25 text-red-200"}>{page.enabledWeb ? "เว็บ ON" : "เว็บ OFF"}</Button><Button type="button" size="sm" variant="outline" onClick={() => { const enabled = notificationPageSettings[page.pageId] !== false; setChatNotificationPageEnabled(page.pageId, !enabled, undefined); setNotificationPageSettings(readChatNotificationPageSettings(undefined)); }} className={notificationPageSettings[page.pageId] !== false ? "border-amber-300/25 text-amber-100" : "border-red-300/25 text-red-200"}><Bell className="mr-1 h-3.5 w-3.5" />แจ้งเตือน {notificationPageSettings[page.pageId] !== false ? "ON" : "OFF"}</Button><label className="flex items-center gap-1.5 text-[10px] text-blue-100/75"><Volume2 className="h-3.5 w-3.5" /><span className="sr-only">เสียงแจ้งเตือน {page.pageName}</span><select aria-label={`เสียงแจ้งเตือน ${page.pageName}`} value={notificationPageSounds[page.pageId] || ""} onChange={event => { const soundKey = event.target.value || null; setChatNotificationPageSound(page.pageId, soundKey, undefined); setNotificationPageSounds(readChatNotificationPageSounds(undefined)); }} className="max-w-40 rounded-md border border-blue-300/25 bg-[#100a12] px-2 py-1.5 text-[10px] text-blue-50"><option value="">ใช้เสียงค่าเริ่มต้น</option>{soundRows.filter(sound => sound.event_type === "new_message" || sound.event_type === "custom").map(sound => <option key={sound.sound_key} value={sound.sound_key}>{sound.name}</option>)}</select></label><Button type="button" size="sm" variant="outline" onClick={() => { if (window.confirm(`ลบ ${page.pageName} หรือไม่`)) deleteFacebookPage.mutate({ pageId: page.pageId }); }} className="border-red-300/25 text-red-200"><Trash2 className="mr-1 h-3.5 w-3.5" />ลบ</Button></div></div>)}
                {!facebookPagesQuery.isLoading && !facebookPagesQuery.data?.length ? <p className="rounded-xl border border-blue-300/10 p-4 text-center text-xs text-blue-100/50">ยังไม่พบเพจ Facebook หรือยังไม่ได้ตั้งค่า Chat ROOM 02</p> : null}
              </CardContent>
            </Card>
          </div>
        </section>
        <section className="space-y-4 pt-3">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rose-300/10 pb-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-rose-300/75">SERVER PROJECT STATUS · ROOMS 01–04</p><h2 className="mt-1 text-lg font-semibold text-white">การเชื่อมต่อฐานข้อมูล</h2><p className="mt-1 text-xs text-white/50">URL/anon key เดิมใน browser คงไว้เป็นข้อมูลสำรอง · ไม่อ่าน ไม่ใช้ หรือส่งไปเชื่อมต่อ; credentials จริงอยู่บนเซิร์ฟเวอร์</p></div>
            <span className="rounded-full border border-rose-300/20 bg-rose-400/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-rose-200/70">SERVER ONLY</span>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <ServerProjectConnection project="main" title="ROOM 01 · ORDER / MAIN" description="ออเดอร์หลัก สินค้า และตารางสนับสนุน" />
            <ServerProjectConnection project="chat" title="ROOM 02 · CHAT" description="ประวัติแชท เพจ และ LINE · ใช้ CHAT Supabase credentials ฝั่ง Server" />
            <ServerProjectConnection project="tracking" title="ROOM 03 · TRACKING / PARCEL" description="บัญชี Supabase เลขพัสดุเดียวกันสำหรับ TRACKING และ PARCEL" />
            <ServerProjectConnection project="vault" title="ROOM 04 · PRIVATE VAULT" description="สคริปต์ ภาพ เสียง ธีม และกรอบแชท" />
          </div>
        </section>
        </> : null}
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
              onClick={() => setGalleryView("cyber")}
              variant="outline"
              className={
                view === "cyber"
                  ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
                  : "border-white/10 bg-transparent text-white/60"
              }
            >
              <Sparkles className="mr-2 h-4 w-4" />
              CYBER FRAME · 40 แบบ
            </Button>
            <Button
              onClick={() => setGalleryView("theme")}
              variant="outline"
              className={view === "theme" ? "border-violet-400/50 bg-violet-500/15 text-violet-200" : "border-white/10 bg-transparent text-white/60"}
            >
              <Palette className="mr-2 h-4 w-4" />
              ธีมแอป
            </Button>
            <Button
              onClick={() => setGalleryView("sound")}
              variant="outline"
              className={view === "sound" ? "border-amber-400/50 bg-amber-500/15 text-amber-200" : "border-white/10 bg-transparent text-white/60"}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              เสียงแชท
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
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-cyan-200/45">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />{" "}
            LOCAL VAULT · AUTOSAVE
          </div>
        </div>
        {view === "theme" ? (
          <>
          <Card className="overflow-hidden rounded-[28px] border-red-500/30 bg-[radial-gradient(circle_at_90%_0%,rgba(239,68,68,.2),transparent_38%),linear-gradient(135deg,#09070d,#160b13_55%,#08090f)] shadow-[0_0_55px_rgba(239,68,68,.12)]">
            <CardHeader className="border-b border-red-300/15 bg-black/20"><div className="flex items-center justify-between gap-3"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-red-300/75">DARKSIDE // THEME CONTROL ROOM</p><CardTitle className="flex items-center gap-2 text-lg text-white"><Palette className="h-5 w-5 text-red-300" /> APP THEME ARCHITECT</CardTitle><p className="mt-2 max-w-2xl text-xs leading-5 text-red-100/60">แก้ไขธีมได้อิสระจากห้องนี้โดยตรง ข้อมูลถูกบันทึกที่ <code className="rounded bg-red-950/60 px-1 text-red-200">app_themes</code> และ Mobile Inbox จะอ่านค่าชุดเดียวกันแบบ dynamic</p></div><div className="hidden rounded-xl border border-red-300/20 bg-red-950/30 px-3 py-2 text-right sm:block"><span className="block text-[9px] uppercase tracking-[0.2em] text-red-200/50">SOURCE OF TRUTH</span><strong className="font-mono text-xs text-red-200">SUPABASE · VAULT</strong></div></div></CardHeader>
          </Card>
          <CustomizationAdmin defaultType="theme" />
          </>
        ) : view === "sound" ? (
          <>
          <Card className="neon-card rounded-3xl border-amber-400/20 bg-[#171208]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-white"><Volume2 className="h-5 w-5 text-amber-300" /> SOUND LAB · เสียงแจ้งเตือนแชท</CardTitle><p className="text-xs leading-5 text-amber-100/60">ตั้งค่าเสียง และโยนไฟล์เสียงจริงเข้า chat-sounds พร้อมสร้างแถว app_sounds อัตโนมัติ</p></CardHeader><CardContent className="grid gap-4"><div className="grid gap-3 md:grid-cols-[auto_1fr_1fr_auto]"><label className="flex items-center gap-2 text-sm text-white"><input type="checkbox" checked={soundSettings.enabled} onChange={event => setSoundSettings(current => ({ ...current, enabled: event.target.checked }))} className="h-4 w-4 accent-amber-500" /> เปิดเสียง</label><label className="grid gap-1 text-xs text-amber-100/60">เสียงจาก ROOM 04<select value={selectedSoundKey} onChange={event => setSelectedSoundKey(event.target.value)} disabled={soundListBusy} className="h-9 rounded-lg border border-amber-400/20 bg-[#21170a] px-2 text-sm text-white"><option value="">{soundListBusy ? "กำลังโหลดเสียง…" : soundRows.length ? "เลือกเสียงที่อัปโหลด" : "ยังไม่มีเสียงในตาราง"}</option>{soundRows.map(row => <option key={row.sound_key} value={row.sound_key}>{row.name} · {row.event_type}</option>)}</select></label><label className="grid gap-1 text-xs text-amber-100/60">ระดับเสียง · {Math.round(soundSettings.volume * 100)}%<input type="range" min="0.05" max="1" step="0.05" value={soundSettings.volume} onChange={event => setSoundSettings(current => ({ ...current, volume: Number(event.target.value) }))} className="accent-amber-400" /></label><Button type="button" variant="outline" onClick={() => void previewSound()} disabled={!selectedSoundKey || soundListBusy} className="border-amber-400/30 text-amber-200"><Play className="mr-2 h-4 w-4" /> ทดลองเล่นเสียงจริง</Button></div><div className="grid gap-3 rounded-2xl border border-amber-300/15 bg-black/20 p-3 md:grid-cols-[1fr_1fr_auto]"><label className="grid gap-1 text-xs text-amber-100/60">ชื่อเสียง<Input value={soundName} onChange={event => setSoundName(event.target.value)} placeholder="เช่น Ragnarok · ปิดยอดสำเร็จ" /></label><label className="grid gap-1 text-xs text-amber-100/60">เหตุการณ์<select value={soundEvent} onChange={event => setSoundEvent(event.target.value as typeof soundEvent)} className="h-10 rounded-lg border border-amber-400/20 bg-[#21170a] px-2 text-sm text-white"><option value="custom">กำหนดเอง</option><option value="new_message">ข้อความใหม่</option><option value="message_sent">ส่งสำเร็จ</option><option value="message_failed">ส่งไม่สำเร็จ</option><option value="new_order">ออเดอร์ใหม่</option></select></label><div className="flex items-end gap-2"><input ref={soundFileRef} hidden type="file" accept="audio/*" onChange={event => setSoundFile(event.target.files?.[0] ?? null)} /><Button type="button" variant="outline" onClick={() => soundFileRef.current?.click()} className="border-cyan-400/30 text-cyan-200">เลือกไฟล์</Button><Button type="button" onClick={() => void uploadSoundFile()} disabled={!soundFile} className="bg-gradient-to-r from-amber-400 to-orange-500 text-black">โยนและบันทึก</Button></div><p className="text-[11px] text-amber-100/60 md:col-span-3">{soundFile ? `ไฟล์ที่เลือก: ${soundFile.name}` : "รองรับไฟล์เสียงไม่เกิน 20 MB"} · {soundUploadMessage}</p></div></CardContent></Card>
          <CustomizationAdmin defaultType="sound" />
          </>
        ) : view === "cyber" ? (
          <>
          <CyberFrameVault />
          <CustomizationAdmin defaultType="frame" />
          </>
        ) : view === "connect" ? null : view === "images" ? (
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
