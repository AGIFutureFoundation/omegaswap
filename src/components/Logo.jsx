import { Image } from "@/components/ui/image";

export const LOGO_URL = "https://media.base44.com/images/public/6ae63a525fa5fffc7fc2ede8/e9bdbe134_generated_image.png";

export default function Logo({ className = "" }) {
  return (
    <span className={`flex items-center gap-2 font-heading text-lg font-bold tracking-tight ${className}`}>
      <Image src={LOGO_URL} alt="" className="h-8 w-8 rounded-lg" />
      <span>Omega<span className="text-primary">Swap</span></span>
    </span>
  );
}