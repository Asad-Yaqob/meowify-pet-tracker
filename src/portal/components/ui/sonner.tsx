"use client";

import { useTheme } from "src/components/provider/theme-provider";
import { Toaster as Sonner } from "sonner";

export function Toaster({ position = "top-center" }: { position?: any }) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      position={position}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: `group toast 
            flex items-center gap-3 w-full
            group-[.toaster]:shadow-lg 
            group-[.toaster]:rounded-xl 
            group-[.toaster]:border 
            group-[.toaster]:p-4`,
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold",
          description: "group-[.toast]:text-xs group-[.toast]:opacity-90",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:bg-lightsuccess group-[.toast]:text-success group-[.toast]:border-success",
          error: "group-[.toast]:bg-lighterror group-[.toast]:text-error group-[.toast]:border-error",
          warning: "group-[.toast]:bg-lightwarning group-[.toast]:text-warning group-[.toast]:border-warning",
          info: "group-[.toast]:bg-lightinfo group-[.toast]:text-info group-[.toast]:border-info",
        },
      }}
    />
  );
}
