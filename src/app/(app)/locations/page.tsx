import { CategoriesLocationsClient } from "@/components/categories-locations/categories-locations-client";

export const metadata = {
  title: "Shop Locations (Purchase Sources) — FabricPro",
  description: "Manage shop locations and wholesale market stalls where the company buys products.",
};

export default function LocationsPage() {
  return <CategoriesLocationsClient mode="locations" />;
}

