import { SoapEditor } from "./_components/soap-editor";

export const metadata = { title: "Rekam Medis — SOAP" };

export default function MedicalRecordDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <SoapEditor recordId={params.id} />;
}
