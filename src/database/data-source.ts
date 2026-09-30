import '../config/load-env.js';
import { DataSource } from 'typeorm';
import { Invoice } from '../invoices/invoice.entity.js';
import { InvoiceLineItem } from '../invoices/invoice-line-item.entity.js';
import { CreateInvoices1770000000000 } from './migrations/1770000000000-CreateInvoices.js';

export const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  entities: [Invoice, InvoiceLineItem],
  migrations: [CreateInvoices1770000000000],
  synchronize: false,
});