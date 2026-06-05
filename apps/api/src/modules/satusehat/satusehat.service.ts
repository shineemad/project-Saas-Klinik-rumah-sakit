import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";

/**
 * SATUSEHAT Integration Service (Fase 2 — Kemenkes FHIR R4)
 * Reference: platform.satusehat.kemkes.go.id/api-docs
 *
 * Fase 1 (MVP): Internal data model uses FHIR R4 terminology.
 * Fase 2: Active OAuth2 + FHIR R4 JSON sync.
 */
@Injectable()
export class SatusehatService {
  private readonly logger = new Logger(SatusehatService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.baseUrl = config.get<string>(
      "SATUSEHAT_BASE_URL",
      "https://api-satusehat.kemkes.go.id",
    );
  }

  async getSyncStatus(tenantId: string) {
    // TODO Phase 2: return sync dashboard per tenant
    return {
      tenantId,
      status: "NOT_CONFIGURED",
      message: "Integrasi SATUSEHAT akan tersedia di Fase 2.",
      lastSyncAt: null,
    };
  }

  async syncMedicalRecord(tenantId: string, medicalRecordId: string) {
    // TODO Phase 2: Map medical record to FHIR R4 Encounter + Observation resources
    this.logger.log(
      `[SATUSEHAT] Sync requested for record ${medicalRecordId} (Phase 2 feature)`,
    );
    return {
      message: "Sinkronisasi SATUSEHAT akan tersedia di Fase 2.",
      medicalRecordId,
    };
  }

  private async getAccessToken(): Promise<string> {
    // TODO Phase 2: OAuth2 client credentials flow
    const clientId = this.config.get<string>("SATUSEHAT_CLIENT_ID");
    const clientSecret = this.config.get<string>("SATUSEHAT_CLIENT_SECRET");
    throw new Error("SATUSEHAT OAuth2 not yet implemented (Phase 2)");
  }
}
