
'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCities, City } from '@/app/cidades/data';

export const CitySelector = ({ onCityChange }: { onCityChange?: (city: string) => void }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [franqueadoCity, setFranqueadoCity] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const role = sessionStorage.getItem('userRole');
      setUserRole(role);
      if (role === 'pessoa') {
        // Busca cidade do franqueado
        const userName = sessionStorage.getItem('userName');
        let allUsers = [];
        const keys = Object.keys(localStorage).filter(k => k.startsWith('usersData_'));
        for (const key of keys) {
          try {
            const users = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(users)) allUsers = allUsers.concat(users);
          } catch {}
        }
        const user = allUsers.find(u => u.name === userName && u.role === 'pessoa');
        if (user && user.city) {
          setFranqueadoCity(user.city);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      const loadedCities = getCities();
      setCities(loadedCities);
      const savedCity = localStorage.getItem('selectedCity');
      if (savedCity && loadedCities.some(c => c.name === savedCity)) {
        setSelectedCity(savedCity);
        if (onCityChange) onCityChange(savedCity);
      } else if (loadedCities.length > 0) {
        const defaultCity = loadedCities[0].name;
        setSelectedCity(defaultCity);
        localStorage.setItem('selectedCity', defaultCity);
        if (onCityChange) onCityChange(defaultCity);
      }
    }
  }, [isClient, onCityChange]);

  useEffect(() => {
    if (isClient) {
        const handleCitiesChange = () => {
          const updatedCities = getCities();
          setCities(updatedCities);
          const currentSelectedCity = localStorage.getItem('selectedCity');
          if (!updatedCities.some(c => c.name === currentSelectedCity)) {
            const newSelected = updatedCities.length > 0 ? updatedCities[0].name : '';
            setSelectedCity(newSelected);
            localStorage.setItem('selectedCity', newSelected);
            if (onCityChange) onCityChange(newSelected);
          }
        };
        window.addEventListener('citiesDataChanged', handleCitiesChange);
        return () => window.removeEventListener('citiesDataChanged', handleCitiesChange);
    }
  }, [isClient, onCityChange]);


  const handleCityChange = (value: string) => {
    setSelectedCity(value);
    localStorage.setItem('selectedCity', value);
    if (onCityChange) {
      onCityChange(value);
    }
  };
  
  if (!isClient) {
    return null;
  }

  // Se for franqueado, mostra só a cidade fixa
  if (userRole === 'pessoa' && franqueadoCity) {
    return <span className="font-semibold text-primary">{franqueadoCity}</span>;
  }

  // Se for mestre, mostra o seletor normalmente
  if (userRole === 'mestre') {
    return (
      <Select onValueChange={handleCityChange} value={selectedCity}>
        <SelectTrigger className="w-auto border-0 bg-secondary px-4 py-2 font-semibold">
          <SelectValue placeholder="Selecione a cidade" />
        </SelectTrigger>
        <SelectContent>
          {cities.map(city => (
            <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Para outros perfis, não mostra nada
  return null;

  return (
    <Select onValueChange={handleCityChange} value={selectedCity}>
      <SelectTrigger className="w-auto border-0 bg-secondary px-4 py-2 font-semibold">
        <SelectValue placeholder="Selecione a cidade" />
      </SelectTrigger>
      <SelectContent>
        {cities.map(city => (
          <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
