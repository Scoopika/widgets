interface Props {
  color: string;
}

export default function Loading({ color }: Props) {
  return (
    <div
      style={{
        color,
      }}
      className="w-full h-full flex items-center justify-center"
    >
      <div
        className="border w-5 h-5 rounded-full animate-pulse"
        style={{
          borderColor: color,
        }}
      ></div>
    </div>
  );
}
