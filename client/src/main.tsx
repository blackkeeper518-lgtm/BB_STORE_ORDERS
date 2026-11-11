import { trpc } from "@/lib/trpc";
import { readBrowserChatConfig } from "@/lib/chat-config";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, splitLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

const queryClient = new QueryClient();

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
  "chat.messages",
  "chat.sendReply",
  "parcels.sendTracking",
]);

function requestHeaders(includeChatConfig: boolean) {
  const headers: Record<string, string> = {};
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
  if (includeChatConfig) {
    const config = readBrowserChatConfig();
    if (config) {
      headers["x-chat-supabase-url"] = config.url;
      headers["x-chat-supabase-service-role-key"] = config.serviceRoleKey;
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
