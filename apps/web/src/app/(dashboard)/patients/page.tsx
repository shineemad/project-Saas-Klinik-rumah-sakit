import type { Metadata } from "next";
import { PatientsContent } from "./_components/patients-content";

export const metadata: Metadata = { title: "Pasien" };

export default function PatientsPage() {
  return <PatientsContent />;
}
