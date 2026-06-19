"use client";

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
}

export function ToastPreview({
  title = "Changes saved",
  description = "Your profile has been updated.",
  variant = "success",
  state = "visible",
}: ToastPreviewProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <Toast
        title={title}
        description={description}
        variant={variant}
        state={state}
      />
    </div>
  );
}
