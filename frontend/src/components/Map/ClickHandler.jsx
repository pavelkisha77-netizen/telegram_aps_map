import { useMapEvents } from 'react-leaflet';
import { useMapStore } from '../../store/store';

export default function ClickHandler() {
  const setDraftPoint = useMapStore((state) => state.setDraftPoint);

  useMapEvents({
    click(e) {
      setDraftPoint({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        title: '',
        description: '',
        media: []
      });
    }
  });

  return null;
}
