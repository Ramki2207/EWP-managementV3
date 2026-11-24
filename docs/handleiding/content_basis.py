INLEIDING = {
    "title": "Inleiding",
    "sections": [
        {
            "title": "Over deze handleiding",
            "blocks": [
                ("p", "Deze handleiding beschrijft het volledige EWP Paneelbouw projectsysteem: van het aanmaken van een project tot het opleveren en factureren ervan. De handleiding is ingedeeld per rol, zodat iedere medewerker snel zijn eigen hoofdstuk kan vinden."),
                ("list", [
                    "**Hoofdstuk 2** legt uit hoe je inlogt en hoe het systeem werkt. Dit geldt voor iedereen.",
                    "**Hoofdstuk 3** beschrijft het hele proces van Intake tot Gereed en laat zien wie in welke fase aan zet is.",
                    "**Hoofdstuk 4** behandelt functies die iedere medewerker gebruikt, zoals de weekstaat en verlof.",
                    "**Hoofdstuk 5 t/m 11** zijn de rol-hoofdstukken. Lees vooral het hoofdstuk van je eigen rol.",
                    "**Hoofdstuk 12** is bedoeld voor klanten die het klantportaal of het verdeler portaal gebruiken.",
                    "De **bijlagen** bevatten naslagtabellen: statussen, activiteitcodes, documentmappen en veelvoorkomende meldingen.",
                ]),
                ("h3", "Leeswijzer"),
                ("list", [
                    "Namen van knoppen, tabbladen, velden en menu-items staan **vetgedrukt**, precies zoals ze in het systeem staan.",
                    "Stappen die je in volgorde uitvoert zijn genummerd.",
                    "Een blauw kader bevat een tip, een oranje kader een waarschuwing.",
                    "Grijze kaders met een stippellijn zijn plekken voor een schermafbeelding.",
                ]),
                ("tip", "Sommige rechten kunnen per medewerker afwijken van de standaard voor zijn rol. Zie je een knop of menu-item niet dat hier wel beschreven staat? Vraag dan de beheerder om je rechten te controleren."),
            ],
        },
        {
            "title": "Rollen in het systeem",
            "blocks": [
                ("p", "Iedere gebruiker heeft één rol. De rol bepaalt welke menu-items je ziet en wat je mag doen."),
                ("table", ["Rol", "Omschrijving", "Hoofdstuk"], [
                    ["Administrator", "Volledige toegang tot alle systeemfuncties, gebruikers en instellingen", "5"],
                    ["Projectleider", "Volledige projectverantwoordelijkheid en teamcoördinatie", "6"],
                    ["Standaard Gebruiker", "Reguliere bedrijfsoperaties en projectbeheer", "6"],
                    ["Planner", "Projectplanning en resource management", "7"],
                    ["Montage (monteur)", "Assemblage en productiewerkzaamheden", "8"],
                    ["Tester", "Kwaliteitsborging en testprocedures", "9"],
                    ["Logistiek", "Transport en leveringscoördinatie", "10"],
                    ["Magazijn", "Voorraad- en materiaalbeheer", "11"],
                    ["Servicedesk", "Onderhoud en klantenservice", "11"],
                    ["Finance", "Financiële administratie en facturatie", "11"],
                ]),
                ("h3", "Menu per rol (standaard)"),
                ("table", ["Menu-item", "Admin", "Projectl.", "Std./Planner/Logistiek", "Tester/Finance", "Montage/Magazijn", "Servicedesk"], [
                    ["Startpagina", "x", "x", "x", "x", "x", "x"],
                    ["Projecten", "x", "x", "x", "x", "x", "x"],
                    ["Verdelers", "x", "x", "x", "x", "x", "x"],
                    ["Klanten", "x", "x", "x", "x", "x", "x"],
                    ["Urenstaat & Verlof", "x", "x", "x", "x", "x", "x"],
                    ["Meldingen (verlof)", "x", "", "", "", "", ""],
                    ["EWP Services", "x", "x", "x", "x", "x", "x"],
                    ["Personeelsbeheer", "x", "", "", "", "", ""],
                    ["Uploads", "x", "x", "x", "x", "x", "x"],
                    ["Gebruikers", "x", "x (lezen)", "", "", "", ""],
                    ["Toegangscodes", "x", "x", "x", "x", "", ""],
                    ["Klant Portals", "x", "x", "x", "x", "", ""],
                    ["Inzichten", "x", "x", "x", "x", "x", ""],
                    ["PDF Optimizer", "x", "", "", "", "", ""],
                    ["Mijn account / Help", "x", "x", "x", "x", "x", "x"],
                ]),
                ("p", "**Meldingen** en **Personeelsbeheer** zijn naast de administrator ook beschikbaar voor de aangewezen HR-medewerkers."),
            ],
        },
    ],
}

