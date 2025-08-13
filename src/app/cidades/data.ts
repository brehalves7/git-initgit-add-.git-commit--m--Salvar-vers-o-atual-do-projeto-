
'use client';

export interface City {
  id: number;
  name: string;
}

const CITIES_STORAGE_KEY = 'citiesData';

const initialCities: City[] = [
  { id: 1, name: 'Acará/PA' },
];

export const getCities = (): City[] => {
  if (typeof window === 'undefined') {
    return initialCities;
  }
  const savedData = localStorage.getItem(CITIES_STORAGE_KEY);
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        return parsedData;
      }
    } catch (e) {
      console.error("Failed to parse cities from localStorage", e);
      return initialCities;
    }
  }
  
  localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(initialCities));
  return initialCities;
};

export const saveCities = (data: City[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('citiesDataChanged'));
  }
};

export const addCity = (cityName: string) => {
  const cities = getCities();
  const newCity: City = {
    id: cities.length > 0 ? Math.max(...cities.map(c => c.id)) + 1 : 1,
    name: cityName,
  };
  const updatedCities = [...cities, newCity];
  saveCities(updatedCities);
};

export const deleteCity = (id: number) => {
  let cities = getCities();
  cities = cities.filter(c => c.id !== id);
  saveCities(cities);
};
