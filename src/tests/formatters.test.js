import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatOrderId, formatDimensions, formatFabric } from '../utils/formatters.js';

describe('Data & UI Formatters', () => {
  test('formatOrderId handles prefixes and numbers correctly', () => {
    assert.equal(formatOrderId(null), '#0000');
    assert.equal(formatOrderId(''), '#0000');
    assert.equal(formatOrderId('EMB-12345'), '#12345');
    assert.equal(formatOrderId('VEC-9988'), '#9988');
    assert.equal(formatOrderId('#4567'), '#4567');
    assert.equal(formatOrderId('ORD-8821'), '#ORD-8821');
  });

  test('formatDimensions formats strings, numbers, and dimension objects', () => {
    assert.equal(formatDimensions(null), '3.5" (Standard Width)');
    assert.equal(formatDimensions('4.0" x 2.5"'), '4.0" x 2.5"');
    assert.equal(formatDimensions(5), '5"');
    assert.equal(formatDimensions({ width: 4, height: 3, unit: 'in' }), '4" x 3" in');
    assert.equal(formatDimensions({ w: 6, h: 4 }), '6" x 4" in');
    assert.equal(formatDimensions({ width: 3.5 }), '3.5" in');
  });

  test('formatFabric formats fabric string or object specs', () => {
    assert.equal(formatFabric(null), 'Cotton / Poly Twill');
    assert.equal(formatFabric('Leather / Vinyl'), 'Leather / Vinyl');
    assert.equal(formatFabric({ name: 'Ripstop Nylon' }), 'Ripstop Nylon');
    assert.equal(formatFabric({ label: 'Pique Knit Polo' }), 'Pique Knit Polo');
  });
});
