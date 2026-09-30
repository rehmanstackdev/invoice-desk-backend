import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service.js';
import { Invoice } from './invoice.entity.js';
import { InvoiceStatus } from './invoice-status.js';

describe('InvoicesService', () => {
  const firstInvoice = {
    id: '11111111-1111-4111-8111-111111111111',
    vendorName: 'Pioneer Concrete Supply',
    invoiceNumber: 'PCS-80396',
    status: InvoiceStatus.APPROVED,
    lineItems: [],
  } as Invoice;
  const duplicateInvoice = Object.assign(new Invoice(), firstInvoice, {
    id: '66666666-6666-4666-8666-666666666666',
    vendorName: ' pioneer concrete supply ',
    status: InvoiceStatus.NEEDS_REVIEW,
  });
  const repository = {
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };
  const service = new InvoicesService(repository as never);

  beforeEach(() => {
    vi.clearAllMocks();
    repository.find.mockResolvedValue([firstInvoice, duplicateInvoice]);
  });

  it('marks matching vendor and invoice numbers as duplicates before filtering', async () => {
    const results = await service.findAll(InvoiceStatus.NEEDS_REVIEW);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: duplicateInvoice.id,
      isDuplicate: true,
      duplicateOf: firstInvoice.id,
    });
  });

  it('rejects approval of a potential duplicate', async () => {
    await expect(service.updateStatus(duplicateInvoice.id, InvoiceStatus.APPROVED))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows a review invoice to be rejected and persists the decision', async () => {
    repository.find.mockResolvedValue([duplicateInvoice]);
    repository.save.mockImplementation(async (invoice: Invoice) => {
      repository.find.mockResolvedValue([invoice]);
      return invoice;
    });

    const result = await service.updateStatus(duplicateInvoice.id, InvoiceStatus.REJECTED);

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ status: InvoiceStatus.REJECTED }));
    expect(result.status).toBe(InvoiceStatus.REJECTED);
  });

  it('creates a processing invoice with line items and returns the saved record', async () => {
    const createdInvoice = Object.assign(new Invoice(), {
      id: '77777777-7777-4777-8777-777777777777',
      vendorName: 'Metro Electric',
      vendorEmail: 'billing@metroelectric.example',
      invoiceNumber: 'ME-4401',
      invoiceDate: '2026-10-01',
      dueDate: '2026-10-31',
      subtotal: '1000.00',
      tax: '80.00',
      total: '1080.00',
      projectName: 'Civic Center Lighting',
      status: InvoiceStatus.PROCESSING,
      lineItems: [{ description: 'LED fixture install', quantity: '10.00', unitPrice: '100.00', amount: '1000.00' }],
    });

    repository.create.mockReturnValue(createdInvoice);
    repository.save.mockResolvedValue(createdInvoice);
    repository.find.mockResolvedValue([createdInvoice]);

    const result = await service.create({
      vendorName: 'Metro Electric',
      vendorEmail: 'billing@metroelectric.example',
      invoiceNumber: 'ME-4401',
      invoiceDate: '2026-10-01',
      dueDate: '2026-10-31',
      subtotal: 1000,
      tax: 80,
      total: 1080,
      projectName: 'Civic Center Lighting',
      lineItems: [{ description: 'LED fixture install', quantity: 10, unitPrice: 100, amount: 1000 }],
    });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      vendorName: 'Metro Electric',
      status: InvoiceStatus.PROCESSING,
    }));
    expect(repository.save).toHaveBeenCalledWith(createdInvoice);
    expect(result.status).toBe(InvoiceStatus.PROCESSING);
  });

  it('returns not found for an unknown invoice', async () => {
    repository.find.mockResolvedValue([]);
    await expect(service.findOne('11111111-1111-4111-8111-111111111111'))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});