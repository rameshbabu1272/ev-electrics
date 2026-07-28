import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();
const hashPassword = (password, salt = randomBytes(16).toString("hex")) =>
  `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const images = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAjlcc2WoG7JOifgYljmi2P2tWLAuKhl_DFVLOPEsE8nqLWt-j1zuegLfJSkAt2cdkq9T15jx4nrGIFfqFfhXZ0PLRPpxdpVUYv74oMcJRz-UJxQRBqkdUBfYNOtNq_pv8_kzfsbobHbxRPjDeQYswUYLCxh9s_5whTStUhc0XoywODJnyc7inTKEX9vD01GrQqIBkPIY-Yt1_8wRMlqr1HqEROsxhKVVhTXDTUiFAM765b0DgOIAj9",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCKz-WUNdgthNLEfI8MvmawnCTif8C6TKjLR9_V7FfAXnP4eWwOmeNn5gxBMdXSOMqF4UE-HaCDxO4KPma8VHr3l4Mj5ojCx11q_BDGaLrFggmPeqP3lFk0Zzlc_9X7HnSrn3oCTaBYs4ddL9AxWySPP30FczJ-JpG9sbZp1L7J1ksUpPXOX0IwnFAiw9x-qRoDWwEMxm4rgM5SNOXEqZUQ1kpqs_bGkwkQVp4ktAFyuJDv8cEqIG2O",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBV-AovZOcqn-Ey1B0bixMafGfTe7NJwU6_87oHtgIoVcqO2gHC9QPVBD4UWo9yxvIyquY0BKM_oQ9HDJrAAUTf56KrXa3E-mTktui6aO1VDy_5N1rQDmkhTqp3MZWfh0j2ylaj-IAfq_XfMluhATYAXhEDZhH0XUg8Z9e8_SAbCnhBeURULP1gJ_XIKMpOAulmWykr9PhfJyzVVgEISEDdkBnq2SbgyN3hR4nV7DLFtN2lb3kpSFxZ",
];

await prisma.category.upsert({
  where: { slug: "scooter" },
  update: { active: true },
  create: {
    slug: "scooter",
    name: "Electric Scooters",
    description: "Electric scooters for daily mobility",
  },
});
await prisma.category.upsert({
  where: { slug: "spare" },
  update: { active: true },
  create: {
    slug: "spare",
    name: "Spare Parts",
    description: "Batteries, tyres, brakes and replacement parts",
  },
});
if ((await prisma.product.count()) === 0)
  await prisma.product.createMany({
    data: [
      {
        name: "SAI ELECTICS X1",
        tag: "CITY COMMUTER",
        price: 74999,
        image: images[0],
        spec1_label: "RANGE",
        spec1_value: "45km",
        spec2_label: "SPEED",
        spec2_value: "30km/h",
        stock: 18,
        category: "scooter",
      },
      {
        name: "Pro Elite v2",
        tag: "PERFORMANCE",
        price: 109999,
        image: images[1],
        spec1_label: "RANGE",
        spec1_value: "80km",
        spec2_label: "SPEED",
        spec2_value: "45km/h",
        featured: true,
        stock: 9,
        category: "scooter",
      },
      {
        name: "SAI ELECTICS Lite",
        tag: "ULTRA-PORTABLE",
        price: 45999,
        image: images[2],
        spec1_label: "RANGE",
        spec1_value: "25km",
        spec2_label: "WEIGHT",
        spec2_value: "12kg",
        stock: 25,
        category: "scooter",
      },
      {
        name: "48V Smart Battery",
        tag: "LONG-RANGE POWER",
        price: 18999,
        image: images[0],
        spec1_label: "VOLTAGE",
        spec1_value: "48V",
        spec2_label: "WARRANTY",
        spec2_value: "12 months",
        stock: 14,
        category: "spare",
      },
      {
        name: "All-Terrain Tyre Set",
        tag: "HIGH-GRIP",
        price: 3499,
        image: images[2],
        spec1_label: "SIZE",
        spec1_value: "10 inch",
        spec2_label: "INCLUDES",
        spec2_value: "2 tyres",
        stock: 32,
        category: "spare",
      },
      {
        name: "Performance Brake Kit",
        tag: "SAFETY UPGRADE",
        price: 2499,
        image: images[1],
        spec1_label: "TYPE",
        spec1_value: "Disc brake",
        spec2_label: "INCLUDES",
        spec2_value: "Full kit",
        stock: 24,
        category: "spare",
      },
    ],
  });
const email = (process.env.ADMIN_EMAIL || "admin@saielectics.in").toLowerCase();
await prisma.admin.upsert({
  where: { email },
  update: {},
  create: {
    email,
    password_hash: hashPassword(process.env.ADMIN_PASSWORD || "ChangeMe#2026"),
  },
});
console.log("MySQL seed complete.");
await prisma.$disconnect();