AAN_DE_SLAG = {
    "title": "Aan de slag (voor iedereen)",
    "sections": [
        {
            "title": "Inloggen",
            "blocks": [
                ("steps", [
                    "Open het systeem in je browser. Je ziet het inlogscherm **Welkom terug** met het EWP-logo.",
                    "Vul bij **Gebruikersnaam** je gebruikersnaam in. Let op hoofdletters: de naam moet precies overeenkomen.",
                    "Vul bij **Wachtwoord** je wachtwoord in. Met het oog-icoon kun je het wachtwoord zichtbaar maken.",
                    "Klik op **Inloggen**. Bij succes zie je **Succesvol ingelogd!** en kom je op de **Startpagina**.",
                ]),
                ("shot", "Het inlogscherm met de velden Gebruikersnaam en Wachtwoord"),
                ("table", ["Melding", "Betekenis / oplossing"], [
                    ["Vul je gebruikersnaam en wachtwoord in!", "Een van beide velden is leeg."],
                    ["Gebruiker niet gevonden. Controleer je gebruikersnaam.", "De naam bestaat niet; controleer de spelling en hoofdletters."],
                    ["Verkeerd wachtwoord. Probeer het opnieuw.", "Het wachtwoord klopt niet."],
                    ["Je account is geblokkeerd. Neem contact op met de beheerder.", "Je account is uitgeschakeld door een beheerder."],
                ]),
                ("tip", "Er is geen knop 'wachtwoord vergeten'. Ben je je wachtwoord kwijt, vraag dan een beheerder om een nieuw wachtwoord in te stellen via Gebruikers."),
            ],
        },
        {
            "title": "De Startpagina en het menu",
            "blocks": [
                ("p", "Na het inloggen kom je op de **Startpagina**. Bovenaan staat een persoonlijke begroeting met de datum. Wat je verder op de Startpagina ziet, hangt af van je rol. Dit staat beschreven in het hoofdstuk van je rol."),
                ("p", "Aan de linkerkant staat het menu met de onderdelen waar je toegang toe hebt. Onderaan het menu staan **Mijn account** en **Help**. Op een telefoon of tablet open je het menu met de menuknop linksboven."),
                ("shot", "De Startpagina met het menu aan de linkerkant"),
                ("h3", "Locatiefilter"),
                ("p", "Medewerkers die meerdere vestigingen aansturen, zien in het begroetingsblok een **Locatie filter:**. Hiermee bepaal je van welke vestigingen je projecten ziet."),
                ("steps", [
                    "Klik op de knop naast **Locatie filter:**.",
                    "Kies **Alles** of vink een of meer locaties aan: **Den Haag**, **Rotterdam**, **Utrecht**, **Arnhem**.",
                    "Klik op **Opslaan**. Je keuze wordt onthouden op deze computer.",
                ]),
                ("shot", "Het locatiefilter op de Startpagina, opengeklapt"),
                ("h3", "Werken met tabbladen"),
                ("p", "Op een groot scherm kun je meerdere pagina's tegelijk openhouden. Beweeg met de muis over een menu-item en klik op het **+** teken (**Open in nieuw tabblad**). De tabbladen verschijnen bovenaan. Klik op een tabblad om te wisselen en op het kruisje om het te sluiten."),
                ("shot", "De tabbladbalk met meerdere geopende pagina's"),
                ("h3", "Uitloggen"),
                ("p", "De knop **Uitloggen** staat op de **Startpagina**, rechtsboven in het begroetingsblok."),
                ("h3", "Toegang geweigerd"),
                ("p", "Open je een pagina waarvoor je geen rechten hebt, dan zie je **Toegang Geweigerd**. Klik op **Terug** om terug te gaan. Heb je de pagina nodig voor je werk, vraag dan de beheerder om je rechten aan te passen."),
            ],
        },
        {
            "title": "Mijn account",
            "blocks": [
                ("p", "Via **Mijn account** (onderaan het menu) beheer je je eigen gegevens."),
                ("steps", [
                    "Klik in het menu op **Mijn account**.",
                    "Klik op **Profiel bewerken**.",
                    "Pas zo nodig je **E-mailadres** aan. Je **Gebruikersnaam** kun je niet zelf wijzigen.",
                    "Kies bij **Profielfoto** voor **Nieuwe foto uploaden** om een foto te kiezen.",
                    "Wil je je wachtwoord wijzigen? Vul bij **Wachtwoord wijzigen** je **Huidig wachtwoord** in, daarna twee keer je **Nieuw wachtwoord**.",
                    "Klik op **Wijzigingen opslaan**.",
                ]),
                ("shot", "Mijn account in bewerkmodus, met profielfoto en wachtwoord wijzigen"),
                ("p", "Onder **Toegangsrechten** zie je per onderdeel of je mag lezen en/of schrijven."),
            ],
        },
        {
            "title": "Help",
            "blocks": [
                ("p", "Via **Help** onderaan het menu vind je contactgegevens van de systeembeheerder (Process Improvement B.V.), veelgestelde vragen, een korte 'Snel aan de slag' en de supportcategorieën. Met het formulier op het tabblad **Contact** stuur je direct een vraag."),
            ],
        },
    ],
}

