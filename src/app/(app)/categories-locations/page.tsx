import { CategoriesLocationsClient } from "@/components/categories-locations/categories-locations-client";

export const metadata = {
  title: "Categories & Locations — FabricPro",
  description: "Manage product categories, subcategories, geographic locations, and shops.",
};

export default function CategoriesLocationsPage() {
  return <CategoriesLocationsClient />;
}
