import { useSite } from "@/components/site-provider";
import { useTheme } from "@/components/theme-provider";

export function AppLogo({
  variant = "light",
  className,
  alt,
}: {
  variant?: "light" | "dark";
  className?: string;
  alt?: string;
}) {
  const theme = useTheme();
  const site = useSite();
  const src = variant === "dark" ? theme.logoDarkUrl || "/logo-dark.jpg" : theme.logoUrl || "/logo.jpg";
  return <img src={src} alt={alt || site.name} className={className} />;
}