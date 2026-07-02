export type MedicalRecordStatus = "DRAFT" | "ACTIVE" | "FINALIZED";

export interface SoapNotes {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: string;
  respiratoryRate?: string;
  temperature?: string;
  weight?: string;
  [key: string]: unknown;
}

export interface PatientAllergy {
  id: string;
  allergenType: "DRUG" | "FOOD" | "OTHER";
  allergenName: string;
  severity: "MILD" | "MODERATE" | "SEVERE";
  reactionDescription: string | null;
}

export interface PrescriptionItem {
  id: string;
  quantity: number;
  dosageInstruction: string;
  drug: { id: string; nameGeneric: string; nameBrand: string | null };
}

export interface MedicalRecordDetail {
  id: string;
  visitDate: string;
  chiefComplaint: string;
  status: MedicalRecordStatus;
  soapNotes: SoapNotes | null;
  vitalSigns: VitalSigns | null;
  icd10Codes: string[];
  patient: {
    id: string;
    name: string;
    medicalRecordNumber: string;
    birthDate: string;
    gender: "MALE" | "FEMALE";
    allergies: PatientAllergy[];
  };
  attendingDoctor: { id: string; name: string } | null;
  prescriptions: Array<{
    id: string;
    status: "DRAFT" | "ACTIVE" | "DISPENSED" | "CANCELLED";
    items: PrescriptionItem[];
  }>;
}

export interface MedicalRecordListItem {
  id: string;
  visitDate: string;
  chiefComplaint: string;
  status: MedicalRecordStatus;
  attendingDoctor?: { name: string } | null;
  icd10Codes?: string[];
}

export const RECORD_STATUS_LABEL: Record<MedicalRecordStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Aktif",
  FINALIZED: "Final",
};

export const RECORD_STATUS_BADGE: Record<MedicalRecordStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  ACTIVE: "bg-blue-50 text-blue-700",
  FINALIZED: "bg-emerald-50 text-emerald-700",
};

export const SEVERITY_LABEL: Record<PatientAllergy["severity"], string> = {
  MILD: "Ringan",
  MODERATE: "Sedang",
  SEVERE: "Berat",
};
