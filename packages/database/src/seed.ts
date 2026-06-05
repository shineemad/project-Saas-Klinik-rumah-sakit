import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "klinik-demo" },
    update: {},
    create: {
      name: "Klinik Demo",
      slug: "klinik-demo",
      planTier: "PRO",
      subscriptionStatus: "ACTIVE",
    },
  });

  console.log(`✅ Tenant created: ${tenant.name}`);

  // Create admin user
  const passwordHash = await bcrypt.hash("Admin@123456", 12);

  const owner = await prisma.user.upsert({
    where: {
      email_tenantId: { email: "owner@klinikos.id", tenantId: tenant.id },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Dr. Rina (Owner)",
      email: "owner@klinikos.id",
      passwordHash,
      role: "OWNER",
    },
  });

  const doctor = await prisma.user.upsert({
    where: {
      email_tenantId: { email: "dokter@klinikos.id", tenantId: tenant.id },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "dr. Budi Santoso",
      email: "dokter@klinikos.id",
      passwordHash,
      role: "DOCTOR",
    },
  });

  const receptionist = await prisma.user.upsert({
    where: {
      email_tenantId: { email: "resepsionis@klinikos.id", tenantId: tenant.id },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Siti Rahayu",
      email: "resepsionis@klinikos.id",
      passwordHash,
      role: "RECEPTIONIST",
    },
  });

  const pharmacist = await prisma.user.upsert({
    where: {
      email_tenantId: { email: "apoteker@klinikos.id", tenantId: tenant.id },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "apt. Sari Dewi",
      email: "apoteker@klinikos.id",
      passwordHash,
      role: "PHARMACIST",
    },
  });

  console.log("✅ Users created");

  // Create sample drugs
  const drugs = await Promise.all([
    prisma.drug.create({
      data: {
        tenantId: tenant.id,
        nameGeneric: "Amoxicillin 500mg",
        nameBrand: "Amoxan",
        category: "Antibiotik",
        unit: "tablet",
        purchasePrice: 500,
        sellingPrice: 800,
        minimumStock: 50,
      },
    }),
    prisma.drug.create({
      data: {
        tenantId: tenant.id,
        nameGeneric: "Paracetamol 500mg",
        nameBrand: "Panadol",
        category: "Analgesik",
        unit: "tablet",
        purchasePrice: 200,
        sellingPrice: 400,
        minimumStock: 100,
      },
    }),
    prisma.drug.create({
      data: {
        tenantId: tenant.id,
        nameGeneric: "Omeprazole 20mg",
        nameBrand: "Losec",
        category: "Antasida",
        unit: "kapsul",
        purchasePrice: 1500,
        sellingPrice: 2500,
        minimumStock: 30,
      },
    }),
  ]);

  // Create stock for each drug
  for (const drug of drugs) {
    await prisma.drugStock.create({
      data: {
        drugId: drug.id,
        quantityOnHand: 200,
        batchNumber: `BATCH-2024-001`,
        expiryDate: new Date("2026-12-31"),
      },
    });
  }

  console.log("✅ Drugs and stock created");

  console.log("\n🎉 Seeding complete!");
  console.log("\nLogin credentials (all passwords: Admin@123456):");
  console.log(`  Owner:       owner@klinikos.id`);
  console.log(`  Doctor:      dokter@klinikos.id`);
  console.log(`  Receptionist: resepsionis@klinikos.id`);
  console.log(`  Pharmacist:  apoteker@klinikos.id`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
