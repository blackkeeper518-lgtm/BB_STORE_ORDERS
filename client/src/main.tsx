import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, splitLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import { readBrowserChatConfig } from "./lib/chat-config";
import "./index.css";

const queryClient = new QueryClient();
const ADMIN_DEVICE_STORAGE_KEY = "bb-admin-device-id";
function getAdminDeviceId() {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(ADMIN_DEVICE_STORAGE_KEY);
    if (existing) return existing;
    const id = globalThis.crypto?.randomUUID?.() ?? `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(ADMIN_DEVICE_STORAGE_KEY, id);
    return id;
  } catch { return ""; }
}

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const chatProcedures = new Set([
  "chat.connection",
  "chat.threads",
  "chat.pollNotifications",
  "chat.messages",
  "chat.sendReply",
  "line.status",
  "line.conversations",
  "line.messages",
  "line.send",
  "parcels.sendTracking",
]);

function requestHeaders(includeChatConfig: boolean) {
  const headers: Record<string, string> = { "x-admin-device-id": getAdminDeviceId() };
  try {
    // ส่ง session ของ Preview เมื่อ browser แบบฝังไม่ยอมแนบ cookie
    const raw = sessionStorage.getItem("manus-cookie");
    if (raw) {
      const prefix = `${COOKIE_NAME}=`;
      const pair = raw.split(";").find(value => value.trim().startsWith(prefix));
      const token = pair?.trim().slice(prefix.length);
      if (token) headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // บางโหมดส่วนตัวอาจปิด sessionStorage
  }
  // Prefer the server/Render environment. Keep the existing Secret Gallery form as a
  // compatibility fallback for deployments whose Render variables are not available yet.
  if (includeChatConfig) {
    const browserChat = readBrowserChatConfig();
    if (browserChat) {
      headers["x-chat-supabase-url"] = browserChat.url;
      headers["x-chat-supabase-service-role-key"] = browserChat.serviceRoleKey;
    }
  }
  return headers;
}

const makeBatchLink = (includeChatConfig: boolean) =>
  httpBatchLink({
    url: "/api/trpc",
    transformer: superjson,
    headers() {
      return requestHeaders(includeChatConfig);
    },
    fetch(input, init) {
      return globalThis.fetch(input, {
        ...(init ?? {}),
        credentials: "include",
      });
    },
  });

const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: operation => chatProcedures.has(operation.path),
      true: makeBatchLink(true),
      false: makeBatchLink(false),
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
