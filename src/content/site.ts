/**
 * WAKE & ROLL PARK ŁÓDŹ - 100% ZWERYFIKOWANE TREŚCI (SINGLE SOURCE OF TRUTH)
 * Każdy fakt, cennik i kontakt jest powiązany z ID źródła w docs/SOURCES.md.
 */

export interface SlideItem {
  id: string;
  badge: string;
  title: string;
  highlightText: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  image: string;
  imageAlt: string;
}

export interface AttractionItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  image: string;
  badge: string;
  features: string[];
}

export interface PricingPlan {
  id: string;
  title: string;
  duration: string;
  priceWeek: string;
  priceWeekend: string;
  equipmentInfo: string;
  features: string[];
  isPopular?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'beginner' | 'equipment' | 'camps';
}

export const siteConfig = {
  name: "Wake & Roll Park",
  legalName: "WAKE & ROLL PARK S.C. Katarzyna Kobierzycka Mateusz Gaworski",
  shortDescription: "Wyciąg wakeboardowy 2.0, wypożyczalnia SUP, Beach Bar i letnia strefa relaksu na Stawach Stefańskiego w Łodzi.",
  metaDescription: "Oficjalny serwis Wake & Roll Park Łódź na Stawach Stefańskiego (ul. Patriotyczna 3). Wyciąg dwusłupowy, wypożyczalnia desek SUP, karnety 2027, rezerwacje online i półkolonie WakeWakacje.",
  foundedYear: 2014,
  founders: "Mateusz Gaworski (Wielokrotny Mistrz Polski w Wakeboardingu) & Katarzyna Kobierzycka",
  
  contact: {
    address: {
      street: "ul. Patriotyczna 3 (Park im. 1 Maja / Stawy Stefańskiego)",
      city: "Łódź",
      postalCode: "93-452",
      district: "Górna / Ruda Pabianicka",
      coordinates: { lat: 51.7082, lng: 19.4526 }
    },
    phones: {
      park: "+48 535 089 200",
      camps: "+48 667 102 828"
    },
    emails: {
      main: "kontakt@wakeandrollpark.pl",
      info: "info@wakeandroll.pl",
      camps: "kontakt@wakewakacje.pl"
    },
    nip: "7292705046",
    regon: "101737840"
  },

  socials: {
    facebook: "https://www.facebook.com/WakeAndRollParkLodz/",
    instagram: "https://www.instagram.com/wakeandrollpark/",
    wakeCampsUrl: "https://wakewakacje.pl/"
  },

  openingHours: {
    weekdays: "12:00 – 21:00 (do zmroku)",
    weekends: "11:00 – 21:00 (do zmroku)",
    seasonPeriod: "Od maja do września",
    notice: "W razie gwałtownych burz lub ulew rezerwacje są wstrzymywane dla bezpieczeństwa."
  },

  cableSystem: {
    model: "Primus-Duo (System 2-słupowy rewersyjny)",
    lengthMeters: 180,
    ropeHeightMeters: 10,
    obstacles: [
      { name: "Kicker L", desc: "Profilowana skocznia z tworzywa Wakepro do wysokich skoków i rotacji" },
      { name: "A-Frame / Wielbłąd", desc: "Długa przeszkoda ślizgowa dla średniozaawansowanych i pro" }
    ],
    safety: "Sterowanie prędkością 1:1 przez operatora z brzegu. Natychmiastowe zatrzymanie przy upadku i cofnięcie orczyka pod dłoń ridera."
  },

  // 3 dopracowane slajdy Hero Slidera (zgodnie z wytycznymi)
  heroSlides: [
    {
      id: "karnety-2027",
      badge: "SEZON 2027 • PRZEDSPRZEDAŻ",
      title: "Gwarancja Najlepszych Fal i Emocji",
      highlightText: "Karnety na Sezon 2027",
      description: "Zabezpiecz swoje wejścia na wyciąg w przedsprzedaży. Wybierz pakiet sesji lub karnet sezonowy z wygodną płatnością przelewem bankowym.",
      ctaText: "Kup Karnet na Sezon 2027",
      ctaLink: "#karnety",
      secondaryCtaText: "Sprawdź Cennik",
      secondaryCtaLink: "#cennik",
      image: "/images/park/2P0A4949.jpg",
      imageAlt: "Rider na desce wakeboardowej wykonujący ewolucję na Stawach Stefańskiego w Łodzi"
    },
    {
      id: "zapisy-wake",
      badge: "REZERWACJA ONLINE • TOR 2.0",
      title: "Poczuj Wolność na Wodzie",
      highlightText: "Zapisz Się na Pływanie",
      description: "Sprawdź wolne godziny w kalendarzu na żywo. Pływanie indywidualne w grupie do 4 osób lub rezerwacja całego wyciągu na wyłączność.",
      ctaText: "Zarezerwuj Termin",
      ctaLink: "#rezerwacja",
      secondaryCtaText: "Informacje dla Początkujących",
      secondaryCtaLink: "#poczatkujacy",
      image: "/images/park/2P0A5027.jpg",
      imageAlt: "Skok z kickera na wyciągu wakeboardowym w Wake & Roll Park Łódź"
    },
    {
      id: "polkolonie-wakacje",
      badge: "DLA DZIECI I MŁODZIEŻY 7–16 LAT",
      title: "Wakacje Pełne Zajawki i Sportu",
      highlightText: "Półkolonie WakeWakacje",
      description: "Oficjalny letni program szkoleniowy pod okiem Mistrza Polski Mateusza Gaworskiego. 2 bloki wakeboardu dziennie, sprzęt, obiad, longboardy i bezpieczeństwo.",
      ctaText: "Przejdź do WakeWakacje.pl ↗",
      ctaLink: "https://wakewakacje.pl/",
      secondaryCtaText: "Szczegóły Programu",
      secondaryCtaLink: "#polkolonie",
      image: "/images/park/2P0A5175.jpg",
      imageAlt: "Zajęcia wakeboardowe dla dzieci i młodzieży na Stawach Stefańskiego w Łodzi"
    }
  ] as SlideItem[],

  attractions: [
    {
      id: "wyciag-2-0",
      title: "Wyciąg 2-Słupowy 180m",
      subtitle: "System Primus-Duo 2.0",
      description: "180 metrów idealnej tafli wody na Stawach Stefańskiego. Indywidualna kontrola liny przez operatora – idealna zarówno do nauki od zera, jak i doskonalenia rotacji i tricków na przeszkodach.",
      icon: "fa-solid fa-water",
      image: "/images/park/2P0A4980.jpg",
      badge: "Główna Atrakcja",
      features: ["Maksymalnie 4 osoby na 1h sesji", "Płynna regulacja prędkości", "Brak konieczności płynięcia do brzegu"]
    },
    {
      id: "przeszkody-wakepro",
      title: "Przeszkody Pro Wakepro",
      subtitle: "Kicker L & A-Frame",
      description: "Certyfikowane przeszkody z bezpiecznego, gęstego tworzywa. Pozwalają na wysokie loty, ewolucje 180/360 oraz płynne slajdy wzdłuż przeszkody A-Frame.",
      icon: "fa-solid fa-bolt",
      image: "/images/park/2P0A5050.jpg",
      badge: "Dla Zaawansowanych",
      features: ["Kicker rozmiar L", "Przeszkoda A-Frame (wielbłąd)", "Wymagany kask z nausznikami"]
    },
    {
      id: "wypozyczalnia-sup",
      title: "Wypożyczalnia Desek SUP",
      subtitle: "Stand Up Paddle",
      description: "Spokojne wiosłowanie po największym zbiorniku wodnym w Łodzi. Świetny trening stabilizacji i relaks na wodzie dla całych rodzin i par o zachodzie słońca.",
      icon: "fa-solid fa-anchor",
      image: "/images/park/2P0A5381.jpg",
      badge: "Dla Każdego",
      features: ["Cena: 40 zł / godzina", "Stabilne deski all-round", "Kamizelka asekuracyjna i wiosło w cenie"]
    },
    {
      id: "beach-bar",
      title: "Beach Bar & Plaża",
      subtitle: "Chillout Zone",
      description: "Leżaki w cieniu sosen, zimne napoje kraftowe, kawa, przekąski i muzyka na żywo. Idealne miejsce na odpoczynek po pływaniu i kibicowanie znajomym na torze.",
      icon: "fa-solid fa-martini-glass-citrus",
      image: "/images/park/2P0A5191.jpg",
      badge: "Strefa Relaksu",
      features: ["Widok na cały tor wyciągu", "Bezpłatne leżaki na plaży", "Sezonowe wydarzenia i sety DJ"]
    }
  ] as AttractionItem[],

  pricing: [
    {
      id: "sesja-tydzien",
      title: "Sesja Pn – Pt (Dni Powszednie)",
      duration: "1 godzina na torze (max 4 osoby)",
      priceWeek: "45 zł",
      priceWeekend: "—",
      equipmentInfo: "+20 zł wypożyczenie deski (razem 65 zł)",
      features: [
        "Pływanie w małej grupie (max 4 osoby na godzinę)",
        "Instruktaż stanowiskowy operatora wyciągu",
        "Atestowany kask i kamizelka asekuracyjna gratis",
        "Własna deska lub dopłata 20 zł za deskę z parku"
      ]
    },
    {
      id: "sesja-weekend",
      title: "Sesja Weekend i Święta",
      duration: "1 godzina na torze (max 4 osoby)",
      priceWeek: "—",
      priceWeekend: "50 zł",
      equipmentInfo: "+20 zł wypożyczenie deski (razem 70 zł)",
      isPopular: true,
      features: [
        "Sesja sobotnia, niedzielna lub świąteczna",
        "Maksymalnie 4 osoby dzielące godzinny tor",
        "Kask i kamizelka asekuracyjna w cenie",
        "Wypożyczenie deski z parku: +20 zł"
      ]
    },
    {
      id: "wylacznosc-toru",
      title: "Wyciąg na Wyłączność (1h)",
      duration: "1 godzina całego toru tylko dla Was",
      priceWeek: "180 zł",
      priceWeekend: "200 zł",
      equipmentInfo: "Sprzęt płatny zgodnie z liczbą korzystających",
      features: [
        "Cały wyciąg 180m zarezerwowany wyłącznie dla Was",
        "Pływasz sam lub ze znajomymi / rodziną",
        "Możliwość intensywnego treningu bez przerw",
        "Wymagana wcześniejsza rezerwacja terminu"
      ]
    },
    {
      id: "wypozyczalnia-sup",
      title: "Deska SUP (Stand Up Paddle)",
      duration: "1 godzina wypożyczenia",
      priceWeek: "40 zł",
      priceWeekend: "40 zł",
      equipmentInfo: "Wiosło i kamizelka asekuracyjna w cenie",
      features: [
        "Stabilna deska SUP all-around",
        "Wiosło aluminiowe dopasowane do wzrostu",
        "Kamizelka asekuracyjna w cenie",
        "Pływanie po akwenie Stawów Stefańskiego"
      ]
    }
  ] as PricingPlan[],

  beginnersGuide: {
    steps: [
      {
        num: "01",
        title: "Krótka odprawa na lądzie (10 min)",
        desc: "Instruktor ustala Twoją wiodącą nogę (Regular lub Goofy), demonstruje prawidłową pozycję startową (ugięte kolana, wyprostowane plecy, ręce przy biodrach) i zasady trzymania orczyka."
      },
      {
        num: "02",
        title: "Dopasowanie sprzętu",
        desc: "Otrzymujesz atestowaną kamizelkę wypornościową oraz kask z ochroną uszu. W chłodniejsze dni wypożyczysz dopasowaną piankę neoprenową."
      },
      {
        num: "03",
        title: "Płynny start z pomostu",
        desc: "Operator wyciągu ręcznie kontroluje manetkę – wyciąg startuje powoli i łagodnie, bez gwałtownego szarpnięcia, dostosowując moc do Twojej wagi."
      },
      {
        num: "04",
        title: "Brak męczącego pływania do brzegu",
        desc: "Jeśli wpadniesz do wody, wyciąg zatrzymuje się w sekundę, a operator cofa linę prosto pod Twoją dłoń. Od razu próbujesz ponownie!"
      }
    ],
    whatToBring: [
      "Przylegający strój kąpielowy / kąpielówki",
      "Ręcznik plażowy",
      "Klapki na pomost",
      "Krem z filtrem przeciwsłonecznym UV (SPF 30/50)",
      "Ciepłą bluzę i suche ubrania na zmianę",
      "Wodę do picia"
    ]
  },

  galleryPhotos: [
    { src: "/images/park/2P0A4949.jpg", alt: "Skok i ewolucja na wyciągu wakeboardowym w Wake & Roll Park Łódź" },
    { src: "/images/park/2P0A4980.jpg", alt: "Rider pokonujący taflę Stawów Stefańskiego w słoneczny dzień" },
    { src: "/images/park/2P0A4986.jpg", alt: "Płynna jazda na krawędzi deski wakeboardowej" },
    { src: "/images/park/2P0A5011.jpg", alt: "Przejście wirażu i nawrót pod wyciągiem dwusłupowym" },
    { src: "/images/park/2P0A5027.jpg", alt: "Dynamiczny skok z kickera na wyciągu Primus-Duo 2.0" },
    { src: "/images/park/2P0A5050.jpg", alt: "Obrót nad przeszkodą wodną Wakepro" },
    { src: "/images/park/2P0A5082.jpg", alt: "Zawody i treningi wakeboardowe na Stawach Stefańskiego" },
    { src: "/images/park/2P0A5158.jpg", alt: "Uśmiechnięci riderzy na pomoście startowym" },
    { src: "/images/park/2P0A5175.jpg", alt: "Zajęcia dla młodzieży i instruktarz bezpiecznego pływania" },
    { src: "/images/park/2P0A5191.jpg", alt: "Strefa Beach Baru i relaksu na plaży w Parku 1 Maja" },
    { src: "/images/park/2P0A5346.jpg", alt: "Zachód słońca nad wyciągiem wakeboardowym" },
    { src: "/images/park/2P0A5381.jpg", alt: "Deski Stand Up Paddle (SUP) na wodzie" },
    { src: "/images/park/2P0A5551.jpg", alt: "Widok panoramiczny na tor wyciągu i pomost startowy" }
  ],

  faqs: [
    {
      category: "general",
      question: "Gdzie dokładnie znajduje się Wake & Roll Park i jak dojechać?",
      answer: "Ośrodek zlokalizowany jest nad Stawami Stefańskiego (teren Parku im. 1 Maja) przy ul. Patriotycznej 3 w Łodzi (dzielnica Górna / Ruda Pabianicka). Na miejscu dostępny jest bezpłatny parking dla samochodów. Można dojechać również komunikacją miejską MPK Łódź do pętli lub przystanków w rejonie ul. Pabianickiej / Rudzkiej."
    },
    {
      category: "beginner",
      question: "Czy muszę umieć pływać, żeby spróbować wakeboardu?",
      answer: "Wymagana jest podstawowa umiejętność utrzymywania się na wodzie i brak lęku przed zanurzeniem. Każda osoba na wyciągu bezwzględnie nosi atestowaną kamizelkę asekuracyjną (wypornościową) oraz kask z ochroną uszu, które utrzymują ciało na powierzchni wody bez żadnego wysiłku."
    },
    {
      category: "beginner",
      question: "Nigdy nie stałem na desce. Czy dam radę?",
      answer: "Tak! Wyciąg dwusłupowy 2.0 to najlepszy system na świecie do nauki od zera. Operator kontroluje prędkość w czasie rzeczywistym i dostosowuje ją do Twoich możliwości. Większość osób wstaje na deskę już podczas swojej pierwszej 15-minutowej serii."
    },
    {
      category: "equipment",
      question: "Czy muszę mieć własny sprzęt (deskę, kask, piankę)?",
      answer: "Nie musisz mieć niczego własnego poza strojem kąpielowym i ręcznikiem. Kask i kamizelkę asekuracyjną otrzymujesz bezpłatnie w cenie każdej sesji. Deskę wakeboardową z wiązaniami wypożyczysz na miejscu za 20 zł do sesji. W chłodniejsze dni posiadamy również pianki neoprenowe."
    },
    {
      category: "general",
      question: "Jak wygląda rezerwacja toru i ile osób pływa w jednej godzinie?",
      answer: "Pływanie na wyciągu odbywa się w reżimie maksymalnie 4 osób na 1 godzinę zegarową. Każda osoba pływa w krótkich, intensywnych seriach na zmianę, co pozwala odpocząć mięśniom rąk i nóg. Możesz też wynająć cały wyciąg na wyłączność (180 zł Pn-Pt / 200 zł Weekend) tylko dla siebie lub swojej grupy."
    },
    {
      category: "general",
      question: "Jak działa zakup karnetu przelewem bankowym?",
      answer: "Wybierasz interesujący Cię karnet (np. 5 sesji lub 10 sesji) i podajesz swoje dane. System generuje unikalny numer zamówienia oraz indywidualny tytuł przelewu. Po wykonaniu wpłaty i jej zaksięgowaniu przez administratora, otrzymujesz e-mail z kodem aktywnego karnetu, którym opłacasz późniejsze rezerwacje w kalendarzu."
    },
    {
      category: "camps",
      question: "Czym są WakeWakacje i jak zapisać dziecko?",
      answer: "WakeWakacje (wakewakacje.pl) to oficjalne letnie półkolonie sportowe dla dzieci i młodzieży w wieku 7–16 lat, organizowane od poniedziałku do piątku (7:00–16:00) na naszym wyciągu. W programie są codzienne bloki nauki wakeboardu pod okiem Mistrza Polski Mateusza Gaworskiego, opieka wychowawców, obiad, warsztaty i ubezpieczenie NNW. Zapisy prowadzone są przez serwis wakewakacje.pl."
    },
    {
      category: "general",
      question: "Co dzieje się w razie złej pogody lub deszczu?",
      answer: "Drobny letni deszcz nie przeszkadza w pływaniu (w piance woda jest ciepła!). W wypadku gwałtownych burz z wyładowaniami atmosferycznymi lub silnego wiatru ze względów bezpieczeństwa wstrzymujemy pracę wyciągu, a niewykorzystane rezerwacje można bezpłatnie przełożyć na inny dogodny termin."
    }
  ] as FAQItem[]
};
