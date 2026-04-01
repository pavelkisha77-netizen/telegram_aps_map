import { useState } from 'react';
import { Button, message } from 'antd';
import { AimOutlined } from '@ant-design/icons';
import { useMap } from 'react-leaflet';
import { useMapStore } from '../../store/store';
import './LocateControl.css';

export default function LocateControl() {
  const map = useMap();
  const setCurrentLocation = useMapStore((state) => state.setCurrentLocation);
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      message.error('Геолокация не поддерживается на этом устройстве');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setCurrentLocation({ lat, lng });

        map.flyTo([lat, lng], 15, {
          animate: true,
          duration: 1.2
        });

        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        message.error('Не удалось определить местоположение');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="locate-control">
      <Button
        shape="circle"
        size="large"
        className="locate-control__button"
        title="Найти ваше местоположение"
        icon={<AimOutlined />}
        loading={isLocating}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          handleLocate();
        }}
      />
    </div>
  );
}
