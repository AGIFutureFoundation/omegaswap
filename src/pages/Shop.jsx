import ShopGrid from "@/components/shop/ShopGrid";
import QuickConnect from "@/components/shop/QuickConnect";

export default function Shop() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">Shop and connect</h1>
      <ShopGrid />
      <QuickConnect />
    </div>
  );
}