import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoices1770000000000 implements MigrationInterface {
  name = 'CreateInvoices1770000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "invoice_status" AS ENUM ('PROCESSING', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED')`);
    await queryRunner.query(`
      CREATE TABLE "invoices" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "vendor_name" varchar(180) NOT NULL,
        "vendor_email" varchar(254) NOT NULL,
        "invoice_number" varchar(100) NOT NULL,
        "invoice_date" date NOT NULL,
        "due_date" date NOT NULL,
        "subtotal" numeric(12,2) NOT NULL,
        "tax" numeric(12,2) NOT NULL,
        "total" numeric(12,2) NOT NULL,
        "project_name" varchar(180) NOT NULL,
        "status" "invoice_status" NOT NULL DEFAULT 'PROCESSING',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_invoices_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_invoices_due_date" ON "invoices" ("due_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_invoices_status" ON "invoices" ("status")`);
    await queryRunner.query(`
      CREATE TABLE "invoice_line_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "invoice_id" uuid NOT NULL,
        "description" varchar(240) NOT NULL,
        "quantity" numeric(10,2) NOT NULL,
        "unit_price" numeric(12,2) NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        CONSTRAINT "PK_invoice_line_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_invoice_line_items_invoice" FOREIGN KEY ("invoice_id")
          REFERENCES "invoices"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_invoice_line_items_invoice" ON "invoice_line_items" ("invoice_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "invoice_line_items"`);
    await queryRunner.query(`DROP INDEX "IDX_invoices_status"`);
    await queryRunner.query(`DROP INDEX "IDX_invoices_due_date"`);
    await queryRunner.query(`DROP TABLE "invoices"`);
    await queryRunner.query(`DROP TYPE "invoice_status"`);
  }
}