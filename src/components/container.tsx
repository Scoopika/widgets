"use client";

import { Widget } from "@scoopika/types";
import { useEffect, useState } from "react";

interface Props {
  widget: Widget;
  children: React.ReactNode;
}

export default function Container({ widget, children }: Props) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

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

    if (widget.allowedSources && widget.allowedSources.length > 0) {
      const sources = [...widget.allowedSources, "scoopika.com"].map(
        url => url.replace("https://", "").replace("http://", "")
      )

      const ref = document.referrer.replace("https://", "");
      if (ref.length > 0) {
        setAllowed(sources.indexOf(ref.split("/")[0]) !== -1);
      } else {
        setAllowed(true);
      }

    } else {
      setAllowed(true);
    }
  }, []);

  if (allowed === null) {
    return <></>;
  }

  if (allowed === false) {
    return <div className="text-xs text-red-500">
      Access from this website is denied
    </div>
  }

  return (
    <div
      className={`min-w-[100svw] max-w-[100svw] min-h-[100svh] max-h-[100svh] overflow-x-hidden fixed top-0 left-0 ${widget.themeMode}`}
      style={{
        backgroundColor: widget.bgColor,
        color: widget.textColor,
      }}
    >
      {children}
    </div>
  );
}
