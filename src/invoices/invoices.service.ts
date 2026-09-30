import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { Invoice } from './invoice.entity.js';
import { InvoiceStatus } from './invoice-status.js';

type InvoiceWithDuplicate = Invoice & {
  isDuplicate: boolean;
  duplicateOf: string | null;
};

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
  ) {}

  async findAll(status?: InvoiceStatus): Promise<InvoiceWithDuplicate[]> {
    const invoices = await this.invoicesRepository.find({
      relations: { lineItems: true },
      order: { dueDate: 'ASC', createdAt: 'ASC' },
    });
    const counts = new Map<string, Invoice[]>();

    for (const invoice of invoices) {
      const key = this.duplicateKey(invoice);
      counts.set(key, [...(counts.get(key) ?? []), invoice]);
    }

    return invoices
      .filter((invoice) => !status || invoice.status === status)
      .map((invoice) => {
        const duplicates = counts.get(this.duplicateKey(invoice)) ?? [];
        const match = duplicates.find((candidate) => candidate.id !== invoice.id);
        return Object.assign(new Invoice(), invoice, {
          isDuplicate: duplicates.length > 1,
          duplicateOf: match?.id ?? null,
        });
      });
  }

  async findOne(id: string): Promise<InvoiceWithDuplicate> {
    const invoice = (await this.findAll()).find((item) => item.id === id);
    if (!invoice) throw new NotFoundException('Invoice not found.');
    return invoice;
  }

  async create(createInvoiceDto: CreateInvoiceDto): Promise<InvoiceWithDuplicate> {
    if (!createInvoiceDto.lineItems?.length) {
      throw new BadRequestException('Invoice must include at least one line item.');
    }

    const invoice = this.invoicesRepository.create({
      ...createInvoiceDto,
      status: createInvoiceDto.status ?? InvoiceStatus.PROCESSING,
      subtotal: this.toDecimalString(createInvoiceDto.subtotal),
      tax: this.toDecimalString(createInvoiceDto.tax),
      total: this.toDecimalString(createInvoiceDto.total),
      lineItems: createInvoiceDto.lineItems.map((lineItem) => ({
        ...lineItem,
        quantity: this.toDecimalString(lineItem.quantity),
        unitPrice: this.toDecimalString(lineItem.unitPrice),
        amount: this.toDecimalString(lineItem.amount),
      })),
    });

    const savedInvoice = await this.invoicesRepository.save(invoice);
    return this.findOne(savedInvoice.id);
  }

  async updateStatus(
    id: string,
    status: InvoiceStatus.APPROVED | InvoiceStatus.REJECTED,
  ): Promise<InvoiceWithDuplicate> {
    const invoice = await this.findOne(id);
    if (invoice.status !== InvoiceStatus.NEEDS_REVIEW) {
      throw new BadRequestException('Only invoices needing review can be approved or rejected.');
    }
    if (status === InvoiceStatus.APPROVED && invoice.isDuplicate) {
      throw new BadRequestException('Potential duplicates cannot be approved. Reject the duplicate or review the matching invoice first.');
    }

    invoice.status = status;
    await this.invoicesRepository.save(invoice);
    return this.findOne(id);
  }

  private duplicateKey(invoice: Invoice) {
    return `${invoice.vendorName.trim().toLocaleLowerCase()}::${invoice.invoiceNumber.trim().toLocaleLowerCase()}`;
  }

  private toDecimalString(value: number | string): string {
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException('Invoice totals and line item amounts must be valid numbers.');
    }
    return parsed.toFixed(2);
  }
}