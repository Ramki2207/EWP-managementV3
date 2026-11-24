ALGEMEEN = {
    "title": "Functies voor iedere medewerker",
    "sections": [
        {
            "title": "Weekstaat invullen",
            "blocks": [
                ("p", "Iedere medewerker vult per week zijn uren in via **Urenstaat & Verlof** > tabblad **Weekstaat**."),
                ("steps", [
                    "Klik in het menu op **Urenstaat & Verlof**.",
                    "Klik onder **Mijn Weekstaten** op de gewenste week, of klik op **Nieuwe Weekstaat** voor de huidige week.",
                    "Klik op **Regel toevoegen**.",
                    "Kies bij **Activiteit** de juiste code (zie bijlage B), vul het **Project nr.** en een **Omschrijving** in.",
                    "Vul per dag (**Ma** t/m **Zo**) de uren en minuten (00/15/30/45) in. Onderaan zie je het **Totaal:**.",
                    "Klik tussendoor op **Opslaan**. Als de week compleet is, klik je op **Indienen**.",
                ]),
                ("shot", "Een weekstaat in bewerkmodus met meerdere regels"),
                ("p", "Uren die je registreert via **Werk Registreren**, de timer, teken uren of testuren worden automatisch aan je weekstaat toegevoegd. Controleer deze regels voordat je indient."),
                ("table", ["Status", "Betekenis"], [
                    ["Concept", "Nog niet ingediend; je kunt nog wijzigen"],
                    ["Ingediend", "Wacht op goedkeuring; niet meer te wijzigen"],
                    ["Goedgekeurd", "Goedgekeurd door de leidinggevende"],
                    ["Afgekeurd", "Afgekeurd met reden; pas aan en klik op Opnieuw indienen"],
                ]),
                ("p", "Bij een afgekeurde week zie je een rood kader **Afgekeurd - Aanpassingen vereist** met de **Reden:**. Pas de week aan en klik op **Opnieuw indienen**. Met **Afdrukken** print je de weekstaat."),
            ],
        },
        {
            "title": "Verlof aanvragen",
            "blocks": [
                ("steps", [
                    "Ga naar **Urenstaat & Verlof** > tabblad **Verlof**.",
                    "Klik op **Nieuwe Aanvraag**.",
                    "Kies het **Type Verlof**: Ziek, Tandarts/Huisarts/Fysio, Specialist/Ziekenhuis, Bijzonder verlof, Feestdag, ADV of Tijd voor tijd.",
                    "Voor een deel van een dag vink je **Gedeeltelijke dag** aan en vul je **Datum**, **Van (tijd)** en **Tot (tijd)** in. Anders vul je **Startdatum** en **Einddatum** in.",
                    "Vul eventueel een **Toelichting** in en klik op **Indienen**.",
                ]),
                ("p", "De aanvraag staat op **In afwachting** tot hij is beoordeeld. Een aanvraag die nog in afwachting is, kun je verwijderen. Bij een afwijzing zie je de **Reden afwijzing**."),
                ("shot", "Het formulier Nieuwe Verlofaanvraag"),
            ],
        },
        {
            "title": "Vakantiedagen aanvragen",
            "blocks": [
                ("steps", [
                    "Ga naar **Urenstaat & Verlof** > tabblad **Vakantiedagen**.",
                    "Bekijk je saldo: **Totaal**, **Beschikbaar**, **In afwachting** en **Gebruikt**.",
                    "Klik op **Nieuwe Aanvraag**, vul **Startdatum**, **Einddatum** en eventueel een toelichting in en klik op **Indienen**.",
                ]),
                ("warn", "Het aantal dagen wordt berekend over alle kalenderdagen, inclusief weekenden. Controleer het veld Aantal dagen voordat je indient."),
                ("shot", "Het tabblad Vakantiedagen met het saldo"),
            ],
        },
        {
            "title": "De zwevende timer",
            "blocks": [
                ("p", "Start je een timer bij een verdeler, dan verschijnt rechtsonder op elk scherm een timervenster met de lopende tijd, het project en de verdeler."),
                ("steps", [
                    "Werk gewoon door in het systeem; de timer blijft lopen.",
                    "Klik op **Ga naar project** om terug te gaan naar het project.",
                    "Klik op **Stop Timer** als je klaar bent. De tijd wordt op vandaag in je weekstaat gezet.",
                ]),
                ("shot", "Het zwevende timervenster rechtsonder"),
            ],
        },
        {
            "title": "Werken met documenten",
            "blocks": [
                ("p", "Documenten staan in mappen per project en per verdeler. Je vindt ze op de projectpagina onder **Documenten**, bij een verdeler onder **Documenten**, of centraal via **Uploads** in het menu."),
                ("steps", [
                    "Kies **Project documenten** of **Verdelers** en selecteer de verdeler.",
                    "Klik op een map, bijvoorbeeld **Installatie schema**.",
                    "Sleep bestanden naar **Sleep bestanden hierheen** of klik erop om bestanden te kiezen (maximaal 50 MB per bestand).",
                    "Klik op een document om het te bekijken. Gebruik **Download** of **Verwijderen** in het voorbeeldvenster.",
                ]),
                ("list", [
                    "Toegestaan: afbeeldingen, PDF, Word, Excel, Outlook-mails (.msg/.eml) en tekstbestanden. Foto's van een iPhone (HEIC) worden automatisch omgezet.",
                    "Outlook-mails (.msg) kun je direct in het systeem lezen, inclusief bijlagen.",
                    "Met **Bekijk notities** bij een map voeg je notities toe voor collega's.",
                    "Bestanden met 'rev.1', 'rev.2' in de naam worden automatisch gesorteerd: de nieuwste staat onder **Actueel**, oudere onder **Historie**.",
                ]),
                ("shot", "De documentenverkenner met mappen en het uploadvak"),
                ("p", "Zie bijlage C voor een overzicht van alle mappen."),
            ],
        },
        {
            "title": "EWP Services (service- en onderhoudsmeldingen)",
            "blocks": [
                ("p", "Onder **EWP Services** komen alle onderhoudsmeldingen en werkbonnen binnen die via de QR-code op een verdeler zijn ingediend."),
                ("steps", [
                    "Klik in het menu op **EWP Services**.",
                    "Gebruik **Filters** om te filteren op status, prioriteit (**Hoog**, **Gemiddeld**, **Laag**) of type (**Onderhoud**, **Reparatie**, **Inspectie**, **Werkbon**).",
                    "Klik bij een melding op **Details bekijken**.",
                    "Wijzig onder **Status Beheer** de status: **In behandeling**, **In uitvoering**, **Voltooid** of **Afgewezen**.",
                    "Voeg onder **Reacties** een reactie toe. Met **Download werkbon PDF** download je de werkbon.",
                ]),
                ("shot", "Het overzicht EWP Services met filters"),
            ],
        },
    ],
}

