import { Suspense } from "react";
import { NewMedicalRecordContent } from "./_components/new-medical-record-content";

export const metadata = { title: "Kunjungan Baru" };

export default function NewMedicalRecordPage() {
  return (
    <Suspense>
      <NewMedicalRecordContent />
    </Suspense>
  );
}
