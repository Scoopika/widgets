"use client";

import { Widget } from "@scoopika/types";
import { useEffect } from "react";

interface Props {
  widget: Widget;
  children: React.ReactNode;
}

export default function Container({ widget, children }: Props) {
  useEffect(() => {
    const elm = document.documentElement;
    elm.style.setProperty("--background", widget.bgColor);
    elm.style.setProperty("--foreground", widget.textColor);
    elm.style.setProperty("--primary", widget.primaryColor);
    elm.style.setProperty("--primaryText", widget.primaryTextColor);
    if (widget.borderColor)
      elm.style.setProperty("--border", widget.borderColor);
    if (widget.secondaryColor)
      elm.style.setProperty("--accent", widget.secondaryColor);
  }, []);

  return (
    <div
      className="w-[100vw] h-[100vh] overflow-x-hidden"
      style={{
        backgroundColor: widget.bgColor,
        color: widget.textColor,
      }}
    >
      {children}
    </div>
  );
}
