import type { CountryInfo } from '../types/index.ts';
import * as countryCodeData from 'country-codes-list';

const EXISTING_COUNTRIES: CountryInfo[] = [
  { name: 'Afghanistan', code: '+93', iso: 'AF', flag: '🇦🇫', placeholder: '70 123 4567' },
  { name: 'Albania', code: '+355', iso: 'AL', flag: '🇦🇱', placeholder: '69 123 4567' },
  { name: 'Algeria', code: '+213', iso: 'DZ', flag: '🇩🇿', placeholder: '551 23 45 67' },
  { name: 'Andorra', code: '+376', iso: 'AD', flag: '🇦🇩', placeholder: '312 345' },
  { name: 'Angola', code: '+244', iso: 'AO', flag: '🇦🇴', placeholder: '923 123 456' },
  { name: 'Argentina', code: '+54', iso: 'AR', flag: '🇦🇷', placeholder: '9 11 2345-6789' },
  { name: 'Armenia', code: '+374', iso: 'AM', flag: '🇦🇲', placeholder: '91 123456' },
  { name: 'Australia', code: '+61', iso: 'AU', flag: '🇦🇺', placeholder: '412 345 678' },
  { name: 'Austria', code: '+43', iso: 'AT', flag: '🇦🇹', placeholder: '664 1234567' },
  { name: 'Azerbaijan', code: '+994', iso: 'AZ', flag: '🇦🇿', placeholder: '50 123 45 67' },
  { name: 'Bahamas', code: '+1', iso: 'BS', flag: '🇧🇸', placeholder: '242 359 1234' },
  { name: 'Bahrain', code: '+973', iso: 'BH', flag: '🇧🇭', placeholder: '3600 1234' },
  { name: 'Bangladesh', code: '+880', iso: 'BD', flag: '🇧🇩', placeholder: '1712-345678' },
  { name: 'Barbados', code: '+1', iso: 'BB', flag: '🇧🇧', placeholder: '246 230 1234' },
  { name: 'Belarus', code: '+375', iso: 'BY', flag: '🇧🇾', placeholder: '29 123-45-67' },
  { name: 'Belgium', code: '+32', iso: 'BE', flag: '🇧🇪', placeholder: '470 12 34 56' },
  { name: 'Belize', code: '+501', iso: 'BZ', flag: '🇧🇿', placeholder: '610 1234' },
  { name: 'Benin', code: '+229', iso: 'BJ', flag: '🇧🇯', placeholder: '97 12 34 56' },
  { name: 'Bhutan', code: '+975', iso: 'BT', flag: '🇧🇹', placeholder: '17 12 34 56' },
  { name: 'Bolivia', code: '+591', iso: 'BO', flag: '🇧🇴', placeholder: '71234567' },
  { name: 'Bosnia and Herzegovina', code: '+387', iso: 'BA', flag: '🇧🇦', placeholder: '61 123 456' },
  { name: 'Botswana', code: '+267', iso: 'BW', flag: '🇧🇼', placeholder: '71 123 456' },
  { name: 'Brazil', code: '+55', iso: 'BR', flag: '🇧🇷', placeholder: '11 98765-4321' },
  { name: 'Brunei', code: '+673', iso: 'BN', flag: '🇧🇳', placeholder: '712 3456' },
  { name: 'Bulgaria', code: '+359', iso: 'BG', flag: '🇧🇬', placeholder: '88 123 4567' },
  { name: 'Burkina Faso', code: '+226', iso: 'BF', flag: '🇧🇫', placeholder: '70 12 34 56' },
  { name: 'Burundi', code: '+257', iso: 'BI', flag: '🇧🇮', placeholder: '79 12 34 56' },
  { name: 'Cambodia', code: '+855', iso: 'KH', flag: '🇰🇭', placeholder: '12 345 678' },
  { name: 'Cameroon', code: '+237', iso: 'CM', flag: '🇨🇲', placeholder: '6 71 23 45 67' },
  { name: 'Canada', code: '+1', iso: 'CA', flag: '🇨🇦', placeholder: '604 555-0188' },
  { name: 'Cape Verde', code: '+238', iso: 'CV', flag: '🇨🇻', placeholder: '991 12 34' },
  { name: 'Central African Republic', code: '+236', iso: 'CF', flag: '🇨🇫', placeholder: '75 12 34 56' },
  { name: 'Chad', code: '+235', iso: 'TD', flag: '🇹🇩', placeholder: '66 12 34 56' },
  { name: 'Chile', code: '+56', iso: 'CL', flag: '🇨🇱', placeholder: '9 1234 5678' },
  { name: 'China', code: '+86', iso: 'CN', flag: '🇨🇳', placeholder: '138 0013 8000' },
  { name: 'Colombia', code: '+57', iso: 'CO', flag: '🇨🇴', placeholder: '300 123 4567' },
  { name: 'Comoros', code: '+269', iso: 'KM', flag: '🇰🇲', placeholder: '321 23 45' },
  { name: 'Congo', code: '+242', iso: 'CG', flag: '🇨🇬', placeholder: '06 123 4567' },
  { name: 'Costa Rica', code: '+506', iso: 'CR', flag: '🇨🇷', placeholder: '8312 3456' },
  { name: 'Croatia', code: '+385', iso: 'HR', flag: '🇭🇷', placeholder: '91 123 4567' },
  { name: 'Cuba', code: '+53', iso: 'CU', flag: '🇨🇺', placeholder: '5 123 4567' },
  { name: 'Cyprus', code: '+357', iso: 'CY', flag: '🇨🇾', placeholder: '99 123456' },
  { name: 'Czech Republic', code: '+420', iso: 'CZ', flag: '🇨🇿', placeholder: '601 123 456' },
  { name: 'Democratic Republic of the Congo', code: '+243', iso: 'CD', flag: '🇨🇩', placeholder: '81 123 4567' },
  { name: 'Denmark', code: '+45', iso: 'DK', flag: '🇩🇰', placeholder: '20 12 34 56' },
  { name: 'Djibouti', code: '+253', iso: 'DJ', flag: '🇩🇯', placeholder: '77 12 34 56' },
  { name: 'Dominica', code: '+1', iso: 'DM', flag: '🇩🇲', placeholder: '767 225 1234' },
  { name: 'Dominican Republic', code: '+1', iso: 'DO', flag: '🇩🇴', placeholder: '809 234 5678' },
  { name: 'Ecuador', code: '+593', iso: 'EC', flag: '🇪🇨', placeholder: '99 123 4567' },
  { name: 'Egypt', code: '+20', iso: 'EG', flag: '🇪🇬', placeholder: '100 123 4567' },
  { name: 'El Salvador', code: '+503', iso: 'SV', flag: '🇸🇻', placeholder: '7012 3456' },
  { name: 'Equatorial Guinea', code: '+240', iso: 'GQ', flag: '🇬🇶', placeholder: '222 123 456' },
  { name: 'Eritrea', code: '+291', iso: 'ER', flag: '🇪🇷', placeholder: '7 123 456' },
  { name: 'Estonia', code: '+372', iso: 'EE', flag: '🇪🇪', placeholder: '5123 4567' },
  { name: 'Eswatini', code: '+268', iso: 'SZ', flag: '🇸🇿', placeholder: '7612 3456' },
  { name: 'Ethiopia', code: '+251', iso: 'ET', flag: '🇪🇹', placeholder: '91 123 4567' },
  { name: 'Fiji', code: '+679', iso: 'FJ', flag: '🇫🇯', placeholder: '701 2345' },
  { name: 'Finland', code: '+358', iso: 'FI', flag: '🇫🇮', placeholder: '40 123 4567' },
  { name: 'France', code: '+33', iso: 'FR', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
  { name: 'Gabon', code: '+241', iso: 'GA', flag: '🇬🇦', placeholder: '06 12 34 56' },
  { name: 'Gambia', code: '+220', iso: 'GM', flag: '🇬🇲', placeholder: '712 3456' },
  { name: 'Georgia', code: '+995', iso: 'GE', flag: '🇬🇪', placeholder: '555 12 34 56' },
  { name: 'Germany', code: '+49', iso: 'DE', flag: '🇩🇪', placeholder: '151 2345-6789' },
  { name: 'Ghana', code: '+233', iso: 'GH', flag: '🇬🇭', placeholder: '24 123 4567' },
  { name: 'Greece', code: '+30', iso: 'GR', flag: '🇬🇷', placeholder: '691 234 5678' },
  { name: 'Grenada', code: '+1', iso: 'GD', flag: '🇬🇩', placeholder: '473 403 1234' },
  { name: 'Guatemala', code: '+502', iso: 'GT', flag: '🇬🇹', placeholder: '5123 4567' },
  { name: 'Guinea', code: '+224', iso: 'GN', flag: '🇬🇳', placeholder: '621 12 34 56' },
  { name: 'Guyana', code: '+592', iso: 'GY', flag: '🇬🇾', placeholder: '612 3456' },
  { name: 'Haiti', code: '+509', iso: 'HT', flag: '🇭🇹', placeholder: '3412 3456' },
  { name: 'Honduras', code: '+504', iso: 'HN', flag: '🇭🇳', placeholder: '9123 4567' },
  { name: 'Hong Kong', code: '+852', iso: 'HK', flag: '🇭🇰', placeholder: '9123 4567' },
  { name: 'Hungary', code: '+36', iso: 'HU', flag: '🇭🇺', placeholder: '20 123 4567' },
  { name: 'Iceland', code: '+354', iso: 'IS', flag: '🇮🇸', placeholder: '612 3456' },
  { name: 'India', code: '+91', iso: 'IN', flag: '🇮🇳', placeholder: '98765 43210' },
  { name: 'Indonesia', code: '+62', iso: 'ID', flag: '🇮🇩', placeholder: '812-3456-7890' },
  { name: 'Iran', code: '+98', iso: 'IR', flag: '🇮🇷', placeholder: '912 345 6789' },
  { name: 'Iraq', code: '+964', iso: 'IQ', flag: '🇮🇶', placeholder: '770 123 4567' },
  { name: 'Ireland', code: '+353', iso: 'IE', flag: '🇮🇪', placeholder: '85 123 4567' },
  { name: 'Israel', code: '+972', iso: 'IL', flag: '🇮🇱', placeholder: '50-123-4567' },
  { name: 'Italy', code: '+39', iso: 'IT', flag: '🇮🇹', placeholder: '320 123 4567' },
  { name: 'Ivory Coast', code: '+225', iso: 'CI', flag: '🇨🇮', placeholder: '07 12 34 56 78' },
  { name: 'Jamaica', code: '+1', iso: 'JM', flag: '🇯🇲', placeholder: '876 210 1234' },
  { name: 'Japan', code: '+81', iso: 'JP', flag: '🇯🇵', placeholder: '90 1234-5678' },
  { name: 'Jordan', code: '+962', iso: 'JO', flag: '🇯🇴', placeholder: '7 9123 4567' },
  { name: 'Kazakhstan', code: '+7', iso: 'KZ', flag: '🇰🇿', placeholder: '701 123 4567' },
  { name: 'Kenya', code: '+254', iso: 'KE', flag: '🇰🇪', placeholder: '712 345678' },
  { name: 'Kuwait', code: '+965', iso: 'KW', flag: '🇰🇼', placeholder: '9123 4567' },
  { name: 'Kyrgyzstan', code: '+996', iso: 'KG', flag: '🇰🇬', placeholder: '555 123 456' },
  { name: 'Laos', code: '+856', iso: 'LA', flag: '🇱🇦', placeholder: '20 51 234 567' },
  { name: 'Latvia', code: '+371', iso: 'LV', flag: '🇱🇻', placeholder: '21 234 567' },
  { name: 'Lebanon', code: '+961', iso: 'LB', flag: '🇱🇧', placeholder: '70 123 456' },
  { name: 'Lesotho', code: '+266', iso: 'LS', flag: '🇱🇸', placeholder: '5812 3456' },
  { name: 'Liberia', code: '+231', iso: 'LR', flag: '🇱🇷', placeholder: '77 123 4567' },
  { name: 'Libya', code: '+218', iso: 'LY', flag: '🇱🇾', placeholder: '91 123 4567' },
  { name: 'Liechtenstein', code: '+423', iso: 'LI', flag: '🇱🇮', placeholder: '660 234 567' },
  { name: 'Lithuania', code: '+370', iso: 'LT', flag: '🇱🇹', placeholder: '612 34567' },
  { name: 'Luxembourg', code: '+352', iso: 'LU', flag: '🇱🇺', placeholder: '621 123 456' },
  { name: 'Madagascar', code: '+261', iso: 'MG', flag: '🇲🇬', placeholder: '32 12 345 67' },
  { name: 'Malawi', code: '+265', iso: 'MW', flag: '🇲🇼', placeholder: '99 123 4567' },
  { name: 'Malaysia', code: '+60', iso: 'MY', flag: '🇲🇾', placeholder: '12-345 6789' },
  { name: 'Maldives', code: '+960', iso: 'MV', flag: '🇲🇻', placeholder: '712 3456' },
  { name: 'Mali', code: '+223', iso: 'ML', flag: '🇲🇱', placeholder: '65 12 34 56' },
  { name: 'Malta', code: '+356', iso: 'MT', flag: '🇲🇹', placeholder: '9912 3456' },
  { name: 'Mauritania', code: '+222', iso: 'MR', flag: '🇲🇷', placeholder: '22 12 34 56' },
  { name: 'Mauritius', code: '+230', iso: 'MU', flag: '🇲🇺', placeholder: '5123 4567' },
  { name: 'Mexico', code: '+52', iso: 'MX', flag: '🇲🇽', placeholder: '55 1234 5678' },
  { name: 'Moldova', code: '+373', iso: 'MD', flag: '🇲🇩', placeholder: '69 123456' },
  { name: 'Monaco', code: '+377', iso: 'MC', flag: '🇲🇨', placeholder: '6 12 34 56 78' },
  { name: 'Mongolia', code: '+976', iso: 'MN', flag: '🇲🇳', placeholder: '8812 3456' },
  { name: 'Montenegro', code: '+382', iso: 'ME', flag: '🇲🇪', placeholder: '67 123 456' },
  { name: 'Morocco', code: '+212', iso: 'MA', flag: '🇲🇦', placeholder: '612 345 678' },
  { name: 'Mozambique', code: '+258', iso: 'MZ', flag: '🇲🇿', placeholder: '84 123 4567' },
  { name: 'Myanmar', code: '+95', iso: 'MM', flag: '🇲🇲', placeholder: '9 123 456 789' },
  { name: 'Namibia', code: '+264', iso: 'NA', flag: '🇳🇦', placeholder: '81 123 4567' },
  { name: 'Nepal', code: '+977', iso: 'NP', flag: '🇳🇵', placeholder: '984-1234567' },
  { name: 'Netherlands', code: '+31', iso: 'NL', flag: '🇳🇱', placeholder: '6 12345678' },
  { name: 'New Zealand', code: '+64', iso: 'NZ', flag: '🇳🇿', placeholder: '21 123 4567' },
  { name: 'Nicaragua', code: '+505', iso: 'NI', flag: '🇳🇮', placeholder: '8123 4567' },
  { name: 'Niger', code: '+227', iso: 'NE', flag: '🇳🇪', placeholder: '90 12 34 56' },
  { name: 'Nigeria', code: '+234', iso: 'NG', flag: '🇳🇬', placeholder: '803 512-9843' },
  { name: 'North Macedonia', code: '+389', iso: 'MK', flag: '🇲🇰', placeholder: '70 123 456' },
  { name: 'Norway', code: '+47', iso: 'NO', flag: '🇳🇴', placeholder: '412 34 567' },
  { name: 'Oman', code: '+968', iso: 'OM', flag: '🇴🇲', placeholder: '9123 4567' },
  { name: 'Pakistan', code: '+92', iso: 'PK', flag: '🇵🇰', placeholder: '301 2345678' },
  { name: 'Palestine', code: '+970', iso: 'PS', flag: '🇵🇸', placeholder: '59 123 4567' },
  { name: 'Panama', code: '+507', iso: 'PA', flag: '🇵🇦', placeholder: '6123 4567' },
  { name: 'Papua New Guinea', code: '+675', iso: 'PG', flag: '🇵🇬', placeholder: '7123 4567' },
  { name: 'Paraguay', code: '+595', iso: 'PY', flag: '🇵🇾', placeholder: '981 123456' },
  { name: 'Peru', code: '+51', iso: 'PE', flag: '🇵🇪', placeholder: '912 345 678' },
  { name: 'Philippines', code: '+63', iso: 'PH', flag: '🇵🇭', placeholder: '917 123 4567' },
  { name: 'Poland', code: '+48', iso: 'PL', flag: '🇵🇱', placeholder: '512 345 678' },
  { name: 'Portugal', code: '+351', iso: 'PT', flag: '🇵🇹', placeholder: '912 345 678' },
  { name: 'Qatar', code: '+974', iso: 'QA', flag: '🇶🇦', placeholder: '3312 3456' },
  { name: 'Romania', code: '+40', iso: 'RO', flag: '🇷🇴', placeholder: '712 345 678' },
  { name: 'Russia', code: '+7', iso: 'RU', flag: '🇷🇺', placeholder: '912 345-67-89' },
  { name: 'Rwanda', code: '+250', iso: 'RW', flag: '🇷🇼', placeholder: '788 123 456' },
  { name: 'Saudi Arabia', code: '+966', iso: 'SA', flag: '🇸🇦', placeholder: '50 123 4567' },
  { name: 'Senegal', code: '+221', iso: 'SN', flag: '🇸🇳', placeholder: '77 123 45 67' },
  { name: 'Serbia', code: '+381', iso: 'RS', flag: '🇷🇸', placeholder: '60 1234567' },
  { name: 'Seychelles', code: '+248', iso: 'SC', flag: '🇸🇨', placeholder: '2 512 345' },
  { name: 'Sierra Leone', code: '+232', iso: 'SL', flag: '🇸🇱', placeholder: '76 123456' },
  { name: 'Singapore', code: '+65', iso: 'SG', flag: '🇸🇬', placeholder: '8123 4567' },
  { name: 'Slovakia', code: '+421', iso: 'SK', flag: '🇸🇰', placeholder: '912 345 678' },
  { name: 'Slovenia', code: '+386', iso: 'SI', flag: '🇸🇮', placeholder: '31 234 567' },
  { name: 'Somalia', code: '+252', iso: 'SO', flag: '🇸🇴', placeholder: '61 234567' },
  { name: 'South Africa', code: '+27', iso: 'ZA', flag: '🇿🇦', placeholder: '82 123 4567' },
  { name: 'South Korea', code: '+82', iso: 'KR', flag: '🇰🇷', placeholder: '10-1234-5678' },
  { name: 'South Sudan', code: '+211', iso: 'SS', flag: '🇸🇸', placeholder: '920 123 456' },
  { name: 'Spain', code: '+34', iso: 'ES', flag: '🇪🇸', placeholder: '612 34 56 78' },
  { name: 'Sri Lanka', code: '+94', iso: 'LK', flag: '🇱🇰', placeholder: '71 234 5678' },
  { name: 'Sudan', code: '+249', iso: 'SD', flag: '🇸🇩', placeholder: '91 234 5678' },
  { name: 'Suriname', code: '+597', iso: 'SR', flag: '🇸🇷', placeholder: '712-3456' },
  { name: 'Sweden', code: '+46', iso: 'SE', flag: '🇸🇪', placeholder: '70 123 45 67' },
  { name: 'Switzerland', code: '+41', iso: 'CH', flag: '🇨🇭', placeholder: '79 123 45 67' },
  { name: 'Syria', code: '+963', iso: 'SY', flag: '🇸🇾', placeholder: '944 123 456' },
  { name: 'Taiwan', code: '+886', iso: 'TW', flag: '🇹🇼', placeholder: '912 345 678' },
  { name: 'Tajikistan', code: '+992', iso: 'TJ', flag: '🇹🇯', placeholder: '918 12 3456' },
  { name: 'Tanzania', code: '+255', iso: 'TZ', flag: '🇹🇿', placeholder: '712 345 678' },
  { name: 'Thailand', code: '+66', iso: 'TH', flag: '🇹🇭', placeholder: '81 234 5678' },
  { name: 'Togo', code: '+228', iso: 'TG', flag: '🇹🇬', placeholder: '90 12 34 56' },
  { name: 'Trinidad and Tobago', code: '+1', iso: 'TT', flag: '🇹🇹', placeholder: '868 291 1234' },
  { name: 'Tunisia', code: '+216', iso: 'TN', flag: '🇹🇳', placeholder: '20 123 456' },
  { name: 'Turkey', code: '+90', iso: 'TR', flag: '🇹🇷', placeholder: '532 123 45 67' },
  { name: 'Turkmenistan', code: '+993', iso: 'TM', flag: '🇹🇲', placeholder: '65 123456' },
  { name: 'Uganda', code: '+256', iso: 'UG', flag: '🇺🇬', placeholder: '772 123456' },
  { name: 'Ukraine', code: '+380', iso: 'UA', flag: '🇺🇦', placeholder: '50 123 4567' },
  { name: 'United Arab Emirates', code: '+971', iso: 'AE', flag: '🇦🇪', placeholder: '50 123 4567' },
  { name: 'United Kingdom', code: '+44', iso: 'GB', flag: '🇬🇧', placeholder: '7911 209438' },
  { name: 'United States', code: '+1', iso: 'US', flag: '🇺🇸', placeholder: '415 555-0192' },
  { name: 'Uruguay', code: '+598', iso: 'UY', flag: '🇺🇾', placeholder: '99 123 456' },
  { name: 'Uzbekistan', code: '+998', iso: 'UZ', flag: '🇺🇿', placeholder: '90 123 45 67' },
  { name: 'Venezuela', code: '+58', iso: 'VE', flag: '🇻🇪', placeholder: '412 1234567' },
  { name: 'Vietnam', code: '+84', iso: 'VN', flag: '🇻🇳', placeholder: '91 234 56 78' },
  { name: 'Yemen', code: '+967', iso: 'YE', flag: '🇾🇪', placeholder: '71 234 5678' },
  { name: 'Zambia', code: '+260', iso: 'ZM', flag: '🇿🇲', placeholder: '97 1234567' },
  { name: 'Zimbabwe', code: '+263', iso: 'ZW', flag: '🇿🇼', placeholder: '77 123 4567' },
];

const existingCountryByIso = new Map(EXISTING_COUNTRIES.map((country) => [country.iso, country]));
const datasetCountryCodes = new Set(
  countryCodeData.all().map((country) => country.countryCode)
);

const rawCountries: CountryInfo[] = [
  ...countryCodeData.all().map((country) =>
    existingCountryByIso.get(country.countryCode) || {
      name: country.countryNameEn,
      code: `+${country.countryCallingCode}`,
      iso: country.countryCode,
      flag: country.flag,
      placeholder: '123 456 7890',
    }
  ),
  ...EXISTING_COUNTRIES.filter((country) => !datasetCountryCodes.has(country.iso)),
];

// Strict deduplication by ISO code and alphabetized from A to Z
const seenIsos = new Set<string>();
export const COUNTRIES: CountryInfo[] = rawCountries
  .filter((c) => {
    if (!c.iso || seenIsos.has(c.iso)) return false;
    seenIsos.add(c.iso);
    return true;
  })
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

/**
 * Generates an authentic-formatted, unique ChatTime international number
 * according to the country's dialing system.
 */
export function generateChatTimeNumber(countryCode: string): string {
  const randDigit = () => Math.floor(Math.random() * 10);
  const randBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  switch (countryCode) {
    case '+1': {
      // USA / Canada / Caribbean: +1 (Area) XXX-XXXX
      const areaCodes = ['415', '650', '212', '310', '408', '512', '773', '206', '305', '604', '809'];
      const area = areaCodes[Math.floor(Math.random() * areaCodes.length)];
      const prefix = randBetween(200, 899);
      const line = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
      return `+1 ${area}-${prefix}-${line}`;
    }
    case '+44': {
      // UK: +44 7XXX XXXXXX
      const prefix = randBetween(7100, 7999);
      const num = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
      return `+44 ${prefix} ${num}`;
    }
    case '+380': {
      // Ukraine: +380 XX XXX XXXX
      const prefixes = ['50', '66', '95', '99', '67', '68', '96', '97', '98', '63', '73', '93'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const p1 = `${randDigit()}${randDigit()}${randDigit()}`;
      const p2 = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
      return `+380 ${prefix} ${p1} ${p2}`;
    }
    case '+963': {
      // Syria: +963 9XX XXX XXX
      const prefix = ['93', '94', '95', '96', '98', '99'][Math.floor(Math.random() * 6)];
      const p1 = `${randDigit()}${randDigit()}${randDigit()}`;
      const p2 = `${randDigit()}${randDigit()}${randDigit()}`;
      return `+963 ${prefix} ${p1} ${p2}`;
    }
    case '+234': {
      // Nigeria: +234 8XX XXX XXXX
      const prefixes = ['803', '806', '810', '813', '814', '703', '706', '802', '808', '708', '805', '807', '815'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const part1 = `${randDigit()}${randDigit()}${randDigit()}`;
      const part2 = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
      return `+234 ${prefix} ${part1} ${part2}`;
    }
    case '+49': {
      // Germany: +49 15X XXXXXXX
      const prefix = randBetween(151, 179);
      const num1 = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
      const num2 = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
      return `+49 ${prefix} ${num1}-${num2}`;
    }
    case '+33': {
      // France: +33 6 XX XX XX XX
      const p1 = `${randDigit()}${randDigit()}`;
      const p2 = `${randDigit()}${randDigit()}`;
      const p3 = `${randDigit()}${randDigit()}`;
      const p4 = `${randDigit()}${randDigit()}`;
      return `+33 6 ${p1} ${p2} ${p3} ${p4}`;
    }
    case '+91': {
      // India: +91 9XXXX XXXXX
      const p1 = `${randBetween(7, 9)}${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
      const p2 = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
      return `+91 ${p1} ${p2}`;
    }
    case '+81': {
      // Japan: +81 90-XXXX-XXXX
      const prefix = ['90', '80', '70'][Math.floor(Math.random() * 3)];
      const p1 = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
      const p2 = `${randDigit()}${randDigit()}${randDigit()}`;
      return `+81 ${prefix}-${p1}-${p2}`;
    }
    case '+971': {
      // UAE: +971 5X XXX XXXX
      const prefix = ['50', '52', '54', '55', '56', '58'][Math.floor(Math.random() * 6)];
      const p1 = `${randDigit()}${randDigit()}${randDigit()}`;
      const p2 = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
      return `+971 ${prefix} ${p1} ${p2}`;
    }
    default: {
      const p1 = `${randDigit()}${randDigit()}${randDigit()}`;
      const p2 = `${randDigit()}${randDigit()}${randDigit()}${randDigit()}`;
      return `${countryCode} ${p1}-${p2}`;
    }
  }
}

export const SUPPORTED_COUNTRIES = COUNTRIES;

export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  if (trimmed.length <= 6) return '••••••';
  return `${trimmed.slice(0, 4)} ••• ••${trimmed.slice(-2)}`;
}
