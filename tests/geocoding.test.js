import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromPhotonFeature, placeName } from '../src/services/geocodingService.js';

const feature = (properties, coordinates = [-43.3653, -22.9993]) => ({ type: 'Feature', geometry: { type: 'Point', coordinates }, properties });

test('converte um lugar do Photon para o formato do app', () => {
  const place = fromPhotonFeature(
    feature({ osm_type: 'W', osm_id: 42, name: 'BarraShopping', street: 'Avenida das Américas', housenumber: '4666', district: 'Barra da Tijuca', city: 'Rio de Janeiro' }),
  );
  assert.deepEqual(place, {
    name: 'BarraShopping',
    neighborhood: 'Barra da Tijuca',
    label: 'Avenida das Américas, 4666 · Barra da Tijuca',
    lat: -22.9993,
    lon: -43.3653,
    osmId: 'way/42',
  });
});

test('endereço sem nome vira "Rua, número" (e não só o número)', () => {
  assert.equal(placeName({ street: 'Avenida das Américas', housenumber: '15900' }), 'Avenida das Américas, 15900');
  assert.equal(placeName({ district: 'Recreio dos Bandeirantes' }), 'Recreio dos Bandeirantes');
  const place = fromPhotonFeature(feature({ osm_type: 'N', osm_id: 7, street: 'Avenida das Américas', housenumber: '15900', district: 'Recreio dos Bandeirantes' }));
  assert.equal(place.name, 'Avenida das Américas, 15900');
  assert.equal(place.label, 'Recreio dos Bandeirantes', 'não repete a rua no detalhe');
  assert.equal(place.osmId, 'node/7');
});
