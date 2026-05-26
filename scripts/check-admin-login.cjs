const { scrypt, timingSafeEqual } = require("node:crypto");
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
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    include: {
      memberships: {
        include: { company: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) {
    console.log(JSON.stringify({ userExists: false }, null, 2));
    return;
  }

  const [algorithm, salt, storedKey] = user.passwordHash.split(":");

  console.log(
    JSON.stringify(
      {
        userExists: true,
        email: user.email,
        emailNormalized: user.email === email,
        hashAlgorithm: algorithm,
        hashHasSalt: Boolean(salt),
        hashHexLength: storedKey ? storedKey.length : 0,
        passwordMatches: await verifyPassword(password, user.passwordHash),
        activeMemberships: user.memberships
          .filter((membership) => membership.status === "active")
          .map((membership) => ({
            companySlug: membership.company.slug,
            companyStatus: membership.company.status,
            role: membership.role,
            status: membership.status,
          })),
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
