const VISICOM_API_KEY = import.meta.env.VITE_VISICOM_DATA_KEY;
const VISICOM_BASE_URL = 'https://api.visicom.ua/data-api/5.0/uk/geocode.json';

function extractCoordinates(feature) {
  const coords = feature?.geo_centroid?.coordinates;

  if (Array.isArray(coords) && coords.length >= 2) {
    return {
      lng: coords[0],
      lat: coords[1]
    };
  }

  return {
    lng: null,
    lat: null
  };
}

function mapFeatureToOption(feature) {
  const props = feature?.properties || {};
  const { lat, lng } = extractCoordinates(feature);

  return {
    id: feature?.id || `${props.name || 'item'}-${Math.random()}`,
    label: props.name || 'Без названия',
    name: props.name || '',
    type: props.type || '',
    settlement: props.settlement || '',
    lat,
    lng,
    raw: feature
  };
}

async function visicomRequest(params = {}) {
  const searchParams = new URLSearchParams({
    key: VISICOM_API_KEY,
    limit: '10',
    ...params
  });

  const res = await fetch(`${VISICOM_BASE_URL}?${searchParams.toString()}`);

  if (!res.ok) {
    throw new Error('Ошибка запроса к Visicom');
  }

  return res.json();
}

export async function searchCities(query) {
  if (!query || !query.trim()) return [];

  const data = await visicomRequest({
    categories: 'adm_settlement',
    text: query.trim(),
    country: 'UA'
  });

  return (data?.features || []).map(mapFeatureToOption);
}

export async function searchStreets(cityName, query) {
  if (!cityName || !cityName.trim() || !query || !query.trim()) return [];

  const data = await visicomRequest({
    categories: 'adr_street',
    text: `${cityName}, ${query}`,
    country: 'UA'
  });

  return (data?.features || [])
    .map(mapFeatureToOption)
    .filter((item) => item.settlement === cityName);
}
