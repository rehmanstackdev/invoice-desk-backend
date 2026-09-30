import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Invoice } from './invoice.entity.js';

@Entity({ name: 'invoice_line_items' })
export class InvoiceLineItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 240 })
  description!: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  quantity!: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.lineItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice!: Relation<Invoice>;
}