import { PurchaseSourceForm } from "@/components/store-management/purchase-source-form";

export const metadata = {
  title: "New Purchase Source — FabricPro",
  description: "Register a new mill, wholesale stall, or factory supplier",
};

export default function NewPurchaseSourcePage() {
  return <PurchaseSourceForm isEdit={false} />;
}

