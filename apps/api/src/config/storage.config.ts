import { registerAs } from "@nestjs/config";

export const storageConfig = registerAs("storage", () => ({
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "klinik-os-files",
  r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
  presignedUrlTtl: 900, // 15 minutes in seconds
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/dicom",
  ],
}));
