import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  generateInvoiceNumber, 
  formatOrderId, 
  getOrderServiceTitle, 
  getOrderFormatsString, 
  getOrderTurnaroundTier, 
  getOrderPriceNumeric, 
  isOrderPaidStatus 
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
    assert.equal(getOrderServiceTitle({ serviceCategory: 'vector' }), 'Vector Graphic Conversion & Artwork Tracing');
    assert.equal(getOrderServiceTitle({ type: 'patch' }), 'Manufactured Custom Physical Patches');
    assert.equal(getOrderServiceTitle({ serviceCategory: 'embroidery' }), 'Commercial Embroidery Digitizing');
    assert.equal(getOrderServiceTitle(null), 'Commercial Embroidery Digitizing');
  });

  test('getOrderFormatsString formats deliverables accurately', () => {
    assert.equal(
      getOrderFormatsString({ requestedFormats: ['dst', 'pes', 'emb'] }),
      'DST, PES, EMB'
    );
    assert.equal(
      getOrderFormatsString({ serviceCategory: 'vector' }),
      'AI, EPS, SVG, High-Res PDF'
    );
    assert.equal(
      getOrderFormatsString({ serviceCategory: 'patch' }),
      'Physical Goods • Velcro / Iron-On Backing'
    );
  });

  test('getOrderTurnaroundTier accurately determines turnaround priority', () => {
    assert.equal(
      getOrderTurnaroundTier({ isRush: true }),
      'Express Priority Rush (4-8 Hours)'
    );
    assert.equal(
      getOrderTurnaroundTier({ turnaround: '2-4 hours' }),
      'Express Priority Rush (4-8 Hours)'
    );
    assert.equal(
      getOrderTurnaroundTier({ isRush: false }),
      'Standard Studio Turnaround (12-24 Hours)'
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
});
