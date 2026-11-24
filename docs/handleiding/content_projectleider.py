PROJECTLEIDER = {
    "title": "Projectleider en Standaard Gebruiker",
    "intro": "Dit hoofdstuk beschrijft het projectbeheer: projecten aanmaken, klanten beheren, statussen bijhouden en klanten toegang geven. Het geldt voor projectleiders, standaard gebruikers en administrators.",
    "sections": [
        {
            "title": "Een nieuw project aanmaken",
            "blocks": [
                ("p", "Klik op **Projecten** > **Project toevoegen**, of op de Startpagina op **Nieuw Project**. Het aanmaken gaat in drie stappen: **Project Details**, **Verdelers** en **Uploads**."),
                ("h3", "Stap 1 – Project Details"),
                ("steps", [
                    "Kies bij **Locatie selecteren voor prefix** de vestiging. Bestaande locaties: Leerdam (PU), Leerdam (PM), Naaldwijk (PD), Naaldwijk (PW), Rotterdam (PR). Nieuwe locaties met een 4-cijferig nummer: Den Haag (1P), Rotterdam (2P), Utrecht (3P), Arnhem (4P), Service (9P).",
                    "Vul het **Jaar (2 cijfers)** en het projectnummer (3 of 4 cijfers) in. Een groen voorbeeld laat het volledige nummer zien, bijvoorbeeld 3P261111.",
                    "Controleer de **Datum** en vul de **Verwachte leverdatum** in.",
                    "Zoek bij **Klant** de klant op. Bestaat de klant nog niet, klik dan op **Nieuwe klant aanmaken**.",
                    "Kies de **Contactpersoon**, of maak er een aan met **Nieuwe contactpersoon aanmaken**.",
                    "Kies de **Status** (meestal **Intake** of **Offerte**) en vul de **Omschrijving** in.",
                    "Vul eventueel een **Kritische melding voor monteur** in. Deze verschijnt in rood bij het project.",
                    "Vul de referenties, het afleveradres en de contactpersoon op locatie in.",
                    "Vink eventueel **Intake formulier invullen** aan en vul het intakeformulier in.",
                    "Klik op **Volgende stap**.",
                ]),
                ("shot", "Stap 1 Project Details met het projectnummer en de klantkeuze"),
                ("warn", "Bestaat het projectnummer al, dan zie je: Projectnummer X bestaat al. Kies een ander nummer. Je kunt dan niet verder."),
                ("h3", "Stap 2 – Verdelers"),
                ("steps", [
                    "Klik op **Verdeler toevoegen**.",
                    "Vul bij **Basis Informatie** de **Verdeler ID** (bijvoorbeeld VD1234) en de **Kastnaam** in. Beide zijn verplicht.",
                    "Kies de **Toegewezen monteur** (of **Vrij**), vul de **Voorcalculatorische uren** en eventueel een **Gewenste leverdatum** in.",
                    "Vul de technische gegevens in: **Stelsel**, **Binnenkomende voeding**, **Stuurspanning**, **kA Waarde**, **IP-Waarde**, **Bouwjaar**, **Fabrikant** en **Status**.",
                    "Vul bij **Technische Specificaties** eventueel Un, In, Ik Th, Ik Dyn, frequentie en Type nr. HS in.",
                    "Klik op **Verdeler toevoegen**. Herhaal dit voor iedere verdeler.",
                    "Klik op **Volgende stap**.",
                ]),
                ("shot", "Het venster Nieuwe verdeler toevoegen"),
                ("tip", "De voorcalculatorische uren bepalen het uren-stoplicht. Vul ze altijd in, dan zie je tijdens de productie of een verdeler binnen budget blijft."),
                ("h3", "Stap 3 – Uploads"),
                ("p", "Upload documenten in de **Project Mappen** (zoals Aanvraag, Offerte, Calculatie) of per verdeler (zoals Verdeler aanzicht, Installatie schema). De bestanden worden pas opgeslagen als je het project opslaat."),
                ("shot", "Stap 3 Uploads met de projectmappen"),
                ("h3", "Opslaan"),
                ("p", "Klik op de opslaanknop. Je ziet de voortgang: eerst het project, dan iedere verdeler, dan de documenten. Bij succes verschijnt **Project succesvol aangemaakt met N verdeler(s)!**"),
                ("warn", "Het project wordt alleen opgeslagen als alle verdelers goed zijn opgeslagen. Gaat er iets mis, dan zie je 'Het project is NIET opgeslagen'. Je ingevoerde gegevens blijven dan staan en je kunt het opnieuw proberen."),
                ("p", "Is een verdeler ID al in gebruik bij een ander project, dan krijgt de verdeler automatisch een nieuw nummer. Je ziet dan een melding als: **Let op: VD1234 is nu VD5678**."),
            ],
        },
        {
            "title": "Concepten en tussentijds opslaan",
            "blocks": [
                ("list", [
                    "Tijdens het invullen wordt alles automatisch in je browser bewaard (**Concept opgeslagen**). Je kunt tussendoor naar andere pagina's en later verdergaan. Met **Concept wissen** begin je opnieuw.",
                    "Met **Opslaan als Concept** (rechtsboven) sla je het onvolledige project op in het systeem met status **Concept**. Daarvoor zijn minimaal locatie, klant of projectnummer nodig.",
                    "Op de Startpagina vind je je concepten via **Bekijk concepten**.",
                ]),
            ],
        },
        {
            "title": "De Startpagina en de projectenlijst",
            "blocks": [
                ("p", "Op de Startpagina zie je **Snelle Acties**, het blok **Projecten Overzicht** (met het locatiefilter), **Tests Ter Controle** en **Werkbelasting & Levering Overzicht**. Planningseditors zien daarnaast de **Productieplanning**."),
                ("p", "Via **Projecten** open je de volledige lijst."),
                ("list", [
                    "Klik op **Filters** om te filteren op periode (**Deze week**, **Deze maand**, **Dit kwartaal**, **Alle tijd**), status, klant, maker en toegewezen monteur. Met **Wis alle filters** zet je alles terug. Je filters worden onthouden.",
                    "Zoek bij **Zoeken in projecten** op projectnummer, klant of locatie.",
                    "De kolom **Vergrendeling** laat zien of een collega in het project werkt.",
                    "Per project: **Uploads**, **Openen** en **Verwijderen**.",
                ]),
                ("shot", "De projectenlijst met het filterpaneel geopend"),
            ],
        },
        {
            "title": "De projectpagina",
            "blocks": [
                ("p", "Klik op **Openen** bij een project. De projectpagina heeft vijf tabbladen."),
                ("table", ["Tabblad", "Inhoud"], [
                    ["Details", "Projectgegevens, Verdeler Status Overzicht, en afhankelijk van de status: Pakbon Beheer, Levering Proces en Factuurrapport"],
                    ["Verdelers", "Alle verdelers met hun gegevens, acties, testen en labels"],
                    ["Documenten", "Project- en verdelermappen (zie 'Werken met documenten')"],
                    ["Intake Formulier", "Het ingevulde intakeformulier (alleen lezen)"],
                    ["Productie", "Productie Tracking per verdeler, uren en materiaal"],
                ]),
                ("p", "Rechtsboven staan de knoppen **Levering Sticker**, **Pakbon**, **Delen**, **Documentatie** en **Bewerken**."),
                ("shot", "De projectpagina met tabbladen en knoppen"),
                ("h3", "Projectgegevens wijzigen"),
                ("steps", [
                    "Klik op **Bewerken**.",
                    "Pas de velden aan.",
                    "Klik op **Opslaan**. Je ziet **Project gegevens opgeslagen!** Met **Annuleren** maak je je wijzigingen ongedaan.",
                ]),
                ("h3", "Verdelers beheren"),
                ("p", "Op het tabblad **Verdelers** klik je op een verdeler. Aan de zijkant staan **Acties** (**Bewerken**, **Toegangscode**, **Verwijderen**), **Testing** en **Extra** (**Print Label**, **Print voor M-Print**). Met **Verdeler toevoegen** voeg je later nog een verdeler toe."),
                ("shot", "Het tabblad Verdelers met een geopende verdeler"),
            ],
        },
        {
            "title": "Statussen wijzigen",
            "blocks": [
                ("p", "Je wijzigt de projectstatus via **Bewerken** > **Status** > **Opslaan**. Bij sommige overgangen opent het systeem een extra venster."),
                ("table", ["Overgang", "Wat het systeem vraagt"], [
                    ["Order → Werkvoorbereiding", "Controle van Verdeler aanzicht en Installatie schema per verdeler, plus teken uren per verdeler"],
                    ["Productie → Testen", "Pre-testing goedkeuring door een tester"],
                    ["→ Levering", "Levering checklist"],
                    ["→ Opgeleverd", "Alle verdelers worden automatisch ook Opgeleverd"],
                ]),
                ("p", "De status van een losse verdeler wijzig je bij de verdeler via **Bewerken**. Denk eraan dat de projectstatus automatisch meebeweegt (zie hoofdstuk 3)."),
            ],
        },
        {
            "title": "Kritische melding, delen en vergrendeling",
            "blocks": [
                ("h3", "Kritische melding voor de monteur"),
                ("p", "Klik op de projectpagina op **Kritische melding toevoegen**, typ de melding en klik op **Opslaan**. De melding staat in rood als **KRITISCHE MELDING VOOR MONTEUR**. Sla je een lege melding op, dan wordt hij verwijderd. Alleen bevoegde gebruikers kunnen deze melding aanpassen."),
                ("h3", "Een project delen met een andere locatie"),
                ("steps", [
                    "Klik op **Delen**.",
                    "Klik onder **Deel dit project met andere locaties:** op de gewenste locatie. Een gedeelde locatie krijgt het label **Gedeeld**.",
                    "Klik op **Sluiten**.",
                ]),
                ("warn", "Gebruikers van gedeelde locaties kunnen het project bekijken en ook bewerken."),
                ("h3", "Vergrendeling"),
                ("p", "Er kan maar één persoon tegelijk in een project werken. Open je een project, dan staat bovenaan **Je werkt nu in dit project**. Werkt een collega erin, dan zie je **Project kon niet worden vergrendeld** en ga je terug naar de lijst. In de projectenlijst zie je wie het project open heeft. Sluit een project dus altijd af als je klaar bent."),
                ("shot", "De vergrendelingsmelding van een project"),
            ],
        },
        {
            "title": "Een project verwijderen",
            "blocks": [
                ("steps", [
                    "Klik in de projectenlijst bij het project op **Verwijderen**.",
                    "Lees de waarschuwing en klik op **Ja, verwijder project**.",
                    "Bevestig bij **Laatste bevestiging** nogmaals.",
                ]),
                ("warn", "Verwijderen kan niet ongedaan worden gemaakt. Alle verdelers, documenten en uploads van het project worden ook verwijderd. Zet een project dat niet doorgaat liever op Verloren of Vervallen."),
            ],
        },
        {
            "title": "Klanten beheren",
            "blocks": [
                ("steps", [
                    "Klik in het menu op **Klanten** en daarna op **Klant toevoegen**.",
                    "Vul **Organisatienaam**, **Status**, **Locatie**, telefoon, e-mail, bezoekadres, afleveradres, BTW- en KvK-nummer in.",
                    "Upload eventueel een **Logo** met **Upload Logo**.",
                    "Voeg bij **Contactpersonen** met **Contact toevoegen** de contactpersonen toe.",
                    "Sla de klant op.",
                ]),
                ("p", "Klik op een klant in de lijst om **Klantgegevens** en **Contactpersonen** te bekijken of te wijzigen. Met **Importeer CSV** importeer je meerdere klanten tegelijk."),
                ("shot", "Het klantenoverzicht en het formulier Nieuwe klant toevoegen"),
                ("warn", "De knop Alle klanten verwijderen verwijdert het volledige klantenbestand. Gebruik deze niet."),
            ],
        },
        {
            "title": "Toegangscodes",
            "blocks": [
                ("p", "Met een toegangscode kan een klant of servicemonteur via de QR-code op het label de gegevens en documenten van één verdeler bekijken en een melding indienen."),
                ("steps", [
                    "Klik in het menu op **Toegangscodes** en daarna op **Code aanmaken**.",
                    "Zoek bij **Verdeler** de verdeler op (op verdeler ID, kastnaam, projectnummer of klant).",
                    "Vul een **Toegangscode** van precies 5 cijfers in of klik op **Genereer**.",
                    "Kies de **Vervaldatum** en eventueel het **Maximum aantal keer gebruiken** (leeg = onbeperkt).",
                    "Laat **Direct activeren** aangevinkt en klik op **Code aanmaken**.",
                ]),
                ("p", "Je kunt ook bij een verdeler zelf op **Toegangscode** klikken. In de lijst zie je per code de status, het aantal keer gebruikt en wanneer hij het laatst is gebruikt. Met **Heractiveren** verleng je een verlopen code met 30 dagen."),
                ("shot", "Het venster Nieuwe toegangscode aanmaken"),
            ],
        },
        {
            "title": "Klant Portals en leveringsnotificatie",
            "blocks": [
                ("p", "Via een klantportaal kan de klant de projectgegevens, verdelerspecificaties en gedeelde documenten bekijken en downloaden. Een portaal maak je aan vanuit het project tijdens de levering."),
                ("steps", [
                    "Open het project (status Levering) en ga naar **Levering Proces** > **Levering Notificatie**.",
                    "Klik op **Genereer Notificatie**. Het portaal wordt aangemaakt met een toegangscode.",
                    "Kies bij **Selecteer verdelers voor levering** de verdelers en klik op **Bevestig Selectie**.",
                    "Kies bij **Selecteer te delen mappen** de mappen die de klant mag zien en klik op **Bevestig Selectie**.",
                    "Controleer de **Levering Notificatie Preview** en klik op **Verstuur Email**. De klant ontvangt de link en de code.",
                ]),
                ("p", "Je kunt de tekst ook kopiëren met **Kopieer Email** of **Kopieer portal informatie**."),
                ("shot", "De Levering Notificatie Preview met portalgegevens"),
                ("h3", "Bestaande portals beheren"),
                ("p", "Via **Klant Portals** in het menu zie je alle portals. Per portal kun je de informatie kopiëren, het portaal openen, **Details bekijken**, **Mappen beheren**, **Heractiveren** (30 dagen) of **Deactiveren**."),
            ],
        },
        {
            "title": "Tests Ter Controle",
            "blocks": [
                ("p", "Testers kunnen een test opslaan ter controle. Administrators, projectleiders en aangewezen controleurs zien deze op de Startpagina onder **Tests Ter Controle**."),
                ("steps", [
                    "Klik op **Bekijken** om de test in te zien.",
                    "Klik op **Goedkeuren**. Het testrapport (PDF) wordt dan aangemaakt.",
                    "Of klik op **Afkeuren** en geef eventueel een reden.",
                ]),
                ("shot", "Het blok Tests Ter Controle op de Startpagina"),
            ],
        },
        {
            "title": "Inzichten",
            "blocks": [
                ("p", "Via **Inzichten** zie je de cijfers van het bedrijf. Stel bij **Filters & Periode** de periode in."),
                ("list", [
                    "Kerncijfers: **Totaal Projecten**, **Totaal Verdelers**, **Actieve Projecten**, **Voltooide Projecten**.",
                    "**Project Status Verdeling** en **Maandelijkse Trends**.",
                    "**Medewerker Productiviteit** en **Top Performers**.",
                    "**Uren Analyse per Fase** en **Voorcalculatorische vs Werkelijke Uren**.",
                ]),
                ("shot", "De pagina Inzichten"),
            ],
        },
    ],
}
