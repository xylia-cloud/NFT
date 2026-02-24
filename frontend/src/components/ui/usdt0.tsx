import { cn } from "@/lib/utils";
import usdtIcon from "@/assets/images/usdt.svg";

type IconSize = "sm" | "default" | "lg" | "xl";

const iconSizeClass: Record<IconSize, string> = {
  sm: "h-4 w-4",
  default: "h-5 w-5",
  lg: "h-7 w-7",
  xl: "h-9 w-9",
};

export function Usdt0({
  className,
  iconSize = "default",
  iconOnly = false,
}: {
  className?: string;
  iconSize?: IconSize;
  iconOnly?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 align-middle", className)}
      aria-label="USDT0"
    >
      <img
        src={usdtIcon}
        alt=""
        className={cn("shrink-0", iconSizeClass[iconSize])}
        role="presentation"
      />
      {!iconOnly && <span>USDT0</span>}
    </span>
  );
}
