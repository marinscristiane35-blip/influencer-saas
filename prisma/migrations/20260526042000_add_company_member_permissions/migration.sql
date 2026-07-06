CREATE TABLE IF NOT EXISTS "company_member_permissions" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_member_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_member_permissions_member_id_permission_key" ON "company_member_permissions"("member_id", "permission");
CREATE INDEX IF NOT EXISTS "company_member_permissions_company_id_permission_idx" ON "company_member_permissions"("company_id", "permission");
CREATE INDEX IF NOT EXISTS "company_member_permissions_member_id_idx" ON "company_member_permissions"("member_id");

DO $$ BEGIN
    ALTER TABLE "company_member_permissions" ADD CONSTRAINT "company_member_permissions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "company_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
