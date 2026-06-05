import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.get<string>("RESEND_API_KEY"));
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.config.get<string>("EMAIL_FROM", "noreply@klinikos.id"),
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${String(error)}`);
    }
  }

  async sendLowStockAlert(
    to: string,
    drugName: string,
    currentStock: number,
    minStock: number,
  ) {
    return this.sendEmail(
      to,
      `[KlinikOS] Alert: Stok ${drugName} Menipis`,
      `<p>Stok <strong>${drugName}</strong> tinggal <strong>${currentStock}</strong> unit (minimum: ${minStock}). Segera order.</p>`,
    );
  }

  async sendExpiryAlert(
    to: string,
    drugName: string,
    batchNumber: string,
    expiryDate: Date,
  ) {
    return this.sendEmail(
      to,
      `[KlinikOS] Alert: Obat Mendekati Kedaluwarsa`,
      `<p><strong>${drugName}</strong> batch <strong>${batchNumber}</strong> akan kedaluwarsa pada ${expiryDate.toLocaleDateString("id-ID")}.</p>`,
    );
  }

  async sendDailyReport(to: string, reportData: Record<string, unknown>) {
    const { date, totalPatients, totalRevenue, totalPrescriptions } =
      reportData as {
        date: string;
        totalPatients: number;
        totalRevenue: number;
        totalPrescriptions: number;
      };
    return this.sendEmail(
      to,
      `[KlinikOS] Laporan Harian ${date}`,
      `<p>Laporan Harian <strong>${date}</strong>:<br/>Pasien: ${totalPatients}<br/>Pendapatan: Rp ${Number(totalRevenue).toLocaleString("id-ID")}<br/>Resep: ${totalPrescriptions}</p>`,
    );
  }
}
