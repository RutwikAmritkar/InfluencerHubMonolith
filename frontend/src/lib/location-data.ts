// ==============================================================================
// InfluencerHub Location & State Data Utility
// Extensible Country -> State/Territory Dataset
// ==============================================================================

export const COUNTRY_STATE_MAP: Record<string, string[]> = {
  India: [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ],
  "United States": [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
  Canada: [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Nova Scotia",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
  ],
};

export function normalizeCountry(countryName?: string | null): string {
  if (!countryName || !countryName.trim()) return "India";
  const trimmed = countryName.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "in" || lower === "ind" || lower === "india") {
    return "India";
  }
  if (lower === "us" || lower === "usa" || lower === "united states") {
    return "United States";
  }
  return trimmed;
}

export function getStatesForCountry(countryName?: string | null): string[] {
  if (!countryName || !countryName.trim()) return COUNTRY_STATE_MAP["India"];
  const normalized = normalizeCountry(countryName);
  const matchedKey = Object.keys(COUNTRY_STATE_MAP).find(
    (k) => k.toLowerCase() === normalized.toLowerCase()
  );
  return matchedKey ? COUNTRY_STATE_MAP[matchedKey] : [];
}
