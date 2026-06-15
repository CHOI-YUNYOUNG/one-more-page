"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          /* 기본 — 깊은 소나무 숲 */
          "--normal-bg": "#2d4a2d",
          "--normal-text": "#d4e8d0",
          "--normal-border": "#4a6b4a",

          /* 성공 — 이끼 사이 햇살 */
          "--success-bg": "#1e4228",
          "--success-text": "#a8d8a0",
          "--success-border": "#3a6448",

          /* 에러 — 낙엽 (빨강 대신 따뜻한 앰버) */
          "--error-bg": "#4a2c1e",
          "--error-text": "#e8c8a0",
          "--error-border": "#7a4c38",

          /* 경고 */
          "--warning-bg": "#3d3a1a",
          "--warning-text": "#e0d898",
          "--warning-border": "#6b6438",

          "--border-radius": "0.75rem",
          "--font-size": "0.875rem",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          boxShadow: "0 4px 16px rgba(20, 40, 20, 0.35)",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