PROCES = {
    "title": "Het proces: van Intake tot Gereed",
    "sections": [
        {
            "title": "Overzicht",
            "blocks": [
                ("p", "Ieder project doorloopt een vaste reeks fases. Elke fase heeft een eigen status. Dit hoofdstuk laat per fase zien wat er gebeurt, wie aan zet is en welke knoppen je gebruikt."),
                ("flow", ["Intake", "Offerte", "Order", "Werkvoorbereiding", "Productie", "Testen", "Levering", "Gereed voor facturatie", "Opgeleverd / Gereed"]),
                ("table", ["Fase", "Wie is aan zet", "Wat gebeurt er", "Volgende stap"], [
                    ["Intake", "Projectleider", "Project aanmaken, klant en verdelers vastleggen, intakeformulier", "Offerte maken"],
                    ["Offerte", "Projectleider", "Offerte opstellen; verdelers staan vast op Offerte", "Opdracht van klant"],
                    ["Order", "Projectleider", "Opdracht ontvangen, documenten verzamelen", "Tekeningen maken"],
                    ["Werkvoorbereiding", "Projectleider / tekenaar", "Verdeler aanzicht en Installatie schema per verdeler, teken uren", "Monteur toewijzen, planning"],
                    ["Productie", "Monteur", "Bouwen, uren en materiaal registreren, Productie Checklist", "Indienen voor beoordeling"],
                    ["Testen", "Tester", "Pre-checklist beoordelen, keuring uitvoeren, keuringsrapport", "Testuren boeken, status Levering"],
                    ["Levering", "Logistiek", "Levering checklist, foto's, pakbon, sticker, klant informeren", "Afleveren en laten tekenen"],
                    ["Gereed voor facturatie", "Administratie / Finance", "Factuurrapport (uren en materialen)", "Factureren"],
                    ["Opgeleverd / Gereed", "Projectleider", "Project afgerond, alle verdelers opgeleverd", "Onderhoud via EWP Services"],
                ]),
                ("p", "Een project dat niet doorgaat krijgt de status **Verloren** (offerte niet gegund) of **Vervallen** (geannuleerd). Een project dat nog niet compleet is ingevoerd heeft de status **Concept**."),
                ("h3", "Hoe de projectstatus meebeweegt met de verdelers"),
                ("p", "Elke verdeler heeft een eigen status: **Offerte**, **Productie**, **Testen**, **Gereed**, **Levering** of **Opgeleverd**. Wijzig je de status van een verdeler, dan zet het systeem de projectstatus automatisch op de status van de verdeler die het minst ver is."),
                ("tip", "Voorbeeld: een project heeft drie verdelers. Twee staan op Testen, één nog op Productie. Het project staat dan op Productie. Pas als ook de derde verdeler op Testen staat, gaat het project naar Testen."),
                ("warn", "Een handmatig gekozen projectstatus zoals Order of Gereed voor facturatie wordt overschreven zodra de status van een verdeler wijzigt. Controleer daarom na een statuswijziging van een verdeler of de projectstatus nog klopt."),
            ],
        },
        {
            "title": "Fase 1 – Intake en Offerte",
            "blocks": [
                ("p", "**Wie:** projectleider of standaard gebruiker."),
                ("steps", [
                    "Ga naar **Projecten** en klik op **Project toevoegen**, of klik op de Startpagina op **Nieuw Project**.",
                    "Vul bij **Project Details** het projectnummer, de klant en de overige gegevens in. Zet de **Status** op **Intake** of **Offerte**.",
                    "Vink eventueel **Intake formulier invullen** aan en vul de kastspecificaties, kabelconfiguratie en afgaande velden in.",
                    "Voeg bij **Verdelers** alle verdelers toe.",
                    "Upload bij **Uploads** de aanvraag, opname locatie, calculatie en offerte in de juiste mappen.",
                    "Sla het project op. Zie paragraaf 6.1 voor alle details van het aanmaken.",
                ]),
                ("p", "Zolang het project op **Offerte** staat, staan alle verdelers ook vast op **Offerte**."),
                ("shot", "Een project met status Offerte in de projectenlijst"),
            ],
        },
        {
            "title": "Fase 2 – Order",
            "blocks": [
                ("p", "**Wie:** projectleider. Na de opdracht van de klant zet je het project op **Order**."),
                ("steps", [
                    "Open het project via **Projecten** en klik op **Openen**.",
                    "Klik rechtsboven op **Bewerken**.",
                    "Kies bij **Status** de waarde **Order** en klik op **Opslaan**.",
                    "Upload de opdracht en bestelling in **Documenten** onder de mappen **Opdracht** en **Bestelling**.",
                ]),
            ],
        },
        {
            "title": "Fase 3 – Werkvoorbereiding",
            "blocks": [
                ("p", "**Wie:** projectleider / tekenaar. In deze fase worden de tekeningen gemaakt."),
                ("steps", [
                    "Upload per verdeler het **Verdeler aanzicht** en het **Installatie schema** in **Documenten** > **Verdelers**.",
                    "Zet het project via **Bewerken** van **Order** naar **Werkvoorbereiding**.",
                    "Er opent een controlevenster. Het systeem controleert of iedere verdeler beide verplichte documenten heeft.",
                    "Vul per verdeler de bestede **teken uren** in en bevestig.",
                ]),
                ("p", "Bij succes zie je **Project status bijgewerkt naar Werkvoorbereiding en teken uren geregistreerd!**. De teken uren komen automatisch op je weekstaat."),
                ("warn", "Ontbreekt bij een verdeler het Verdeler aanzicht of het Installatie schema, dan kun je niet verder. Je ziet dan: Upload eerst alle verplichte documenten (Verdeler aanzicht en Installatie schema) voor elke verdeler!"),
                ("shot", "Het controlevenster bij de overgang van Order naar Werkvoorbereiding"),
                ("p", "Wijs in deze fase per verdeler een **Toegewezen monteur** toe (via **Verdelers** > verdeler > **Bewerken**). De planners plannen het werk in via de **Productieplanning** (hoofdstuk 7)."),
            ],
        },
        {
            "title": "Fase 4 – Productie",
            "blocks": [
                ("p", "**Wie:** monteur. De verdeler wordt gebouwd."),
                ("steps", [
                    "Zet de verdeler (of het project) op **Productie**.",
                    "De monteur registreert zijn werk via **Werk Registreren** of met de timer (paragraaf 8.3). Uren gaan automatisch naar de weekstaat.",
                    "Het stoplicht bij het project toont hoeveel van de voorcalculatorische uren al zijn gebruikt.",
                    "Als de verdeler klaar is, vult de monteur de **Productie Checklist** in en klikt op **Indienen voor beoordeling**.",
                ]),
                ("p", "Een **KRITISCHE MELDING VOOR MONTEUR** staat in rood bovenaan het project. Lees deze altijd voordat je begint."),
            ],
        },
        {
            "title": "Fase 5 – Testen",
            "blocks": [
                ("p", "**Wie:** tester. Het testen bestaat uit twee stappen: eerst de beoordeling van de productie checklist, daarna de keuring zelf."),
                ("steps", [
                    "De ingediende checklist verschijnt bij de tester op de Startpagina onder **Ingediende verdelers om te testen**.",
                    "De tester klikt op **Beoordelen**, keurt ieder punt goed of af en geeft een **Eindoordeel**.",
                    "Bij **Goedkeuren voor testen** gaat de verdeler naar **Testen**. Bij **Afkeuren (terug naar productie)** gaat hij terug naar **Productie** en past de monteur de checklist aan.",
                    "De tester voert de keuring uit: **Verdeler test** (tot 630 A), **Verdeler vanaf 630 A** of **Verdeler Test Simpel**. Eventueel ook **FAT Test** of **Hoogspanning test**.",
                    "Na het afronden van de keuring wordt het testrapport (PDF) aangemaakt.",
                    "Een ter controle opgeslagen test wordt beoordeeld door een administrator of projectleider onder **Tests Ter Controle**.",
                ]),
                ("p", "Zie hoofdstuk 9 voor de volledige werkwijze van de tester."),
            ],
        },
        {
            "title": "Fase 6 – Levering",
            "blocks": [
                ("p", "**Wie:** tester (statuswijziging) en logistiek (levering)."),
                ("steps", [
                    "De tester zet de verdeler op **Levering**. Dit kan pas als er een voltooide keuring is. Het systeem vraagt dan om de **testuren**.",
                    "Logistiek vult per verdeler de **Levering Checklist** in: fysieke controle, documentatie en minimaal één verzendfoto.",
                    "Logistiek maakt een **Pakbon** en de **Levering Sticker** aan.",
                    "Via **Levering Notificatie** krijgt de klant een e-mail met een link naar het klantportaal en een toegangscode.",
                    "Bij aflevering tekent de ontvanger de pakbon digitaal. De getekende pakbon wordt bij het project opgeslagen.",
                ]),
                ("p", "Zie hoofdstuk 10 voor alle details."),
            ],
        },
        {
            "title": "Fase 7 – Gereed voor facturatie",
            "blocks": [
                ("p", "**Wie:** projectleider zet de status; administratie/finance factureert."),
                ("steps", [
                    "Zet het project via **Bewerken** op **Gereed voor facturatie**.",
                    "Het project verschijnt bij de administratie onder **Gereed voor Facturatie** in de projectenlijst.",
                    "Open het project en klik bij **Factuurrapport** op **Download Factuurrapport**. Je krijgt een PDF met alle gewerkte uren per medewerker, de werkbonnen en de gebruikte materialen.",
                ]),
                ("shot", "Het blok Factuurrapport op de projectpagina"),
            ],
        },
        {
            "title": "Fase 8 – Opgeleverd / Gereed",
            "blocks": [
                ("p", "**Wie:** projectleider."),
                ("steps", [
                    "Zet het project via **Bewerken** op **Opgeleverd**.",
                    "Het systeem zet automatisch ook alle verdelers op **Opgeleverd**. Je ziet: **Project en N verdeler(s) zijn gemarkeerd als opgeleverd!**",
                ]),
                ("p", "Na oplevering kan de klant of een servicemonteur via de QR-code op het label van de verdeler een onderhoudsmelding of werkbon indienen (hoofdstuk 12). Die komen binnen onder **EWP Services**."),
            ],
        },
    ],
}
