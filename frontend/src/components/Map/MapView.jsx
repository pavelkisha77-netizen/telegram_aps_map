import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { useMapStore } from '../../store/store';
import ClickHandler from './ClickHandler';
import L from 'leaflet';
import './MapView.css';
import { MapLogoControl } from './MapLogoControl';
import { useEffect } from 'react';
import LocateControl from './LocateControl';

const VISICOM_TILES_KEY = import.meta.env.VITE_VISICOM_API_KEY;

function createColorMarker(color = 'red') {
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `<div class="custom-marker custom-marker--${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10]
  });
}

function MapCityController() {
  const map = useMap();
  const selectedCity = useMapStore((state) => state.selectedCity);

  useEffect(() => {
    if (!selectedCity) return;

    map.setView([selectedCity.lat, selectedCity.lng], selectedCity.zoom || 11, {
      animate: true
    });
  }, [selectedCity, map]);

  return null;
}

export default function MapView() {
  const points = useMapStore((state) => state.points);
  const draftPoint = useMapStore((state) => state.draftPoint);
  const setSelectedPoint = useMapStore((state) => state.setSelectedPoint);
  const currentLocation = useMapStore((state) => state.currentLocation);

  return (
    <MapContainer center={[50.4501, 30.5234]} zoom={8} className="map-view__container">
      <TileLayer
        url={`https://tms{s}.visicom.ua/2.0.0/planet3/base/{z}/{x}/{y}.png?key=${VISICOM_TILES_KEY}`}
        attribution="Map data © Visicom"
        subdomains="123"
        maxZoom={19}
        tms={true}
      />
      <MapLogoControl />
      <MapCityController />
      <LocateControl />
      <ClickHandler />

      {points
        .filter(
          (point) =>
            point?.location &&
            typeof point.location.lat === 'number' &&
            typeof point.location.lng === 'number'
        )
        .map((point) => (
          <Marker
            key={point._id}
            position={[point.location.lat, point.location.lng]}
            icon={createColorMarker(point.markerColor)}
            eventHandlers={{
              click: () => setSelectedPoint(point)
            }}
          >
            <Tooltip direction="top" offset={[0, -12]} opacity={1}>
              <div className="marker-tooltip">
                {point.description ? (
                  <div className="marker-tooltip__text">
                    {point.description.length > 20
                      ? `${point.description.slice(0, 20)}...`
                      : point.description}
                  </div>
                ) : null}
              </div>
            </Tooltip>
          </Marker>
        ))}

      {draftPoint && (
        <Marker position={[draftPoint.lat, draftPoint.lng]} icon={createColorMarker('red')} />
      )}

      {currentLocation && (
        <Marker
          position={[currentLocation.lat, currentLocation.lng]}
          icon={createColorMarker('blue')}
        >
          <Tooltip direction="top" offset={[0, -12]} opacity={1}>
            <div className="marker-tooltip">
              <div className="marker-tooltip__title">Вы здесь</div>
            </div>
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}
