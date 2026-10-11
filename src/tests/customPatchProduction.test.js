import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const flow = fs.readFileSync('src/components/customer/StreamlinedOrderFlow.jsx', 'utf8');
const orders = fs.readFileSync('src/server/orders/handlers/post/createOrder.js', 'utf8');

test('physical patches use fixed 10–14 day production without any rush option', () => {
  assert.match(flow, /selectedService === 'patch' \? false/);
  assert.match(flow, /isRush = false;/);
  assert.doesNotMatch(flow, /patchTurnaround|setPatchTurnaround|Rush Express \(3–4 Days Production\)/);
  assert.match(flow, /10–14 days/);
  assert.match(flow, /'10–14 days'/);
  assert.match(orders, /Rush production is not available for Custom Patches/);
});

test('size selection supports custom dimensions and they survive the order save', () => {
  assert.match(flow, /patchSizeOption, setPatchSizeOption/);
  assert.match(flow, /value="custom">Custom Size/);
  assert.match(flow, /getPatchDimensions\(\)/);
  assert.match(flow, /patchWidth: selectedService === 'patch'/);
  assert.match(flow, /patchHeight: selectedService === 'patch'/);
  assert.match(flow, /patchSizeOption,\s*patchCustomWidth,\s*patchCustomHeight,/);
  assert.match(flow, /Enter a width and height between 0\.5 and 24 inches/);
  assert.match(orders, /primaryDbRow\.patchWidth = width/);
  assert.match(orders, /primaryDbRow\.patchHeight = height/);
  assert.match(orders, /patchProductionTime: primaryDbRow\.type === 'patch'/);
});

test('compact patch editor keeps minimum batch, one artwork file and summary details', () => {
  assert.match(flow, /id="bdigi-patch-quantity"/);
  assert.match(flow, /aria-label="Quick patch quantity"/);
  assert.match(flow, /Min 50/);
  assert.match(flow, /\? 'Upload Artwork'/);
  assert.match(flow, /\? '1 file required'/);
  assert.match(flow, /placeholder="Border, colors, notes\.\.\."/);
  assert.match(flow, /getPatchSizeLabel\(\)/);
  assert.match(flow, /disabled=\{isSubmitting \|\| isUploading \|\| !hasValidLivePrice\}/);
});
