import { Widget } from "@scoopika/types";

interface Props {
  icon: React.ReactNode;
  title: string;
  description: string;
  widget: Widget;
  children?: React.ReactNode;
}

export default function Empty({
  icon,
  title,
  description,
  children,
  widget,
}: Props) {
  return (
    <div className="w-full flex flex-col items-center p-8">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: widget.primaryColor,
          color: widget.bgColor,
        }}
      >
        {icon}
      </div>
      <div className="text-center mt-2">{title}</div>
      <div className="text-sm text-center opacity-70 mb-4">{description}</div>
      {children && children}
    </div>
  );
}
