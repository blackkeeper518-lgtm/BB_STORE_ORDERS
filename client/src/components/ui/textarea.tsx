import { useDialogComposition } from "@/components/ui/dialog";
import { useComposition } from "@/hooks/useComposition";
import { cn } from "@/lib/utils";
import * as React from "react";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(function Textarea({
  className,
  onKeyDown,
  onCompositionStart,
  onCompositionEnd,
  ...props
}, ref) {
  // Get dialog composition context if available (will be no-op when not inside Dialog).
  const dialogComposition = useDialogComposition();

  // Preserve IME behavior for Thai, Chinese, Japanese and other composed input.
  const {
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
    onKeyDown: handleKeyDown,
  } = useComposition<HTMLTextAreaElement>({
    onKeyDown: (event) => {
      const isComposing = (event.nativeEvent as any).isComposing || dialogComposition.justEndedComposing();
      if (event.key === "Enter" && !event.shiftKey && isComposing) return;
      onKeyDown?.(event);
    },
    onCompositionStart: (event) => {
      dialogComposition.setComposing(true);
      onCompositionStart?.(event);
    },
    onCompositionEnd: (event) => {
      dialogComposition.markCompositionEnd();
      setTimeout(() => dialogComposition.setComposing(false), 100);
      onCompositionEnd?.(event);
    },
  });

  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
