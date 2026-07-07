import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type LanguageCode = 'no' | 'en' | 'se' | 'fi' | 'dk' | 'pl';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    'nav.partner': 'Partner Dashboard',
    'nav.businesses': 'For Businesses',
    'nav.signin': 'Sign In',
    'hero.search': 'Search for treatments, salons, professionals...',
    'hero.popular': 'Popular Treatments',
    'hero.browse': 'Browse by Category',
    'app.category': 'Category',
    'app.results': 'Search Results',
    'app.modify': 'Modify search',
    'app.clear': 'Clear Search',
    'app.available': 'Available Venues',
    'app.featured': 'Featured Venues',
    'treat.haircut': 'Haircut',
    'treat.manicure': 'Gel Manicure',
    'treat.massage': 'Deep Tissue Massage',
    'treat.lash': 'Lash Lift',
    'treat.beard': 'Beard Trim',
    'auth.customer_hub': 'Customer Hub',
    'auth.business_partner': 'Business Partner',
    'auth.sign_in': 'Sign In',
    'auth.create_account': 'Create Account',
    'auth.email_customer': 'Email Address',
    'auth.email_business': 'Business Email Address',
    'auth.password': 'Password',
    'auth.sign_in_book': 'Sign In to Book',
    'auth.sign_in_partner': 'Sign In as Partner',
    'auth.name_customer': 'Your Full Name',
    'auth.name_business': 'Owner / Manager Name',
    'auth.phone': 'Phone Number',
    'auth.register': 'Register & Sign In',
    'auth.register_partner': 'Create Partner Account'
  },
  no: {
    'nav.partner': 'Partner Dashboard',
    'nav.businesses': 'For Bedrifter',
    'nav.signin': 'Logg inn',
    'hero.search': 'Søk etter behandlinger, salonger, fagfolk...',
    'hero.popular': 'Populære Behandlinger',
    'hero.browse': 'Bla gjennom Kategori',
    'app.category': 'Kategori',
    'app.results': 'Søkeresultater',
    'app.modify': 'Endre søk',
    'app.clear': 'Fjern Søk',
    'app.available': 'Tilgjengelige Salonger',
    'app.featured': 'Utvalgte Salonger',
    'treat.haircut': 'Hårklipp',
    'treat.manicure': 'Gel Manicure',
    'treat.massage': 'Dypvevsmassasje',
    'treat.lash': 'Vippeløft',
    'treat.beard': 'Skjeggtrim',
    'auth.customer_hub': 'Kunde',
    'auth.business_partner': 'Bedrift',
    'auth.sign_in': 'Logg inn',
    'auth.create_account': 'Opprett konto',
    'auth.email_customer': 'E-postadresse',
    'auth.email_business': 'Bedriftens e-post',
    'auth.password': 'Passord',
    'auth.sign_in_book': 'Logg inn for å bestille',
    'auth.sign_in_partner': 'Logg inn som partner',
    'auth.name_customer': 'Ditt fulle navn',
    'auth.name_business': 'Eier / Leders navn',
    'auth.phone': 'Telefonnummer',
    'auth.register': 'Registrer & logg inn',
    'auth.register_partner': 'Opprett partnerkonto'
  },
  se: {
    'nav.partner': 'Partner Dashboard',
    'nav.businesses': 'För Företag',
    'nav.signin': 'Logga in',
    'hero.search': 'Sök efter behandlingar, salonger, proffs...',
    'hero.popular': 'Populära Behandlingar',
    'hero.browse': 'Bläddra efter Kategori',
    'app.category': 'Kategori',
    'app.results': 'Sökresultat',
    'app.modify': 'Ändra sökning',
    'app.clear': 'Rensa Sökning',
    'app.available': 'Tillgängliga Salonger',
    'app.featured': 'Utvalda Salonger',
    'treat.haircut': 'Hårklippning',
    'treat.manicure': 'Gel Manicure',
    'treat.massage': 'Djupvävnadsmassage',
    'treat.lash': 'Franslyft',
    'treat.beard': 'Skäggtrim',
    'auth.customer_hub': 'Kundportal',
    'auth.business_partner': 'Företagspartner',
    'auth.sign_in': 'Logga in',
    'auth.create_account': 'Skapa konto',
    'auth.email_customer': 'E-postadress',
    'auth.email_business': 'Företagets e-post',
    'auth.password': 'Lösenord',
    'auth.sign_in_book': 'Logga in för att boka',
    'auth.sign_in_partner': 'Logga in som partner',
    'auth.name_customer': 'Ditt fullständiga namn',
    'auth.name_business': 'Ägare / Chefs namn',
    'auth.phone': 'Telefonnummer',
    'auth.register': 'Registrera & logga in',
    'auth.register_partner': 'Skapa partnerkonto'
  },
  fi: {
    'nav.partner': 'Kumppanin Dashboard',
    'nav.businesses': 'Yrityksille',
    'nav.signin': 'Kirjaudu sisään',
    'hero.search': 'Etsi hoitoja, salonkeja, ammattilaisia...',
    'hero.popular': 'Suositut Hoidot',
    'hero.browse': 'Selaa Kategoriassa',
    'app.category': 'Kategoria',
    'app.results': 'Hakutulokset',
    'app.modify': 'Muokkaa hakua',
    'app.clear': 'Tyhjennä haku',
    'app.available': 'Saatavilla Olevat Salongit',
    'app.featured': 'Suositellut Salongit',
    'treat.haircut': 'Hiustenleikkuu',
    'treat.manicure': 'Geelimanikyyri',
    'treat.massage': 'Syväkudoshieronta',
    'treat.lash': 'Ripsien kohotus',
    'treat.beard': 'Parranajo',
    'auth.customer_hub': 'Asiakasportaali',
    'auth.business_partner': 'Yrityskumppani',
    'auth.sign_in': 'Kirjaudu sisään',
    'auth.create_account': 'Luo tili',
    'auth.email_customer': 'Sähköpostiosoite',
    'auth.email_business': 'Yrityksen sähköposti',
    'auth.password': 'Salasana',
    'auth.sign_in_book': 'Kirjaudu sisään varataksesi',
    'auth.sign_in_partner': 'Kirjaudu sisään kumppanina',
    'auth.name_customer': 'Koko nimesi',
    'auth.name_business': 'Omistajan / Johtajan nimi',
    'auth.phone': 'Puhelinnumero',
    'auth.register': 'Rekisteröidy ja kirjaudu',
    'auth.register_partner': 'Luo kumppanitili'
  },
  dk: {
    'nav.partner': 'Partner Dashboard',
    'nav.businesses': 'For Virksomheder',
    'nav.signin': 'Log ind',
    'hero.search': 'Søg efter behandlinger, saloner, fagfolk...',
    'hero.popular': 'Populære Behandlinger',
    'hero.browse': 'Gennemse efter Kategori',
    'app.category': 'Kategori',
    'app.results': 'Søgeresultater',
    'app.modify': 'Rediger søgning',
    'app.clear': 'Ryd Søgning',
    'app.available': 'Tilgængelige Saloner',
    'app.featured': 'Udvalgte Saloner',
    'treat.haircut': 'Klipning',
    'treat.manicure': 'Gel Manicure',
    'treat.massage': 'Dybdegående Massage',
    'treat.lash': 'Vippebuk',
    'treat.beard': 'Skægtrimning',
    'auth.customer_hub': 'Kundeportal',
    'auth.business_partner': 'Forretningspartner',
    'auth.sign_in': 'Log ind',
    'auth.create_account': 'Opret konto',
    'auth.email_customer': 'E-mailadresse',
    'auth.email_business': 'Virksomheds e-mail',
    'auth.password': 'Adgangskode',
    'auth.sign_in_book': 'Log ind for at booke',
    'auth.sign_in_partner': 'Log ind som partner',
    'auth.name_customer': 'Dit fulde navn',
    'auth.name_business': 'Ejer / Leders navn',
    'auth.phone': 'Telefonnummer',
    'auth.register': 'Registrer & log ind',
    'auth.register_partner': 'Opret partnerkonto'
  },
  pl: {
    'nav.partner': 'Panel Partnera',
    'nav.businesses': 'Dla Firm',
    'nav.signin': 'Zaloguj się',
    'hero.search': 'Szukaj zabiegów, salonów, specjalistów...',
    'hero.popular': 'Popularne Zabiegi',
    'hero.browse': 'Przeglądaj według Kategorii',
    'app.category': 'Kategoria',
    'app.results': 'Wyniki Wyszukiwania',
    'app.modify': 'Zmień wyszukiwanie',
    'app.clear': 'Wyczyść Wyszukiwanie',
    'app.available': 'Dostępne Salony',
    'app.featured': 'Polecane Salony',
    'treat.haircut': 'Strzyżenie',
    'treat.manicure': 'Manicure żelowy',
    'treat.massage': 'Masaż tkanek głębokich',
    'treat.lash': 'Lifting rzęs',
    'treat.beard': 'Strzyżenie brody',
    'auth.customer_hub': 'Portal Klienta',
    'auth.business_partner': 'Partner Biznesowy',
    'auth.sign_in': 'Zaloguj się',
    'auth.create_account': 'Utwórz konto',
    'auth.email_customer': 'Adres e-mail',
    'auth.email_business': 'Firmowy adres e-mail',
    'auth.password': 'Hasło',
    'auth.sign_in_book': 'Zaloguj się, aby zarezerwować',
    'auth.sign_in_partner': 'Zaloguj się jako partner',
    'auth.name_customer': 'Twoje imię i nazwisko',
    'auth.name_business': 'Imię i nazwisko Właściciela / Menedżera',
    'auth.phone': 'Numer telefonu',
    'auth.register': 'Zarejestruj się i zaloguj',
    'auth.register_partner': 'Utwórz konto partnera'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    const saved = localStorage.getItem('strakstime_lang') as LanguageCode;
    if (saved && translations[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('strakstime_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
