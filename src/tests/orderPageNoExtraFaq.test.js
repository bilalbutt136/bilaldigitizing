import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('order page no longer includes the extra FAQ and WhatsApp help container', () => {
  const page = readFileSync('app/order/page.jsx', 'utf8');
  for (const removed of [
    'ORDER FAQS & CONFIDENCE ACCORDION',
    'Frequently Asked Questions',
    'What machine file formats will I receive?',
    "What if the file doesn't stitch out properly?",
    'How does Custom Patch manufacturing work?',
    'Do I need to create an account before ordering?',
    'NEED HELP STRIP',
    'Chat with a Master Digitizer on WhatsApp'
  ]) {
    assert.equal(page.includes(removed), false, 'Unexpected extra content: ' + removed);
  }
});

test('direct order form and service routing remain unchanged', () => {
  const page = readFileSync('app/order/page.jsx', 'utf8');
  assert.match(page, /export default async function OrderPage/);
  assert.match(page, /params\?\.service \|\| params\?\.type \|\| null/);
  assert.match(page, /<StreamlinedOrderFlow initialService=\{service\} \/>/);
  assert.match(page, /Choose a service and package/);
});
