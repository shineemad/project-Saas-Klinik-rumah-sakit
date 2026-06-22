export type Gender = "MALE" | "FEMALE";

export type BloodType =
  | "A_POS"
  | "A_NEG"
  | "B_POS"
  | "B_NEG"
  | "AB_POS"
  | "AB_NEG"
  | "O_POS"
  | "O_NEG"
  | "A"
  | "B"
  | "AB"
  | "O";

export interface PatientListItem {
  id: string;
  medicalRecordNumber: string;
  name: string;
  birthDate: string;
  gender: Gender;
  phone: string | null;
  bloodType: BloodType | null;
  createdAt: string;
  _count: { allergies: number; medicalRecords: number };
}

export interface PatientDetail {
  id: string;
  medicalRecordNumber: string;
  name: string;
  birthDate: string;
  gender: Gender;
  phone: string | null;
  nik: string | null;
  bpjsNumber: string | null;
  bloodType: BloodType | null;
  address: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const GENDER_LABEL: Record<Gender, string> = {
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
};

export const BLOOD_TYPE_LABEL: Record<BloodType, string> = {
  A_POS: "A+",
  A_NEG: "A-",
  B_POS: "B+",
  B_NEG: "B-",
  AB_POS: "AB+",
  AB_NEG: "AB-",
  O_POS: "O+",
  O_NEG: "O-",
  A: "A",
  B: "B",
  AB: "AB",
  O: "O",
};

export const BLOOD_TYPE_OPTIONS: BloodType[] = [
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
  "O_POS",
  "O_NEG",
  "A",
  "B",
  "AB",
  "O",
];

export function calcAge(birthDate: string): number {
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
