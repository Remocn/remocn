"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import {
  Toast,
  type ToastState,
  type ToastVariant,
} from "@/registry/remocn-ui/toast";

export interface ToastPreviewProps {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  state?: ToastState;
  mode?: "light" | "dark";
}

export function ToastPreview({
  title = "Changes saved",
  description = "Your profile has been updated.",
  variant = "success",
  state = "visible",
  mode,
}: ToastPreviewProps) {
  const theme = useRemocnTheme(undefined, mode);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.background,
      }}
    >
      <Toast
        title={title}
        description={description}
        variant={variant}
        state={state}
        mode={mode}
      />
    </div>
  );
}
