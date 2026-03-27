import { MapContainer, Marker, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { useMapStore } from '../../store/store';
import ClickHandler from './ClickHandler';
import L from 'leaflet';
import './MapView.css';

const VISICOM_TILES_KEY = import.meta.env.VITE_VISICOM_API_KEY;

// фикс стандартной иконки leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function MapView() {
  const points = useMapStore((state) => state.points);
  const draftPoint = useMapStore((state) => state.draftPoint);
  const setSelectedPoint = useMapStore((state) => state.setSelectedPoint);

  return (
    <MapContainer center={[50.4501, 30.5234]} zoom={10} className="map-view__container">
      <TileLayer
        url={`https://tms{s}.visicom.ua/2.0.0/planet3/base/{z}/{x}/{y}.png?key=${VISICOM_TILES_KEY}`}
        attribution="Map data © Visicom"
        subdomains="123"
        maxZoom={19}
        tms={true}
      />

      <ClickHandler />

      {points.map((point) => (
        <Marker
          key={point._id}
          position={[point.location.lat, point.location.lng]}
          eventHandlers={{
            click: () => setSelectedPoint(point)
          }}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <div className="marker-tooltip">
              {point.description ? (
                <div className="marker-tooltip__text">
                  {point.description.length > 18
                    ? `${point.description.slice(0, 18)}...`
                    : point.description}
                </div>
              ) : null}
            </div>
          </Tooltip>
        </Marker>
      ))}

      {draftPoint && <Marker position={[draftPoint.lat, draftPoint.lng]} />}
    </MapContainer>
  );
}
