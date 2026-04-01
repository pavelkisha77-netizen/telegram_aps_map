import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export function MapLogoControl() {
  const map = useMap();

  useEffect(() => {
    const control = L.control({ position: 'topleft' });

    control.onAdd = function () {
      const div = L.DomUtil.create('div', 'map-logo-control');

      div.innerHTML = `
        <a
          href="https://telegra.ph/Kak-pomoch-rodstvenniku-ujti-v-SZCH-Algoritm-03-14"
          target="_blank"
          rel="noopener noreferrer"
          class="map-logo-control__link"
          title="Как помочь родственнику уйти в СЗЧ"
        >
          <img
            src="/save_logo.jpeg"
            alt="SMS"
            class="map-logo-control__image"
          />
        </a>
      `;

      L.DomEvent.disableClickPropagation(div);
      return div;
    };

    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map]);

  return null;
}
