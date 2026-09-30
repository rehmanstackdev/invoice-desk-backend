import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InvoiceLineItem } from './invoice-line-item.entity.js';
import { InvoiceStatus } from './invoice-status.js';

@Entity({ name: 'invoices' })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'vendor_name', type: 'varchar', length: 180 })
  vendorName!: string;

  @Column({ name: 'vendor_email', type: 'varchar', length: 254 })
  vendorEmail!: string;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100 })
  invoiceNumber!: string;

  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate!: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  tax!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total!: string;

  @Column({ name: 'project_name', type: 'varchar', length: 180 })
  projectName!: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    enumName: 'invoice_status',
    default: InvoiceStatus.PROCESSING,
  })
  status!: InvoiceStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => InvoiceLineItem, (lineItem) => lineItem.invoice)
  lineItems!: InvoiceLineItem[];
}