import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('admin delivery uploads files before enabling send and exposes per-file progress', () => {
  const drawer = read('src/components/customer/OrderTrackerDrawer.jsx');
  const storage = read('src/services/supabaseService.js');

  assert.match(drawer, /uploadAdminDeliveryFile/);
  assert.match(drawer, /allAdminFilesUploaded/);
  assert.match(drawer, /hasAdminUploadFailures/);
  assert.match(drawer, /adminOverallUploadProgress/);
  assert.match(drawer, /progress === 100/);
  assert.match(drawer, /Upload complete and verified/);
  assert.match(drawer, /Retry failed uploads before sending/);
  assert.match(drawer, /disabled=\{isDelivering \|\| isAdminUploading \|\| hasAdminUploadFailures \|\| !allAdminFilesUploaded\}/);
  assert.equal(drawer.includes("'Uploading & Delivering...'"), false);

  assert.match(storage, /Math\.min\(99, Math\.round/);
  assert.match(storage, /if \(onProgress\) onProgress\(100\)/);
  assert.match(storage, /xhr\.upload\.onprogress/);
});

test('admin delivery history stays visible after revision and is hydrated from the full order', () => {
  const drawer = read('src/components/customer/OrderTrackerDrawer.jsx');

  assert.match(drawer, /Delivery History/);
  assert.match(drawer, /previous files stay available during revisions and re-delivery/);
  assert.match(drawer, /\{allDeliveries\.length > 0 && \(/);
  assert.equal(drawer.includes('{isDelivered && ('), false);
  assert.match(drawer, /needsAdminHydration/);
  assert.match(drawer, /fetchOrderById\(cleanSelId\)/);
  assert.match(drawer, /selectedHasFullDeliveryData/);
});

test('delivery finalization persists only verified uploaded URLs and checks the server result', () => {
  const drawer = read('src/components/customer/OrderTrackerDrawer.jsx');
  const state = read('src/context/StateContext.jsx');
  const service = read('src/services/supabaseService.js');

  assert.match(drawer, /uploadedCloudinaryFiles\.length !== adminFilesList\.length/);
  assert.match(drawer, /files: uploadedCloudinaryFiles/);
  assert.match(drawer, /deliveryResult\?\.success === false/);
  assert.equal(drawer.includes('url: fileObj.url'), false);

  assert.match(service, /Order update failed with status/);
  assert.match(state, /persistenceResult\?\.success/);
  assert.match(state, /return \{ success: true \}/);
});
