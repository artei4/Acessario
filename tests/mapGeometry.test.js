import { test } from 'node:test';
import assert from 'node:assert/strict';
import { framePoints, fromLatLng, labelPoint, pointsKey, toLatLng } from '../src/components/map/mapGeometry.js';

test('converte [lat, lon] para o formato do Google Maps e de volta', () => {
  assert.deepEqual(toLatLng([-22.96, -43.18]), { lat: -22.96, lng: -43.18 });
  assert.deepEqual(fromLatLng({ lat: -22.96, lng: -43.18 }), [-22.96, -43.18]);
  assert.deepEqual(fromLatLng({ lat: () => 1, lng: () => 2 }), [1, 2], 'aceita google.maps.LatLng');
});

test('enquadra o foco quando existe; senão, rotas e marcadores', () => {
  const routes = [{ segments: [{ path: [[1, 1], [2, 2]] }] }];
  const markers = [{ point: [3, 3] }];
  assert.deepEqual(framePoints({ focus: [[9, 9]], routes, markers }), [[9, 9]]);
  assert.deepEqual(framePoints({ routes, markers }), [[1, 1], [2, 2], [3, 3]]);
});

test('a chave de enquadramento só muda quando os pontos mudam', () => {
  assert.equal(pointsKey([[1, 2]]), pointsKey([[1.000001, 2]]));
  assert.notEqual(pointsKey([[1, 2]]), pointsKey([[1.1, 2]]));
  assert.deepEqual(labelPoint([{ path: [[0, 0]] }, { path: [[5, 5]] }]), [5, 5]);
});
