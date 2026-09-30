import { dataSource } from './data-source.js';
import { Invoice } from '../invoices/invoice.entity.js';
import { InvoiceLineItem } from '../invoices/invoice-line-item.entity.js';
import { InvoiceStatus } from '../invoices/invoice-status.js';

const invoices = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    vendorName: 'Pioneer Concrete Supply',
    vendorEmail: 'billing@pioneerconcrete.example',
    invoiceNumber: 'PCS-80421',
    invoiceDate: '2026-09-18',
    dueDate: '2026-10-18',
    subtotal: '18420.00',
    tax: '1473.60',
    total: '19893.60',
    projectName: 'Riverfront Medical Center',
    status: InvoiceStatus.NEEDS_REVIEW,
    lineItems: [
      { id: 'a1111111-1111-4111-8111-111111111111', description: 'Ready-mix concrete, 4,000 PSI', quantity: '42.00', unitPrice: '285.00', amount: '11970.00' },
      { id: 'a1111111-1111-4111-8111-111111111112', description: 'Concrete pump and placement', quantity: '18.00', unitPrice: '358.33', amount: '6450.00' },
    ],
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    vendorName: 'Summit Rebar & Steel',
    vendorEmail: 'ap@summitrebar.example',
    invoiceNumber: 'SRS-11908',
    invoiceDate: '2026-09-20',
    dueDate: '2026-10-20',
    subtotal: '12750.00',
    tax: '1020.00',
    total: '13770.00',
    projectName: 'Eastside Transit Hub',
    status: InvoiceStatus.NEEDS_REVIEW,
    lineItems: [
      { id: 'a2222222-2222-4222-8222-222222222221', description: 'Grade 60 reinforcing bar, #5', quantity: '850.00', unitPrice: '10.00', amount: '8500.00' },
      { id: 'a2222222-2222-4222-8222-222222222222', description: 'Cutting and fabrication', quantity: '1.00', unitPrice: '4250.00', amount: '4250.00' },
    ],
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    vendorName: 'Cascadia Site Services',
    vendorEmail: 'invoices@cascadiasite.example',
    invoiceNumber: 'CSS-5572',
    invoiceDate: '2026-09-23',
    dueDate: '2026-10-23',
    subtotal: '6420.00',
    tax: '513.60',
    total: '6933.60',
    projectName: 'Northline Logistics Campus',
    status: InvoiceStatus.PROCESSING,
    lineItems: [
      { id: 'a3333333-3333-4333-8333-333333333331', description: 'Excavator, 36-ton, weekly rental', quantity: '2.00', unitPrice: '2210.00', amount: '4420.00' },
      { id: 'a3333333-3333-4333-8333-333333333332', description: 'Lowboy delivery and pickup', quantity: '1.00', unitPrice: '2000.00', amount: '2000.00' },
    ],
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    vendorName: 'Pioneer Concrete Supply',
    vendorEmail: 'billing@pioneerconcrete.example',
    invoiceNumber: 'PCS-80396',
    invoiceDate: '2026-09-14',
    dueDate: '2026-09-29',
    subtotal: '8840.00',
    tax: '707.20',
    total: '9547.20',
    projectName: 'Riverfront Medical Center',
    status: InvoiceStatus.APPROVED,
    lineItems: [
      { id: 'a4444444-4444-4444-8444-444444444441', description: 'Ready-mix concrete, 4,000 PSI', quantity: '24.00', unitPrice: '285.00', amount: '6840.00' },
      { id: 'a4444444-4444-4444-8444-444444444442', description: 'Concrete pump and placement', quantity: '1.00', unitPrice: '2000.00', amount: '2000.00' },
    ],
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    vendorName: 'Harbor Electric & Controls',
    vendorEmail: 'billing@harborelectric.example',
    invoiceNumber: 'HEC-26094',
    invoiceDate: '2026-09-16',
    dueDate: '2026-10-16',
    subtotal: '21800.00',
    tax: '1744.00',
    total: '23544.00',
    projectName: 'Eastside Transit Hub',
    status: InvoiceStatus.REJECTED,
    lineItems: [
      { id: 'a5555555-5555-4555-8555-555555555551', description: 'Panelboard assembly, 800A', quantity: '1.00', unitPrice: '16400.00', amount: '16400.00' },
      { id: 'a5555555-5555-4555-8555-555555555552', description: 'Feeder installation labor', quantity: '36.00', unitPrice: '150.00', amount: '5400.00' },
    ],
  },
  {
    id: '66666666-6666-4666-8666-666666666666',
    vendorName: 'Pioneer Concrete Supply',
    vendorEmail: 'billing@pioneerconcrete.example',
    invoiceNumber: 'PCS-80396',
    invoiceDate: '2026-09-15',
    dueDate: '2026-10-15',
    subtotal: '8840.00',
    tax: '707.20',
    total: '9547.20',
    projectName: 'Riverfront Medical Center',
    status: InvoiceStatus.NEEDS_REVIEW,
    lineItems: [
      { id: 'a6666666-6666-4666-8666-666666666661', description: 'Ready-mix concrete, 4,000 PSI', quantity: '24.00', unitPrice: '285.00', amount: '6840.00' },
      { id: 'a6666666-6666-4666-8666-666666666662', description: 'Concrete pump and placement', quantity: '1.00', unitPrice: '2000.00', amount: '2000.00' },
    ],
  },
];

async function seed() {
  await dataSource.initialize();
  try {
    const invoiceRows = invoices.map(({ lineItems: _lineItems, ...invoice }) => invoice);
    await dataSource.createQueryBuilder().insert().into(Invoice).values(invoiceRows).orIgnore().execute();

    const lineItems = invoices.flatMap((invoice) => invoice.lineItems.map((lineItem) => ({
      ...lineItem,
      invoice: { id: invoice.id },
    })));
    await dataSource.createQueryBuilder().insert().into(InvoiceLineItem).values(lineItems).orIgnore().execute();
    console.log(`Seeded ${invoices.length} sample invoices.`);
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error('Invoice seed failed:', error);
  process.exitCode = 1;
});