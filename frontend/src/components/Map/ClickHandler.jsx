import { useMapEvents } from 'react-leaflet';
import { useMapStore } from '../../store/store';

function isInteractiveElement(target) {
  if (!target || !(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest('.leaflet-control') ||
    target.closest('.leaflet-marker-icon') ||
    target.closest('.leaflet-popup') ||
    target.closest('.leaflet-tooltip') ||
    target.closest('.ant-select') ||
    target.closest('.ant-btn') ||
    target.closest('.ant-modal') ||
    target.closest('.map-logo-control') ||
    target.closest('.city-select') ||
    target.closest('.locate-control') ||
    target.closest('.ant-btn-icon') ||
    target.closest('svg')
  );
}

export default function ClickHandler() {
  const setDraftPoint = useMapStore((state) => state.setDraftPoint);

  useMapEvents({
    click(e) {
      const originalTarget = e.originalEvent?.target;

      if (isInteractiveElement(originalTarget)) {
        return;
      }
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
