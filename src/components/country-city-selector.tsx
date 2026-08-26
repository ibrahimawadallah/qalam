"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from 'next-intl';

interface Country {
  code: string;
  name: string;
  cities: string[];
}

const COUNTRIES: Country[] = [
  { code: "SA", name: "Saudi Arabia", cities: ["Mecca", "Medina", "Riyadh", "Jeddah", "Dammam", "Taif", "Tabuk", "Buraydah"] },
  { code: "EG", name: "Egypt", cities: ["Cairo", "Alexandria", "Giza", "Luxor", "Aswan", "Mansoura", "Tanta"] },
  { code: "AE", name: "United Arab Emirates", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain"] },
  { code: "KW", name: "Kuwait", cities: ["Kuwait City", "Hawalli", "Farwaniya", "Jahra"] },
  { code: "QA", name: "Qatar", cities: ["Doha", "Al Rayyan", "Al Wakrah", "Umm Salamal"] },
  { code: "BH", name: "Bahrain", cities: ["Manama", "Riffa", "Muharraq"] },
  { code: "OM", name: "Oman", cities: ["Muscat", "Salalah", "Sohar", "Nizwa"] },
  { code: "JO", name: "Jordan", cities: ["Amman", "Zarqa", "Irbid", "Aqaba"] },
  { code: "LB", name: "Lebanon", cities: ["Beirut", "Tripoli", "Sidon", "Tyre", "Byblos"] },
  { code: "SY", name: "Syria", cities: ["Damascus", "Aleppo", "Homs", "Hama", "Latakia"] },
  { code: "IQ", name: "Iraq", cities: ["Baghdad", "Basra", "Mosul", "Erbil", "Najaf", "Karbala"] },
  { code: "PS", name: "Palestine", cities: ["Gaza", "Ramallah", "Hebron", "Nablus", "Jerusalem"] },
  { code: "MA", name: "Morocco", cities: ["Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir", "Meknes"] },
  { code: "DZ", name: "Algeria", cities: ["Algiers", "Oran", "Constantine", "Annaba", "Blida"] },
  { code: "TN", name: "Tunisia", cities: ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte"] },
  { code: "LY", name: "Libya", cities: ["Tripoli", "Benghazi", "Misrata", "Bayda"] },
  { code: "SD", name: "Sudan", cities: ["Khartoum", "Omdurman", "Port Sudan", "Kassala", "Nyala"] },
  { code: "YE", name: "Yemen", cities: ["Sanaa", "Aden", "Taiz", "Hodeidah", "Mukalla"] },
  { code: "TR", name: "Turkey", cities: ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Konya", "Gaziantep", "Kayseri"] },
  { code: "IR", name: "Iran", cities: ["Tehran", "Mashhad", "Isfahan", "Shiraz", "Tabriz", "Qom", "Ahvaz"] },
  { code: "PK", name: "Pakistan", cities: ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Peshawar", "Quetta", "Multan"] },
  { code: "IN", name: "India", cities: ["Delhi", "Mumbai", "Hyderabad", "Bangalore", "Kolkata", "Chennai", "Lucknow", "Aurangabad", "Srinagar", "Bhopal", "Ahmedabad"] },
  { code: "BD", name: "Bangladesh", cities: ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Comilla"] },
  { code: "ID", name: "Indonesia", cities: ["Jakarta", "Surabaya", "Bandung", "Medan", "Bekasi", "Tangerang"] },
  { code: "MY", name: "Malaysia", cities: ["Kuala Lumpur", "Penang", "Johor Bahru", "Malacca", "Ipoh", "Kota Kinabalu"] },
  { code: "DE", name: "Germany", cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen"] },
  { code: "FR", name: "France", cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Strasbourg", "Nice", "Nantes", "Lille"] },
  { code: "GB", name: "United Kingdom", cities: ["London", "Birmingham", "Manchester", "Leeds", "Bradford", "Glasgow", "Cardiff", "Leicester"] },
  { code: "US", name: "United States", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Detroit", "Dallas", "Phoenix", "San Francisco", "Washington D.C.", "Paterson"] },
  { code: "CA", name: "Canada", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton"] },
  { code: "AU", name: "Australia", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"] },
  { code: "NL", name: "Netherlands", cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"] },
  { code: "BE", name: "Belgium", cities: ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liège"] },
  { code: "SE", name: "Sweden", cities: ["Stockholm", "Malmö", "Gothenburg", "Uppsala", "Västerås"] },
  { code: "NO", name: "Norway", cities: ["Oslo", "Bergen", "Trondheim", "Stavanger"] },
  { code: "FI", name: "Finland", cities: ["Helsinki", "Espoo", "Tampere", "Vantaa"] },
  { code: "DK", name: "Denmark", cities: ["Copenhagen", "Aarhus", "Odense", "Aalborg"] },
  { code: "IT", name: "Italy", cities: ["Milan", "Rome", "Turin", "Bologna", "Florence", "Palermo", "Naples", "Genoa", "Brescia"] },
  { code: "ES", name: "Spain", cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Malaga", "Murcia", "Granada", "Cordoba"] },
  { code: "PT", name: "Portugal", cities: ["Lisbon", "Porto", "Amadora", "Braga", "Faro", "Coimbra"] },
  { code: "GR", name: "Greece", cities: ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa"] },
  { code: "RU", name: "Russia", cities: ["Moscow", "Saint Petersburg", "Kazan", "Ufa", "Chelyabinsk", "Rostov-on-Don"] },
  { code: "CN", name: "China", cities: ["Beijing", "Shanghai", "Guangzhou", "Yinchuan", "Lanzhou", "Urumqi"] },
  { code: "JP", name: "Japan", cities: ["Tokyo", "Osaka", "Yokohama", "Nagoya", "Sapporo", "Fukuoka", "Kobe"] },
  { code: "KR", name: "South Korea", cities: ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon"] },
  { code: "PH", name: "Philippines", cities: ["Manila", "Cebu", "Davao", "Quezon City"] },
  { code: "TH", name: "Thailand", cities: ["Bangkok", "Nonthaburi", "Pattaya", "Hat Yai", "Chiang Mai", "Phuket"] },
  { code: "VN", name: "Vietnam", cities: ["Ho Chi Minh City", "Hanoi", "Hai Phong", "Da Nang", "Can Tho"] },
  { code: "NG", name: "Nigeria", cities: ["Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt", "Kaduna"] },
  { code: "KE", name: "Kenya", cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"] },
  { code: "ZA", name: "South Africa", cities: ["Cape Town", "Johannesburg", "Durban", "Pretoria", "Port Elizabeth"] },
  { code: "ET", name: "Ethiopia", cities: ["Addis Ababa", "Dire Dawa", "Mekelle", "Gondar", "Awassa", "Harar"] },
  { code: "SO", name: "Somalia", cities: ["Mogadishu", "Hargeisa", "Bosaso", "Kismayo", "Galkayo"] },
  { code: "UG", name: "Uganda", cities: ["Kampala", "Entebbe", "Gulu", "Mbarara", "Jinja"] },
  { code: "TZ", name: "Tanzania", cities: ["Dar es Salaam", "Dodoma", "Arusha", "Mwanza", "Zanzibar"] },
  { code: "MR", name: "Mauritania", cities: ["Nouakchott", "Nouadhibou", "Rosso", "Kaédi"] },
  { code: "SN", name: "Senegal", cities: ["Dakar", "Touba", "Thiès", "Saint-Louis", "Ziguinchor"] },
  { code: "CI", name: "Ivory Coast", cities: ["Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro"] },
  { code: "CM", name: "Cameroon", cities: ["Douala", "Yaoundé", "Bamenda", "Garoua", "Bafoussam"] },
  { code: "GH", name: "Ghana", cities: ["Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Cape Coast"] },
];

interface Props {
  country: string;
  city: string;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onSearch: (country: string, city: string) => void;
  loading: boolean;
}

export default function CountryCitySelector({
  country,
  city,
  onCountryChange,
  onCityChange,
  onSearch,
  loading,
}: Props) {
  const t = useTranslations('countrySelector');

  const [countryInput, setCountryInput] = useState(country);
  const [cityInput, setCityInput] = useState(city);
  const [showCountryList, setShowCountryList] = useState(false);
  const [showCityList, setShowCityList] = useState(false);
  const [selectedCountryName, setSelectedCountryName] = useState<string>("");
  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  const matchedCountry = useMemo(
    () => COUNTRIES.find((c) => c.code === country || c.name.toLowerCase() === country.toLowerCase() || c.name.startsWith(country)),
    [country]
  );

  const availableCities = useMemo(() => matchedCountry?.cities ?? [], [matchedCountry]);

  const matchedCity = useMemo(() => availableCities.find((c) => c.toLowerCase() === city.toLowerCase()), [availableCities, city]);

  useEffect(() => {
    setCountryInput(country);
  }, [country]);

  useEffect(() => {
    setCityInput(city);
  }, [city]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setShowCountryList(false);
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCityList(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    const q = countryInput.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [countryInput]);

  const selectCountry = (item: Country) => {
    setSelectedCountryName(item.name);
    onCountryChange(item.name);
    onCityChange("");
    setCityInput("");
    setCountryInput(item.name);
    setShowCountryList(false);
    if (city.trim() && onSearch) {
      onSearch(item.name, city.trim());
    }
  };

  const selectCity = (value: string) => {
    setCityInput(value);
    onCityChange(value);
    setShowCityList(false);
    if (country && value && onSearch) {
      onSearch(country, value);
    }
  };

  const handleCountryBlur = () => {
    if (!selectedCountryName && countryInput) {
      const first = filteredCountries[0];
      if (first && first.name.toLowerCase() === countryInput.toLowerCase()) {
        selectCountry(first);
      } else if (countryInput.trim()) {
        onCountryChange(countryInput.trim());
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative" ref={countryRef}>
        <input
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50"
           placeholder={t('placeholderCountry')}
          value={countryInput}
          onChange={(e) => {
            setCountryInput(e.target.value);
            setSelectedCountryName("");
            setShowCountryList(true);
          }}
          onFocus={() => setShowCountryList(true)}
          onBlur={handleCountryBlur}
          autoComplete="off"
        />
        {showCountryList && filteredCountries.length > 0 && (
          <div className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-border bg-card shadow-xl">
            {filteredCountries.map((item) => (
              <button
                key={item.code}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCountry(item)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 ${
                  item.code === matchedCountry?.code || item.name.toLowerCase() === countryInput.toLowerCase()
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <span className="font-medium">{item.name}</span>
                 <span className="ml-2 text-xs text-muted-foreground/50">{t.rich('citiesCount', { n: item.cities.length })}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative" ref={cityRef}>
        <input
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 disabled:opacity-50"
           placeholder={matchedCountry ? t('placeholderCity') : t('chooseCountryFirst')}
          value={cityInput}
          onChange={(e) => {
            setCityInput(e.target.value);
            setShowCityList(true);
          }}
          onFocus={() => matchedCountry && setShowCityList(true)}
          disabled={!matchedCountry}
          autoComplete="off"
        />
        {showCityList && matchedCountry && availableCities.length > 0 && (
          <div className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-border bg-card shadow-xl">
            {availableCities
              .filter((c) => c.toLowerCase().includes(cityInput.toLowerCase().trim()))
              .map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectCity(c)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 ${
                    c.toLowerCase() === cityInput.toLowerCase()
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            {availableCities.filter((c) => c.toLowerCase().includes(cityInput.toLowerCase().trim())).length === 0 && (
               <div className="px-3 py-2 text-xs text-muted-foreground/50">{t('citySearchPlaceholder')}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
