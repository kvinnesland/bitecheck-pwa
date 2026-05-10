export interface SpeciesInfo {
  description: string;
  tempRange: [number, number];
  tempLabel: string;
  bestPressure: string;
  bestLight: string;
  bestTide: string;
}

export const SPECIES_INFO: Record<string, SpeciesInfo> = {
  Torsk: {
    description:
      'Torsken er Norges viktigste matfisk og finnes langs hele kysten. Den er mest aktiv når trykket faller, noe som utløser beiteatferd i stimer. Beste fiske skjer i kaldt vann mellom 4 og 8 °C, særlig på dypt vann om vinteren.',
    tempRange: [4, 8],
    tempLabel: '4–8 °C',
    bestPressure: 'Fallende',
    bestLight: 'Lavt lys',
    bestTide: 'Stigende',
  },
  Kveite: {
    description:
      'Kveita er Norges største flatfisk og kan bli over 300 kg. Den er primært et dypvannsdyr som følger tidevannets bevegelser for å jakte på annen fisk. Stor og mektig – kveite krever tålmodighet og riktig utstyr.',
    tempRange: [4, 10],
    tempLabel: '4–10 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Lavt lys',
    bestTide: 'Stigende',
  },
  Sei: {
    description:
      'Seien er en hurtig og stimfisk som jakter aktivt i vannmassene. Den trives best i moderat strøm og er særlig aktiv i tusmørkeet når lyset er lavt. Sei finnes langs hele norskekysten og er en populær sportsfisk.',
    tempRange: [6, 14],
    tempLabel: '6–14 °C',
    bestPressure: 'Fallende',
    bestLight: 'Tusmørke',
    bestTide: 'Stigende',
  },
  Hyse: {
    description:
      'Hysen er nær beslektet med torsken, men slankere og med et karakteristisk sort skulderflekkmerke. Den er mest aktiv ved fallende lufttrykk og lever nær bunnen på sandbunn og skjellsand. Hysen gir god kamp på lett utstyr.',
    tempRange: [4, 10],
    tempLabel: '4–10 °C',
    bestPressure: 'Fallende',
    bestLight: 'Dagslys',
    bestTide: 'Stigende',
  },
  Lange: {
    description:
      'Langen er en langstrakt torskefisk som lever på dypt, hardt bunn. Den foretrekker stille vann med lite strøm og er særlig aktiv ved stigende tidevann. Langens lange kropp og nennsom bit krever en viss teknikk.',
    tempRange: [4, 10],
    tempLabel: '4–10 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Lavt lys',
    bestTide: 'Stigende',
  },
  Brosme: {
    description:
      'Brosmen er en dypvannsfisk med lang ryggfinne og kraftig barbel under haken. Den holder til på steinbunn og korallrev på dypt vann. Brosme er en seig fighter og smaker utmerket røkt eller saltet.',
    tempRange: [4, 8],
    tempLabel: '4–8 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Lavt lys',
    bestTide: 'Stigende',
  },
  Uer: {
    description:
      'Ueren er en langlivende rødfisk som kan bli over 100 år gammel. Den er nattaktiv og trives i stabilt vær med lite bevegelse i vannmassene. Store uer holder til på dypt vann i fjordene og langs ytterkysten.',
    tempRange: [4, 8],
    tempLabel: '4–8 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Natt',
    bestTide: '—',
  },
  Steinbit: {
    description:
      'Steinbiten har et stort, avrundet hode med kraftige tenner som kan knuse skjell og krabber. Den holder til på steinbunn i kaldt vann og er aktiv året rundt. Steinbiten er lite sky og biter godt i stabilt vær.',
    tempRange: [4, 10],
    tempLabel: '4–10 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Lavt lys',
    bestTide: 'Stigende',
  },
  Makrell: {
    description:
      'Makrellen er en rask, stimfisk som inntar norske kystfarvann om sommeren når vannet er varmt. Den biter best i lett til moderat bris som rører overflaten. Makrell er kjent for sine intense kamper og er utmerket til mat.',
    tempRange: [12, 24],
    tempLabel: '12–24 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Dagslys',
    bestTide: '—',
  },
  Rødspette: {
    description:
      'Rødspetta er en fargerik flatfisk med karakteristiske oransje prikker på oversiden. Den finnes på sandbunn i grunne kystfarvann og er særlig aktiv ved stigende tidevann. Rødspette er en delikatesse og gir god sport på lettutstyr.',
    tempRange: [8, 16],
    tempLabel: '8–16 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Dagslys',
    bestTide: 'Stigende',
  },
  Lomre: {
    description:
      'Lomra er den minste av de norske flyndrefiskene og lever på sandbunn i rolige, grunne farvann. Den er lite krevende å fiske etter, men krever fint agn nær bunnen. Lomre er god på tallerkenen trass i beskjeden størrelse.',
    tempRange: [8, 16],
    tempLabel: '8–16 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Dagslys',
    bestTide: '—',
  },
  Sandflyndre: {
    description:
      'Sandflyndra ligner lomra, men er noe mer langstrakt og foretrekker litt dypere sandbunn. Den er et byttedyr for kveite og torsk, men kan også fiskes på lett snøre med mark. Sandflyndre gir god smak fra norske kystfarvann.',
    tempRange: [8, 16],
    tempLabel: '8–16 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Dagslys',
    bestTide: '—',
  },
  Sild: {
    description:
      'Silden vandrer i store stimer langs norskekysten og er en nøkkelart i havøkosystemet. Den er mest aktiv i kjølig til temperert vann og samler seg gjerne i store stimer rundt fullmåne og nymåne. Sild er en klassisk norsk matfisk.',
    tempRange: [6, 14],
    tempLabel: '6–14 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Natt',
    bestTide: '—',
  },
  Laks: {
    description:
      'Laksen er en legendarisk sportsfisk som returnerer til elven der den ble klekket. I sjøen biter laksen best i tusmørkeet ved fallende lufttrykk. Den er en kraftig fighter som krever godt utstyr og tålmodighet fra fiskeren.',
    tempRange: [8, 18],
    tempLabel: '8–18 °C',
    bestPressure: 'Fallende',
    bestLight: 'Tusmørke',
    bestTide: 'Stigende',
  },
  Sjøørret: {
    description:
      'Sjøørreten er brunørretens sjøvandrende form og finnes langs kysten i saltvann deler av året. Den er svært temperert og biter best i lavt lys ved fallende trykk. Sjøørret er kjent for ville hopp og spektakulære kamper på lett utstyr.',
    tempRange: [8, 16],
    tempLabel: '8–16 °C',
    bestPressure: 'Fallende',
    bestLight: 'Tusmørke',
    bestTide: 'Stigende',
  },
  Sjørøye: {
    description:
      'Sjørøya er den nordligste av de anadrome laksefiskene og trives i kaldt arktisk vann. Den vandrer mellom ferskvann og saltvann og er kjent for sine intense farger i gytetiden. Sjørøye er en delikatesse med fast, rosa kjøtt.',
    tempRange: [2, 14],
    tempLabel: '2–14 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Lavt lys',
    bestTide: 'Stigende',
  },
  Ørret: {
    description:
      'Brunørreten er en av Norges mest ettertraktede sportsfisker og finnes i elver og innsjøer over hele landet. Den er best aktiv ved fallende lufttrykk og biter godt i det ideelle temperaturvinduet på 8–14 °C. Ørreten er en taktisk og krevende fisk.',
    tempRange: [8, 14],
    tempLabel: '8–14 °C',
    bestPressure: 'Fallende',
    bestLight: 'Tusmørke',
    bestTide: '—',
  },
  Røye: {
    description:
      'Røya er en kaldtvannsart som trives best i dype, klare innsjøer. Den biter godt ved fallende trykk i kjølig vann og er særlig aktiv om høsten i gytetiden. Røye er Norges vakreste innlandsfisk med sine karakteristiske farger.',
    tempRange: [4, 8],
    tempLabel: '4–8 °C',
    bestPressure: 'Fallende',
    bestLight: 'Lavt lys',
    bestTide: '—',
  },
  Abbor: {
    description:
      'Abboren er en av de vanligste innlandsfiskene i Norge og kjennes igjen på de vertikale stripene langs kroppen. Den er varmtvannsfisk og biter best om sommeren i tusmørkeet. Abbor samler seg gjerne rundt vegetasjon og strukturer nær land.',
    tempRange: [15, 22],
    tempLabel: '15–22 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Tusmørke',
    bestTide: '—',
  },
  Gjedde: {
    description:
      'Gjedda er toprøveren i norske innsjøer og elver med sitt karakteristiske andesnute og kraftige kropp. Den er en ambushjeger som liker lavt lys og venter stille på byttet. Store gjedder kan veie over 10 kg og er en av de mest spennende sportsfiskene i ferskvann.',
    tempRange: [10, 20],
    tempLabel: '10–20 °C',
    bestPressure: 'Fallende',
    bestLight: 'Lavt lys',
    bestTide: '—',
  },
  Harr: {
    description:
      'Harren er kjent for sin imponerende seildorsalfinne og finnes i klare, raske elver med god vannkvalitet. Den er en delikat fluefisk som stiger til overflaten for å ta insekter. Harr er krevende å lure og belønner deg med spektakulære hopp.',
    tempRange: [8, 14],
    tempLabel: '8–14 °C',
    bestPressure: 'Stabilt',
    bestLight: 'Tusmørke',
    bestTide: '—',
  },
};
