import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  generateInvoiceNumber, 
  formatOrderId, 
  getOrderServiceTitle, 
  getOrderFormatsString, 
  getOrderTurnaroundTier, 
  getOrderPriceNumeric, 
  isOrderPaidStatus,
  formatFabricSpec,
  formatDimensionsSpec,
  generateCustomerTaxInvoicePdf
} from '../utils/customerInvoicePdfGenerator.js';

describe('Customer Tax Invoice Generator & Legal Compliance', () => {
  test('generateInvoiceNumber creates deterministic international invoice numbers', () => {
    const order1 = { id: 'ORD-A1B2C3D4', createdAt: '2026-03-11T10:00:00Z' };
    assert.equal(generateInvoiceNumber(order1), 'INV-BD-2026-A1B2C3D4');

    const order2 = { id: '#5544332211', created_at: '2025-11-20T10:00:00Z' };
    assert.equal(generateInvoiceNumber(order2), 'INV-BD-2025-55443322');

    const orderEmpty = null;
    assert.match(generateInvoiceNumber(orderEmpty), /^INV-BD-\d{6}$/);
  });

  test('formatOrderId normalizes order identifiers cleanly', () => {
    assert.equal(formatOrderId('ORD-998877'), 'ORD-998877');
    assert.equal(formatOrderId('123456789'), 'ORD-12345678');
    assert.equal(formatOrderId(null), 'BD-0000');
  });

  test('getOrderServiceTitle correctly resolves commercial service descriptions', () => {
    assert.equal(getOrderServiceTitle({ serviceCategory: 'vector' }), 'Vector Art Tracing');
    assert.equal(getOrderServiceTitle({ type: 'patch' }), 'Custom Patches');
    assert.equal(getOrderServiceTitle({ serviceCategory: 'embroidery' }), 'Embroidery Digitizing');
    assert.equal(getOrderServiceTitle(null), 'Commercial Embroidery Digitizing');
  });

  test('getOrderFormatsString formats deliverables accurately', () => {
    assert.equal(
      getOrderFormatsString({ requestedFormats: ['dst', 'pes', 'emb'] }),
      'DST, PES, EMB'
    );
    assert.equal(
      getOrderFormatsString({ serviceCategory: 'vector' }),
      'AI, EPS, SVG, PDF'
    );
    assert.equal(
      getOrderFormatsString({ serviceCategory: 'patch' }),
      'Physical Goods'
    );
  });

  test('getOrderTurnaroundTier accurately determines turnaround priority', () => {
    assert.equal(
      getOrderTurnaroundTier({ isRush: true }),
      'Rush (4-8 hr)'
    );
    assert.equal(
      getOrderTurnaroundTier({ turnaround: '2-4 hours' }),
      'Rush (4-8 hr)'
    );
    assert.equal(
      getOrderTurnaroundTier({ isRush: false }),
      'Standard (12-24 hr)'
    );
  });

  test('getOrderPriceNumeric extracts numeric price with fallback for zero or invalid prices', () => {
    assert.equal(getOrderPriceNumeric({ price: '18.50' }), 18.50);
    assert.equal(getOrderPriceNumeric({ totalPrice: 24.00 }), 24.00);
    assert.equal(getOrderPriceNumeric({ price: 0, serviceCategory: 'vector' }), 12.00);
    assert.equal(getOrderPriceNumeric({ price: null, serviceCategory: 'patch' }), 25.00);
    assert.equal(getOrderPriceNumeric(null), 15.00);
  });

  test('isOrderPaidStatus accurately identifies paid versus pending invoices', () => {
    assert.equal(isOrderPaidStatus({ payment_status: 'paid' }), true);
    assert.equal(isOrderPaidStatus({ isPaid: true }), true);
    assert.equal(isOrderPaidStatus({ status: 'delivered' }), true);
    assert.equal(isOrderPaidStatus({ status: 'submitted', payment_status: 'pending' }), false);
  });

  test('formatFabricSpec and formatDimensionsSpec format order parameters correctly', () => {
    assert.equal(formatFabricSpec('Pique Cotton'), 'Pique Cotton');
    assert.equal(formatFabricSpec({ name: 'Fleece Twill' }), 'Fleece Twill');
    assert.equal(formatFabricSpec(null), '');

    assert.equal(formatDimensionsSpec('3.5 x 2.5 in'), '3.5 x 2.5 in');
    assert.equal(formatDimensionsSpec(4), '4"');
    assert.equal(formatDimensionsSpec({ width: '3.5', height: '2.5', unit: 'in' }), '3.5" x 2.5" in');
    assert.equal(formatDimensionsSpec(null), '');
  });

  test('generateCustomerTaxInvoicePdf produces complete, valid commercial invoice PDF', async () => {
    const fullOrder = {
      id: 'ORD-PROD8899',
      title: 'Monogram Crest Embroidery',
      price: 28.50,
      discount_amount: 5.00,
      rush_fee: 10.00,
      isPaid: true,
      paid_at: '2026-09-25T08:30:00Z',
      createdAt: '2026-09-25T07:15:00Z',
      fabric: 'Pique Cotton Polo',
      dimensions: '3.5" x 2.5"',
      placement: 'Left Chest',
      requestedFormats: ['dst', 'pes', 'emb'],
      notes: 'Please apply dense underlay stitching for pique stretch resistance.',
      payment_method: 'Stripe Corporate Card'
    };

    const client = {
      name: 'Robert Vance',
      company: 'Vance Refrigeration Apparel',
      email: 'robert@vanceapparel.com',
      phone: '+1 (555) 234-5678',
      address: 'Scranton, PA, USA'
    };

    const result = await generateCustomerTaxInvoicePdf({ order: fullOrder, client });

    assert.ok(result);
    assert.equal(result.invoiceNumber, 'INV-BD-2026-PROD8899');
    assert.equal(result.filename, 'INV-BD-2026-PROD8899_Invoice.pdf');
    assert.ok(result.blob);
    assert.ok(result.blob.size > 2000, `Expected PDF blob size > 2000 bytes, got ${result.blob.size}`);
    assert.equal(typeof result.downloadPdf, 'function');
  });

  test('generateCustomerTaxInvoicePdf handles unauthenticated or minimal order safely', async () => {
    const minimalOrder = {
      id: 'ORD-MINIMAL1',
      price: 15.00,
      status: 'awaiting_payment'
    };

    const result = await generateCustomerTaxInvoicePdf({ order: minimalOrder, client: null });
    assert.ok(result);
    assert.equal(result.invoiceNumber, 'INV-BD-2026-MINIMAL1');
    assert.ok(result.blob.size > 1000);
  });
});
