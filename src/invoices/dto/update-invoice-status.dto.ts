import { IsIn } from 'class-validator';
import { InvoiceStatus } from '../invoice-status.js';

export class UpdateInvoiceStatusDto {
  @IsIn([InvoiceStatus.APPROVED, InvoiceStatus.REJECTED])
  status!: InvoiceStatus.APPROVED | InvoiceStatus.REJECTED;
}