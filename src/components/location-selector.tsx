
'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCountries, getStatesOfCountry, getCitiesOfState } from '@/app/(dashboard)/scraper/actions';
import { Skeleton } from './ui/skeleton';

interface Country {
  id: number;
  name: string;
  iso2: string;
  emoji: string;
}

interface State {
  id: number;
  name: string;
  iso2: string;
}

interface City {
  id: number;
  name: string;
}

export function LocationSelector() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');

  const [loading, setLoading] = useState({
    countries: true,
    states: false,
    cities: false,
  });

  useEffect(() => {
    async function fetchCountries() {
      setLoading(prev => ({ ...prev, countries: true }));
      const countryData = await getCountries();
      setCountries(countryData);
      setLoading(prev => ({ ...prev, countries: false }));
    }
    fetchCountries();
  }, []);

  const handleCountryChange = async (countryIso2: string) => {
    const country = countries.find(c => c.iso2 === countryIso2) || null;
    setSelectedCountry(country);
    setSelectedState('');
    setSelectedCity('');
    setStates([]);
    setCities([]);

    if (country) {
        setLoading(prev => ({ ...prev, states: true }));
        const stateData = await getStatesOfCountry(country.iso2);
        setStates(stateData);
        setLoading(prev => ({ ...prev, states: false }));
    }
  };

  const handleStateChange = async (stateIso2: string) => {
    setSelectedState(stateIso2);
    setSelectedCity('');
    setCities([]);

    if (selectedCountry) {
        setLoading(prev => ({ ...prev, cities: true }));
        const cityData = await getCitiesOfState(selectedCountry.iso2, stateIso2);
        setCities(cityData);
        setLoading(prev => ({ ...prev, cities: false }));
    }
  };
  
    const handleCityChange = (cityName: string) => {
        setSelectedCity(cityName);
    };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        {selectedCountry && <input type="hidden" name="country_name" value={selectedCountry.name} />}
        {loading.countries ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select name="country" onValueChange={handleCountryChange} value={selectedCountry?.iso2 ?? ''} required>
            <SelectTrigger>
              <SelectValue placeholder="Select a country">
                {selectedCountry ? (
                  <div className="flex items-center gap-2">
                    <span>{selectedCountry.emoji}</span>
                    <span>{selectedCountry.name}</span>
                  </div>
                ) : "Select a country"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {countries.map(c => (
                <SelectItem key={c.id} value={c.iso2}>
                    <div className="flex items-center gap-2">
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                    </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        {loading.states ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select name="state" onValueChange={handleStateChange} disabled={!selectedCountry || states.length === 0} value={selectedState}>
            <SelectTrigger>
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              {states.map(s => (
                <SelectItem key={s.id} value={s.iso2}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        {loading.cities ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select name="city" onValueChange={handleCityChange} disabled={!selectedState || cities.length === 0} value={selectedCity}>
            <SelectTrigger>
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map(c => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </>
  );
}
