import { ConfigurationClient } from "@/components/configuration/configuration-client";

export const metadata = {
  title: "Store Configuration — FabricPro",
  description: "Configure geographic hierarchy (Country, Division, District, Area) and product categories.",
};

export default function ConfigurationPage() {
  return <ConfigurationClient />;
}
