import Link from "next/link";
import { FaRocket } from "react-icons/fa6";

interface Props {
    className?: string;
}

export default function Powered({ className }: Props) {
  return (
    <Link
      href="https://scoopika.com?ref=widgets"
      target="_blank"
      className={`flex items-center justify-center text-center text-xs opacity-70 gap-2 font-semibold ${className}`}
    >
      <FaRocket />

      <div>Powered by Scoopika</div>
    </Link>
  );
}
