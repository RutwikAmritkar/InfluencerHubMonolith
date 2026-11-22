import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[#E5E4DF] dark:border-white/10 bg-white dark:bg-[#121216] px-3 py-2 text-xs text-[#0A0A0A] dark:text-[#F8FAFC] shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-[#52525B]/60 dark:placeholder:text-[#A1A1AA]/60 focus-visible:outline-none focus-visible:border-[#6A0D18] dark:focus-visible:border-[#E87985] focus-visible:ring-1 focus-visible:ring-[#6A0D18] dark:focus-visible:ring-[#E87985] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
