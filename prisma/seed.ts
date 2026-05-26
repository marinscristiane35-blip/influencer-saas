import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { normalizeEmail } from "../src/lib/auth/email";

const prisma = new PrismaClient();

async function main() {
  const email = normalizeEmail("admin@influencersaas.local");
  const passwordHash = await hashPassword("admin123456");

  const user = await prisma.user.upsert({
    where: { email },
    update: { email, passwordHash },
    create: {
      name: "Admin Inicial",
      email,
      passwordHash,
    },
  });

  const company = await prisma.company.upsert({
    where: { slug: "empresa-demo" },
    update: {},
    create: {
      name: "Empresa Demo",
      slug: "empresa-demo",
    },
  });

  await prisma.companyMember.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: user.id,
      },
    },
    update: { role: "owner", status: "active" },
    create: {
      companyId: company.id,
      userId: user.id,
      role: "owner",
      status: "active",
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
