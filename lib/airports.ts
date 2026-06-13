/* Bundled airport dataset for instant, reliable autocomplete — independent of
   LiteAPI (whose /data/flights/airports endpoint is empty/rate-limited in the
   sandbox). Weighted toward Muslim-travel hubs (Umrah/Hajj, SE Asia, Gulf) plus
   major global gateways. The flights route searches this first and merges any
   live LiteAPI matches on top. */

export interface AirportRec { iata: string; city: string; name: string; country: string }

// iata, city, name, country
const RAW: [string, string, string, string][] = [
  // ── Singapore / Malaysia / Indonesia / Brunei ──
  ["SIN", "Singapore", "Changi", "Singapore"],
  ["KUL", "Kuala Lumpur", "KLIA", "Malaysia"],
  ["PEN", "Penang", "Penang Intl", "Malaysia"],
  ["LGK", "Langkawi", "Langkawi Intl", "Malaysia"],
  ["JHB", "Johor Bahru", "Senai Intl", "Malaysia"],
  ["BKI", "Kota Kinabalu", "Kota Kinabalu Intl", "Malaysia"],
  ["KCH", "Kuching", "Kuching Intl", "Malaysia"],
  ["CGK", "Jakarta", "Soekarno-Hatta", "Indonesia"],
  ["DPS", "Bali", "Ngurah Rai (Denpasar)", "Indonesia"],
  ["SUB", "Surabaya", "Juanda Intl", "Indonesia"],
  ["BDO", "Bandung", "Husein Sastranegara", "Indonesia"],
  ["JOG", "Yogyakarta", "Yogyakarta Intl", "Indonesia"],
  ["UPG", "Makassar", "Sultan Hasanuddin", "Indonesia"],
  ["MES", "Medan", "Kualanamu Intl", "Indonesia"],
  ["BWN", "Bandar Seri Begawan", "Brunei Intl", "Brunei"],
  // ── Saudi Arabia & Umrah/Hajj corridor ──
  ["JED", "Jeddah", "King Abdulaziz Intl", "Saudi Arabia"],
  ["MED", "Madinah", "Prince Mohammad bin Abdulaziz", "Saudi Arabia"],
  ["RUH", "Riyadh", "King Khalid Intl", "Saudi Arabia"],
  ["DMM", "Dammam", "King Fahd Intl", "Saudi Arabia"],
  // ── Gulf & Middle East ──
  ["DXB", "Dubai", "Dubai Intl", "United Arab Emirates"],
  ["DWC", "Dubai", "Al Maktoum Intl", "United Arab Emirates"],
  ["AUH", "Abu Dhabi", "Zayed Intl", "United Arab Emirates"],
  ["SHJ", "Sharjah", "Sharjah Intl", "United Arab Emirates"],
  ["DOH", "Doha", "Hamad Intl", "Qatar"],
  ["KWI", "Kuwait City", "Kuwait Intl", "Kuwait"],
  ["BAH", "Manama", "Bahrain Intl", "Bahrain"],
  ["MCT", "Muscat", "Muscat Intl", "Oman"],
  ["AMM", "Amman", "Queen Alia Intl", "Jordan"],
  ["BEY", "Beirut", "Rafic Hariri Intl", "Lebanon"],
  // ── Turkey ──
  ["IST", "Istanbul", "Istanbul Airport", "Turkey"],
  ["SAW", "Istanbul", "Sabiha Gökçen", "Turkey"],
  ["ESB", "Ankara", "Esenboğa Intl", "Turkey"],
  ["AYT", "Antalya", "Antalya Intl", "Turkey"],
  ["ADB", "Izmir", "Adnan Menderes", "Turkey"],
  // ── North Africa & Africa ──
  ["CAI", "Cairo", "Cairo Intl", "Egypt"],
  ["CMN", "Casablanca", "Mohammed V Intl", "Morocco"],
  ["RAK", "Marrakesh", "Menara", "Morocco"],
  ["TUN", "Tunis", "Tunis-Carthage", "Tunisia"],
  ["ALG", "Algiers", "Houari Boumediene", "Algeria"],
  ["JNB", "Johannesburg", "O.R. Tambo Intl", "South Africa"],
  ["CPT", "Cape Town", "Cape Town Intl", "South Africa"],
  ["NBO", "Nairobi", "Jomo Kenyatta Intl", "Kenya"],
  ["ADD", "Addis Ababa", "Bole Intl", "Ethiopia"],
  ["LOS", "Lagos", "Murtala Muhammed Intl", "Nigeria"],
  ["ACC", "Accra", "Kotoka Intl", "Ghana"],
  ["DAR", "Dar es Salaam", "Julius Nyerere Intl", "Tanzania"],
  // ── South Asia ──
  ["DEL", "Delhi", "Indira Gandhi Intl", "India"],
  ["BOM", "Mumbai", "Chhatrapati Shivaji", "India"],
  ["BLR", "Bengaluru", "Kempegowda Intl", "India"],
  ["MAA", "Chennai", "Chennai Intl", "India"],
  ["HYD", "Hyderabad", "Rajiv Gandhi Intl", "India"],
  ["CCU", "Kolkata", "Netaji Subhas Chandra Bose", "India"],
  ["COK", "Kochi", "Cochin Intl", "India"],
  ["KHI", "Karachi", "Jinnah Intl", "Pakistan"],
  ["LHE", "Lahore", "Allama Iqbal Intl", "Pakistan"],
  ["ISB", "Islamabad", "Islamabad Intl", "Pakistan"],
  ["DAC", "Dhaka", "Hazrat Shahjalal Intl", "Bangladesh"],
  ["CMB", "Colombo", "Bandaranaike Intl", "Sri Lanka"],
  ["MLE", "Malé", "Velana Intl", "Maldives"],
  ["KTM", "Kathmandu", "Tribhuvan Intl", "Nepal"],
  // ── SE Asia ──
  ["BKK", "Bangkok", "Suvarnabhumi", "Thailand"],
  ["DMK", "Bangkok", "Don Mueang", "Thailand"],
  ["HKT", "Phuket", "Phuket Intl", "Thailand"],
  ["CNX", "Chiang Mai", "Chiang Mai Intl", "Thailand"],
  ["MNL", "Manila", "Ninoy Aquino Intl", "Philippines"],
  ["CEB", "Cebu", "Mactan-Cebu Intl", "Philippines"],
  ["SGN", "Ho Chi Minh City", "Tan Son Nhat", "Vietnam"],
  ["HAN", "Hanoi", "Noi Bai Intl", "Vietnam"],
  ["DAD", "Da Nang", "Da Nang Intl", "Vietnam"],
  ["PNH", "Phnom Penh", "Phnom Penh Intl", "Cambodia"],
  ["REP", "Siem Reap", "Siem Reap-Angkor", "Cambodia"],
  ["RGN", "Yangon", "Yangon Intl", "Myanmar"],
  ["VTE", "Vientiane", "Wattay Intl", "Laos"],
  // ── East Asia ──
  ["ICN", "Seoul", "Incheon Intl", "South Korea"],
  ["GMP", "Seoul", "Gimpo Intl", "South Korea"],
  ["PUS", "Busan", "Gimhae Intl", "South Korea"],
  ["NRT", "Tokyo", "Narita Intl", "Japan"],
  ["HND", "Tokyo", "Haneda", "Japan"],
  ["KIX", "Osaka", "Kansai Intl", "Japan"],
  ["NGO", "Nagoya", "Chubu Centrair", "Japan"],
  ["CTS", "Sapporo", "New Chitose", "Japan"],
  ["FUK", "Fukuoka", "Fukuoka", "Japan"],
  ["OKA", "Okinawa", "Naha", "Japan"],
  ["PEK", "Beijing", "Capital Intl", "China"],
  ["PKX", "Beijing", "Daxing Intl", "China"],
  ["PVG", "Shanghai", "Pudong Intl", "China"],
  ["SHA", "Shanghai", "Hongqiao Intl", "China"],
  ["CAN", "Guangzhou", "Baiyun Intl", "China"],
  ["SZX", "Shenzhen", "Bao'an Intl", "China"],
  ["HKG", "Hong Kong", "Hong Kong Intl", "Hong Kong"],
  ["TPE", "Taipei", "Taoyuan Intl", "Taiwan"],
  // ── Oceania ──
  ["SYD", "Sydney", "Kingsford Smith", "Australia"],
  ["MEL", "Melbourne", "Melbourne (Tullamarine)", "Australia"],
  ["BNE", "Brisbane", "Brisbane Intl", "Australia"],
  ["PER", "Perth", "Perth Intl", "Australia"],
  ["ADL", "Adelaide", "Adelaide Intl", "Australia"],
  ["AKL", "Auckland", "Auckland Intl", "New Zealand"],
  // ── Europe ──
  ["LHR", "London", "Heathrow", "United Kingdom"],
  ["LGW", "London", "Gatwick", "United Kingdom"],
  ["STN", "London", "Stansted", "United Kingdom"],
  ["MAN", "Manchester", "Manchester", "United Kingdom"],
  ["BHX", "Birmingham", "Birmingham", "United Kingdom"],
  ["EDI", "Edinburgh", "Edinburgh", "United Kingdom"],
  ["DUB", "Dublin", "Dublin", "Ireland"],
  ["CDG", "Paris", "Charles de Gaulle", "France"],
  ["ORY", "Paris", "Orly", "France"],
  ["NCE", "Nice", "Côte d'Azur", "France"],
  ["AMS", "Amsterdam", "Schiphol", "Netherlands"],
  ["BRU", "Brussels", "Brussels", "Belgium"],
  ["FRA", "Frankfurt", "Frankfurt", "Germany"],
  ["MUC", "Munich", "Munich", "Germany"],
  ["BER", "Berlin", "Brandenburg", "Germany"],
  ["DUS", "Düsseldorf", "Düsseldorf", "Germany"],
  ["ZRH", "Zürich", "Zürich", "Switzerland"],
  ["GVA", "Geneva", "Geneva", "Switzerland"],
  ["VIE", "Vienna", "Vienna Intl", "Austria"],
  ["MAD", "Madrid", "Barajas", "Spain"],
  ["BCN", "Barcelona", "El Prat", "Spain"],
  ["LIS", "Lisbon", "Humberto Delgado", "Portugal"],
  ["FCO", "Rome", "Fiumicino", "Italy"],
  ["MXP", "Milan", "Malpensa", "Italy"],
  ["VCE", "Venice", "Marco Polo", "Italy"],
  ["ATH", "Athens", "Eleftherios Venizelos", "Greece"],
  ["CPH", "Copenhagen", "Kastrup", "Denmark"],
  ["ARN", "Stockholm", "Arlanda", "Sweden"],
  ["OSL", "Oslo", "Gardermoen", "Norway"],
  ["HEL", "Helsinki", "Vantaa", "Finland"],
  ["WAW", "Warsaw", "Chopin", "Poland"],
  ["PRG", "Prague", "Václav Havel", "Czechia"],
  ["SVO", "Moscow", "Sheremetyevo", "Russia"],
  // ── North America ──
  ["JFK", "New York", "John F. Kennedy Intl", "United States"],
  ["EWR", "New York", "Newark Liberty", "United States"],
  ["LGA", "New York", "LaGuardia", "United States"],
  ["LAX", "Los Angeles", "Los Angeles Intl", "United States"],
  ["SFO", "San Francisco", "San Francisco Intl", "United States"],
  ["ORD", "Chicago", "O'Hare Intl", "United States"],
  ["IAD", "Washington", "Dulles Intl", "United States"],
  ["BOS", "Boston", "Logan Intl", "United States"],
  ["SEA", "Seattle", "Seattle-Tacoma", "United States"],
  ["IAH", "Houston", "George Bush Intl", "United States"],
  ["DFW", "Dallas", "Dallas/Fort Worth", "United States"],
  ["MIA", "Miami", "Miami Intl", "United States"],
  ["ATL", "Atlanta", "Hartsfield-Jackson", "United States"],
  ["YYZ", "Toronto", "Pearson Intl", "Canada"],
  ["YVR", "Vancouver", "Vancouver Intl", "Canada"],
  ["YUL", "Montréal", "Trudeau Intl", "Canada"],
  ["MEX", "Mexico City", "Benito Juárez Intl", "Mexico"],
  // ── South America ──
  ["GRU", "São Paulo", "Guarulhos Intl", "Brazil"],
  ["EZE", "Buenos Aires", "Ezeiza Intl", "Argentina"],
  ["BOG", "Bogotá", "El Dorado Intl", "Colombia"],
  ["LIM", "Lima", "Jorge Chávez Intl", "Peru"],
  ["SCL", "Santiago", "Arturo Merino Benítez", "Chile"],
];

export const AIRPORTS: AirportRec[] = RAW.map(([iata, city, name, country]) => ({ iata, city, name, country }));

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Search the bundled dataset. Ranks exact IATA, then city/name prefix, then contains. */
export function searchLocalAirports(q: string, limit = 7): AirportRec[] {
  const n = norm(q.trim());
  if (!n) return [];
  const scored: { a: AirportRec; s: number }[] = [];
  for (const a of AIRPORTS) {
    const iata = a.iata.toLowerCase();
    const city = norm(a.city);
    const name = norm(a.name);
    const country = norm(a.country);
    let s = -1;
    if (iata === n) s = 0;
    else if (city === n) s = 1;
    else if (city.startsWith(n)) s = 2;
    else if (iata.startsWith(n)) s = 3;
    else if (name.startsWith(n)) s = 4;
    else if (city.includes(n) || name.includes(n)) s = 5;
    else if (country.startsWith(n) || country.includes(n)) s = 6;
    if (s >= 0) scored.push({ a, s });
  }
  scored.sort((x, y) => x.s - y.s || x.a.city.localeCompare(y.a.city));
  return scored.slice(0, limit).map((x) => x.a);
}
