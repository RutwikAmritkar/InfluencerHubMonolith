import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#121216] px-3 py-2 text-xs text-[#0A0A0A] dark:text-[#F8FAFC] placeholder:text-[#52525B]/60 dark:placeholder:text-[#A1A1AA]/60 focus-visible:outline-none focus-visible:border-[#6A0D18] dark:focus-visible:border-[#E87985] focus-visible:ring-1 focus-visible:ring-[#6A0D18] dark:focus-visible:ring-[#E87985] disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
