import { ConfigurationClient } from "@/components/configuration/configuration-client";

export const metadata = {
  title: "Company Setup — FabricPro",
  description: "Configure company details, geographic hierarchy, and business structure.",
};

export default function ConfigurationPage() {
  return <ConfigurationClient />;
}
