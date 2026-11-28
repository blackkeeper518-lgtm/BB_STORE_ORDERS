import { useCallback } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export type SharedProductHighlights = { configured: boolean; productNames: string[] };

export function useChatProductHighlights() {
  const utils = trpc.useUtils();
  const query = trpc.chat.productHighlights.useQuery(undefined, {
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const saveMutation = trpc.chat.saveProductHighlights.useMutation({
    onSuccess: data => utils.chat.productHighlights.setData(undefined, data),
    onError: error => toast.error(`บันทึกสินค้าไฮไลท์ออนไลน์ไม่สำเร็จ: ${error.message}`),
  });
  const saveProductNames = useCallback((names: string[]) => {
    const productNames = [...new Set(names.map(name => name.trim().slice(0, 120)).filter(Boolean))].slice(0, 30);
    saveMutation.mutate({ productNames });
  }, [saveMutation.mutate]);
  return { settings: query.data, saveProductNames, isLoading: query.isLoading };
}