ADMIN = {
    "title": "Administrator",
    "sections": [
        {
            "title": "De Startpagina voor de administrator",
            "blocks": [
                ("p", "De administrator ziet op de Startpagina het beheerdashboard met:"),
                ("list", [
                    "**Snelle Acties** met onder meer **Nieuw Project**.",
                    "**Productieplanning**: de planning van alle monteurs (zie hoofdstuk 7).",
                    "**Aandacht vereist**: verdelers die achter schema lopen, verlopen leverdata, of verdelers zonder monteur of die wachten op een test.",
                    "**Mijn Taken**: je eigen projecten, gefilterd op status.",
                    "**Projecten Werkvoorbereiding**: welke verdeler nog een Verdeler aanzicht of Installatie schema mist.",
                    "**Testen - openstaande punten**: tests die gecontroleerd moeten worden (**Bekijken**, **Goedkeuren**, **Afkeuren**).",
                    "**Pre-Testing Goedkeuringen** en **Tests Ter Controle**.",
                ]),
                ("shot", "Het beheerdashboard op de Startpagina"),
                ("tip", "Een administrator kan het systeem bekijken zoals een projectleider het ziet. Zo controleer je wat een collega te zien krijgt."),
            ],
        },
        {
            "title": "Gebruikers beheren",
            "blocks": [
                ("steps", [
                    "Klik in het menu op **Gebruikers** en daarna op **Gebruiker toevoegen**.",
                    "Vul bij **Basis Informatie** de **Gebruikersnaam**, het **E-mail**adres, het **Wachtwoord** en **Bevestig wachtwoord** in.",
                    "Kies bij **Rol & Toegangsrechten** de **Gebruikersrol**. De standaardrechten van die rol worden automatisch ingesteld.",
                    "Wil je afwijkende rechten? Vink **Aangepaste permissies** aan en zet per onderdeel de rechten aan of uit.",
                    "Kies bij **Locatie Toegang** de locaties, of vink **Alle locaties** aan. Gebruikers zien alleen projecten van hun locaties.",
                    "Klik op **Gebruiker aanmaken**.",
                ]),
                ("shot", "Het venster Nieuwe gebruiker aanmaken"),
                ("h3", "Wijzigen, blokkeren en verwijderen"),
                ("list", [
                    "**Bewerken** (potlood): wijzig gegevens, rol of locaties. Laat **Nieuw wachtwoord** leeg als het wachtwoord niet hoeft te veranderen.",
                    "**Gebruiker blokkeren**: de gebruiker kan niet meer inloggen, maar zijn gegevens blijven bewaard. Met **Gebruiker deblokkeren** heft je dit op.",
                    "**Verwijderen**: verwijdert de gebruiker definitief. Gebruik bij vertrek liever blokkeren.",
                ]),
                ("p", "Met **Filters** zoek je op naam, e-mail of rol."),
            ],
        },
        {
            "title": "Personeelsbeheer",
            "blocks": [
                ("p", "**Personeelsbeheer** geeft een overzicht van de uren, het verlof en de vakantiedagen van alle medewerkers. De pagina heeft vijf tabbladen."),
                ("table", ["Tabblad", "Gebruik"], [
                    ["Agenda", "Maandagenda met projecten en leverdata. Sleep een project naar een andere dag om de leverdatum te verplaatsen."],
                    ["Weekstaten", "Alle weekstaten. Filter op Medewerker, Status, Week en Jaar. Open een weekstaat en klik op Goedkeuren of Afkeuren (met reden)."],
                    ["Verlof", "Openstaande verlofaanvragen goedkeuren of afkeuren, plus de historie."],
                    ["Vakantiedagen", "Openstaande vakantieaanvragen goedkeuren of afkeuren, plus de historie."],
                    ["Syntess Export", "Weekstaten exporteren naar Excel: Exporteer Geselecteerde, Exporteer Alles, of per regel Exporteer."],
                ]),
                ("shot", "Personeelsbeheer, tabblad Weekstaten"),
                ("h3", "Weekstaat afkeuren"),
                ("steps", [
                    "Open de weekstaat en klik op **Afkeuren**.",
                    "Vul bij **Reden voor afkeuring** een duidelijke reden in, bijvoorbeeld 'WB nummers ontbreken'.",
                    "Bevestig. De medewerker ziet de reden bij zijn weekstaat.",
                ]),
            ],
        },
        {
            "title": "Meldingen: verlof en vakantie beoordelen",
            "blocks": [
                ("p", "Het menu-item **Meldingen** toont met een rood getal hoeveel verlof- en vakantieaanvragen er openstaan van medewerkers op jouw locaties."),
                ("steps", [
                    "Klik in het menu op **Meldingen**. Filter eventueel op **Verlof** of **Vakantie**.",
                    "Onder **Te Beoordelen** staat iedere aanvraag met naam, type, periode en toelichting.",
                    "Klik op **Goedkeuren**, of op **Afkeuren** en vul bij **Reden voor Afwijzing** een reden in.",
                ]),
                ("p", "Onder **Alle Aanvragen** zie je de historie."),
                ("shot", "De pagina Meldingen met openstaande aanvragen"),
            ],
        },
        {
            "title": "Overige beheertaken",
            "blocks": [
                ("list", [
                    "**Project ontgrendelen**: blijft een project vergrendeld door een collega die niet meer actief is (**Inactieve vergrendeling**), dan kan de administrator op **Forceer ontgrendelen** klikken.",
                    "**Toegangscodes** en **Klant Portals**: zie paragraaf 6.9 en 6.10.",
                    "**Inzichten**: zie paragraaf 6.12.",
                    "**PDF Optimizer** (onderaan het menu): maakt bestaande testcertificaten kleiner door ze opnieuw te genereren. Klik op **Start regenereren**. Dit kan enkele minuten duren en overschrijft de originele PDF's.",
                    "**Systeemtools** in **Mijn account**: documenten migreren naar de opslag en HEIC-foto's omzetten. Gebruik deze alleen in overleg met de systeembeheerder.",
                ]),
            ],
        },
    ],
}
