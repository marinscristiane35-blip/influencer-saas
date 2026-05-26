const { randomBytes, scrypt, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");
const { PrismaClient } = require("@prisma/client");

loadEnv();

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);
const email = normalizeEmail("admin@influencersaas.local");
const password = "admin123456";

function loadEnv() {
  const { existsSync, readFileSync } = require("node:fs");
  const { resolve } = require("node:path");
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match || process.env[match[1]]) {
      continue;
    }

    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

async function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(value, salt, 64);

  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(value, passwordHash) {
  const [algorithm, salt, storedKey] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const storedBuffer = Buffer.from(storedKey, "hex");
  const derivedKey = await scryptAsync(value, salt, 64);

  return (
    storedBuffer.length === derivedKey.length &&
    timingSafeEqual(storedBuffer, derivedKey)
  );
}

async function main() {
  const passwordHash = await hashPassword(password);

  const existingUsers = await prisma.user.findMany({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    orderBy: { createdAt: "asc" },
  });

  let user = existingUsers[0];

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { email, passwordHash },
    });
  } else {
    user = await prisma.user.create({
      data: {
        name: "Admin Inicial",
        email,
        passwordHash,
      },
    });
  }

  const company = await prisma.company.upsert({
    where: { slug: "empresa-demo" },
    update: { status: "active" },
    create: {
      name: "Empresa Demo",
      slug: "empresa-demo",
      status: "active",
    },
  });

  const membership = await prisma.companyMember.upsert({
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

  console.log(
    JSON.stringify(
      {
        userEmail: user.email,
        passwordMatches: await verifyPassword(password, user.passwordHash),
        companySlug: company.slug,
        membershipStatus: membership.status,
        membershipRole: membership.role,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
