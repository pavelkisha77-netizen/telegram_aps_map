import { Select } from 'antd';
import { useMapStore } from '../../store/store';
import { UKRAINE_CITIES } from '../../constants/cities';
import './CitySelect.css';

export default function CitySelect() {
  const selectedCity = useMapStore((state) => state.selectedCity);
  const setSelectedCity = useMapStore((state) => state.setSelectedCity);

  return (
    <div className="city-select">
      <Select
        showSearch
        placeholder="Оберіть місто"
        className="city-select__input"
        value={selectedCity?.value}
        optionFilterProp="label"
        options={UKRAINE_CITIES.map((city) => ({
          value: city.value,
          label: city.label
        }))}
        onChange={(value) => {
          const city = UKRAINE_CITIES.find((item) => item.value === value);
          setSelectedCity(city || null);
        }}
      />
    </div>
  );
}
