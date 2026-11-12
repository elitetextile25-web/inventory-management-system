import { CategoriesLocationsClient } from "@/components/categories-locations/categories-locations-client";

export const metadata = {
  title: "Categories & Subcategories — FabricPro",
  description: "Manage product categories and subcategories in a unified hierarchical structure.",
};

export default function CategoriesPage() {
  return <CategoriesLocationsClient mode="categories" />;
}
