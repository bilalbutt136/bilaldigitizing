import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relativePath =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('StreamlinedOrderFlow includes initial 3-service selection screen and transition', () => {
  const source = read('src/components/customer/StreamlinedOrderFlow.jsx');

  // Verify state for service selection exists
  assert.equal(source.includes('hasSelectedService'), true);
  assert.equal(source.includes('setHasSelectedService'), true);
  assert.equal(source.includes('handleSelectService'), true);

  // Verify the 3 core service cards exist in Step 1
  assert.equal(source.includes('Embroidery Digitizing'), true);
  assert.equal(source.includes('Vector Art Conversion'), true);
  assert.equal(source.includes('Custom Patches'), true);

  // Verify Change Service button exists in Step 2 to return to service selection
  assert.equal(source.includes('Change Service'), true);
  assert.equal(source.includes('setHasSelectedService(false)'), true);
});

test('Custom Patches flow strictly enforces default 50 and minimum 50 patches', () => {
  const source = read('src/components/customer/StreamlinedOrderFlow.jsx');

  // Verify patchQuantity state is separated and defaults to 50
  assert.equal(source.includes('patchQuantity, setPatchQuantity] = useState(50)'), true);

  // Verify stepper decrement is disabled at <= 50
  assert.equal(source.includes('disabled={Number(patchQuantity) <= 50}'), true);

  // Verify minimum 50 clamp logic
  assert.equal(source.includes('Math.max(50,'), true);

  // Verify pricing calculation uses safePatchQty with minimum 50
  assert.equal(source.includes('safePatchQty = Math.max(50,'), true);
  assert.equal(source.includes('unitBase * safePatchQty'), true);

  // Verify submission strictly validates minimum 50
  assert.equal(source.includes('Minimum 50 Patches Required'), true);
});

test('Artwork upload for Patches asks for patch logo/artwork rather than 50 separate files', () => {
  const source = read('src/components/customer/StreamlinedOrderFlow.jsx');

  // For patches, upload header must specifically say Patch Artwork or Logo
  assert.equal(source.includes('Upload Patch Artwork or Logo'), true);
  assert.equal(source.includes('1 artwork file required'), true);
});

test('Embroidery and Vector maintain clean designQuantity separation', () => {
  const source = read('src/components/customer/StreamlinedOrderFlow.jsx');

  // Verify designQuantity is separated and defaults to 1
  assert.equal(source.includes('designQuantity, setDesignQuantity] = useState(1)'), true);
  assert.equal(source.includes('Number of Designs'), true);
});

test('Order page and wizard modal support initial 3 services selection', () => {
  const orderPageSource = read('app/order/page.jsx');
  const modalSource = read('src/components/customer/OrderWizardModal.jsx');

  // app/order/page.jsx passes null if searchParams has no service/type
  assert.equal(orderPageSource.includes("searchParams.get('service') || searchParams.get('type') || null"), true);

  // OrderWizardModal passes null when type is 'all'
  assert.equal(modalSource.includes("orderWizardInitialData?.type === 'all'"), true);
});
