PLANNER = {
    "title": "Planner en Productieplanning",
    "intro": "De Productieplanning staat op de Startpagina van de administrator en van de aangewezen planningseditors (projectmanagers en planners). Hier zie je per monteur welke verdelers wanneer gebouwd, getest en geleverd worden.",
    "sections": [
        {
            "title": "De Productieplanning lezen",
            "blocks": [
                ("list", [
                    "Wissel met **Week** en **Maand** tussen de weekweergave en de maandweergave. Met **Alle Monteurs** filter je op één monteur.",
                    "Iedere balk is een verdeler. De kleur geeft de fase aan: Werkvoorbereiding, Productie, Testen of Levering.",
                    "Het systeem plant verdelers automatisch in op basis van de voorcalculatorische uren, de leverdatum en de werkdagen van de monteur (**Automatisch ingepland**).",
                    "Per monteur zie je de **Bezetting**: **Vrije capaciteit**, **Beschikbaar** of **Overschreden**.",
                    "Waarschuwingen: **Past niet in planning**, **Deadline verlopen** of **Geen deadline**.",
                    "Verlof, ziekte en buitenklussen worden in de planning getoond.",
                ]),
                ("shot", "De Productieplanning in weekweergave"),
            ],
        },
        {
            "title": "Een planning aanpassen",
            "blocks": [
                ("steps", [
                    "Klik op een balk. Het venster **Verdeler details** opent met de monteur, deadline, leverweek en de gewerkte en verwachte uren.",
                    "Pas de **Monteur**, **Startdatum** of **Einddatum** aan.",
                    "Klik op **Opslaan**. Je ziet **Planning opgeslagen**.",
                    "Wil je de handmatige wijziging ongedaan maken, klik dan op **Terug naar automatische planning**.",
                ]),
                ("shot", "Het venster Verdeler details met het planningsformulier"),
            ],
        },
        {
            "title": "Een buitenklus inplannen",
            "blocks": [
                ("p", "Een buitenklus is werk op locatie bij de klant, buiten de werkplaats."),
                ("steps", [
                    "Klik in de planning op **Buitenklus**.",
                    "Vul **Projectnummer**, **Klant**, **Werklocatie / adres**, **Contactpersoon op locatie** en **Telefoonnummer contactpersoon** in.",
                    "Kies de **Projectmanager**.",
                    "Vul **Begindatum**, **Einddatum** en **Aanvangstijd** in.",
                    "Kies bij **Monteurs** minimaal één medewerker (monteurs, testers of logistiek).",
                    "Kies het **Vervoer**: Bedrijfsbus, Eigen vervoer, Openbaar vervoer of Samen met collega.",
                    "Vul de **Omschrijving werkzaamheden**, de **Benodigde materialen / gereedschap** en eventuele **Opmerkingen** in.",
                    "Klik op **Inplannen**.",
                ]),
                ("p", "Klik op een bestaande buitenklus om hem te wijzigen of te verwijderen."),
                ("shot", "Het venster Buitenklus inplannen"),
            ],
        },
        {
            "title": "Werkdagen en verlof registreren",
            "blocks": [
                ("p", "Met **Werkdagen** stel je per medewerker in op welke dagen hij werkt. De automatische planning houdt hier rekening mee. Klik op **Opslaan** als je klaar bent."),
                ("p", "Met **Verlof registratie** registreer je ziekte of afwezigheid van een medewerker:"),
                ("steps", [
                    "Klik op **Verlof registratie** en kies een medewerker.",
                    "Kies **Ziekmelding** of **Overige afwezigheid**.",
                    "Kies **Begindatum** en **Einddatum**, of vink **Tot betermelding** aan.",
                    "Klik op **Opslaan**. De planning schuift automatisch mee.",
                ]),
                ("shot", "Het venster Verlof registratie"),
            ],
        },
        {
            "title": "Monteur Toewijzing Agenda en Leveragenda",
            "blocks": [
                ("p", "Aangewezen medewerkers zien op hun Startpagina extra agenda's."),
                ("list", [
                    "**Monteur Toewijzing Agenda**: per verdeler welke monteur is toegewezen, inclusief **Niet toegewezen**. Er is een kalender- en een tabelweergave, met filters op projectleider en status. Met **Exporteer naar Excel** download je het overzicht.",
                    "**Verdeler Leveragenda**: alle verdelers in Productie, Testen of Levering op hun gewenste leverdatum, als kalender of lijst. Klik op een verdeler om het project te openen.",
                ]),
                ("shot", "De Monteur Toewijzing Agenda"),
            ],
        },
    ],
}

MONTAGE = {
    "title": "Monteur (Montage)",
    "intro": "Als monteur zie je alleen de verdelers die aan jou zijn toegewezen. Je registreert je werk per verdeler en dient de verdeler in voor de test als hij klaar is.",
    "sections": [
        {
            "title": "Jouw verdelers vinden",
            "blocks": [
                ("steps", [
                    "Klik in het menu op **Verdelers**. Je ziet alleen de verdelers waarbij jij de **Toegewezen monteur** bent.",
                    "Zoek eventueel op verdeler ID, kastnaam of projectnummer.",
                    "Klik op een verdeler om hem te openen, of open het project via **Projecten**.",
                ]),
                ("shot", "Het overzicht Verdelers voor een monteur"),
            ],
        },
        {
            "title": "Kritische melding en tekeningen",
            "blocks": [
                ("p", "Lees voordat je begint altijd de rode **KRITISCHE MELDING VOOR MONTEUR** bovenaan het project, als die er is."),
                ("p", "Het **Verdeler aanzicht** en **Installatie schema** vind je onder **Documenten** > **Verdelers** > jouw verdeler. Hier vind je ook onderdelenlijsten en handleidingen."),
            ],
        },
        {
            "title": "Werk registreren",
            "blocks": [
                ("p", "Je registreert je uren en materiaal op het tabblad **Productie** van het project. Er zijn twee manieren."),
                ("h3", "Manier 1 – Werk Registreren"),
                ("steps", [
                    "Klik bij de verdeler op **Werk Registreren**.",
                    "Vul bij **Tijd Registratie** de **Start tijd** en **Eind tijd** in.",
                    "Kies de **Status**: **Bezig**, **Voltooid** of **Gepauzeerd**.",
                    "Vul **Opmerkingen** in en voeg eventueel foto's toe (maximaal 15 MB).",
                    "Voeg bij **Gebruikte Materialen** via **Materiaal toevoegen** het materiaal toe: **Beschrijving**, **Aantal** en **Eenheid**.",
                    "Sla de registratie op. De uren komen automatisch op je weekstaat.",
                ]),
                ("shot", "Het formulier Werk Registreren"),
                ("h3", "Manier 2 – De timer"),
                ("p", "Start de timer bij de verdeler. Rechtsonder verschijnt de zwevende timer (zie hoofdstuk 4). Klik op **Stop Timer** als je klaar bent."),
                ("h3", "Het uren-stoplicht"),
                ("table", ["Kleur", "Label", "Betekenis"], [
                    ["Groen", "Goed", "Maximaal 40% van de voorcalculatorische uren gebruikt"],
                    ["Oranje", "Let op", "Tussen 40% en 70% gebruikt"],
                    ["Rood", "Kritiek", "Meer dan 70% gebruikt"],
                ]),
                ("p", "Het percentage naast het stoplicht is het deel van de uren dat nog over is."),
            ],
        },
        {
            "title": "Verdeler indienen voor de test",
            "blocks": [
                ("p", "Als de verdeler klaar is, vul je de **Productie Checklist** in. Een tester beoordeelt deze checklist voordat de verdeler getest wordt."),
                ("steps", [
                    "Zet de verdeler op **Testen** (via **Bewerken** bij de verdeler). Heeft het project maar één verdeler, zet dan het project op **Testen**.",
                    "De **Productie Checklist** (**Productie Gereedheidscontrole**) opent. Vul alle velden in en vink alle punten aan.",
                    "Klik op **Indienen voor beoordeling**. Je ziet **Checklist ingediend voor beoordeling door tester!**",
                    "Wacht op de tester. Je ziet **Wacht op goedkeuring van tester voordat je verder kunt gaan**. Je kunt het project sluiten.",
                ]),
                ("shot", "De Productie Checklist van een verdeler"),
                ("p", "Wordt de checklist afgekeurd, dan gaat de verdeler terug naar **Productie**. Bekijk de afgekeurde punten, herstel ze en dien de checklist opnieuw in."),
            ],
        },
        {
            "title": "Labels printen",
            "blocks": [
                ("p", "Open de verdeler in het project en klik onder **Extra** op **Print Label** voor het typeplaatje (152 x 102 mm) met QR-code, of op **Print voor M-Print** om het label als afbeelding voor de labelprinter te downloaden. Bij M-Print vul je eerst het serienummer in."),
                ("shot", "Een voorbeeld van het verdelerlabel met QR-code"),
            ],
        },
    ],
}

TESTER = {
    "title": "Tester",
    "intro": "Als tester beoordeel je de productie checklists van de monteurs en voer je de keuringen uit. Je ziet in het overzicht Verdelers de verdelers die op Testen staan.",
    "sections": [
        {
            "title": "Het testerswerkbord",
            "blocks": [
                ("p", "Op je Startpagina staan twee blokken:"),
                ("list", [
                    "**Ingediende verdelers om te testen**: productie checklists van monteurs die op beoordeling wachten.",
                    "**Mijn verdelers om te testen**: verdelers die jij hebt goedgekeurd en die klaar zijn voor de keuring. Klik op **Testen** om naar de verdeler te gaan.",
                ]),
                ("shot", "Het testerswerkbord op de Startpagina"),
            ],
        },
        {
            "title": "Een productie checklist beoordelen",
            "blocks": [
                ("steps", [
                    "Klik bij de ingediende verdeler op **Beoordelen**.",
                    "Beoordeel ieder punt met **Goedkeuren** of **Afkeuren**.",
                    "Kies het **Eindoordeel**: **Goedkeuren voor testen** of **Afkeuren (terug naar productie)**.",
                    "Bevestig. Bij goedkeuring gaat de verdeler naar **Testen** en staat hij onder **Mijn verdelers om te testen**.",
                ]),
                ("warn", "Je kunt niet goedkeuren als er afgekeurde punten zijn, of als nog niet alle punten beoordeeld zijn."),
                ("shot", "Het beoordelingsvenster van de productie checklist"),
            ],
        },
        {
            "title": "Een keuring uitvoeren",
            "blocks": [
                ("p", "Open het project, ga naar **Verdelers**, klik op de verdeler en kies onder **Testing** de juiste test. De testknoppen zijn alleen zichtbaar als de verdeler op **Testen** staat."),
                ("table", ["Test", "Wanneer"], [
                    ["Verdeler test", "Standaardkeuring voor verdelers tot 630 A: Werkplaats Test plus Keuringsrapport"],
                    ["Verdeler vanaf 630 A", "Keuringsrapport voor verdelers vanaf 630 A, met handtekeningen"],
                    ["Verdeler Test Simpel", "Verkorte keuring met handtekeningen"],
                    ["FAT Test", "Factory Acceptance Test met meetwaarden"],
                    ["Hoogspanning test", "Hoogspanningstest met testparameters en veiligheidschecklist"],
                    ["Test op locatie", "Test bij de klant na levering"],
                ]),
                ("p", "Alleen de eerste drie tellen als keuring. Zonder voltooide keuring kan de verdeler niet naar Levering."),
                ("shot", "Het blok Testing bij een verdeler met de testknoppen"),
                ("h3", "Verdeler test (tot 630 A)"),
                ("steps", [
                    "Vul bij **Werkplaats Test** de **Datum** en **Getest door** in.",
                    "Loop de checklist door en kies per punt **akkoord**, **n.v.t.**, **fout** of **hersteld**. Voeg zo nodig een opmerking toe.",
                    "Moet je stoppen? Klik op **Opslaan en later verdergaan**. Bij het heropenen ga je verder waar je was.",
                    "Klik op **Voltooien en doorgaan naar Keuringsrapport**.",
                    "Vul **Geïnspecteerd door**, **Goedgekeurd door**, het **Eindresultaat** (**Goedgekeurd**, **Voorwaardelijk goedgekeurd** of **Afgekeurd**) en **Opmerkingen** in.",
                    "Klik op **Voltooien en afronden**.",
                ]),
                ("h3", "Verdeler Test Simpel en Verdeler vanaf 630 A"),
                ("steps", [
                    "Vul de kopgegevens en de **Technische Specificaties** in.",
                    "Loop de hoofdstukken van de checklist door. Met **Alles akkoord** vink je een heel hoofdstuk in één keer af.",
                    "Laat bij **Handtekeningen** de **Monteur**, de **Eindcontroleur** en **Beproevingen** tekenen.",
                    "Rond af. Het rapport (PDF) wordt automatisch opgeslagen bij de verdeler.",
                ]),
                ("p", "Met **Test opnieuw uitvoeren** begin je een voltooide test opnieuw. Testrapporten bekijk je bij de verdeler op het tabblad **Testrapporten**; met **Afdrukken** kun je ze printen of als PDF bewaren."),
            ],
        },
        {
            "title": "Verdeler naar Levering zetten",
            "blocks": [
                ("steps", [
                    "Open de verdeler en klik op **Bewerken**.",
                    "Zet de **Status** op **Levering** en sla op.",
                    "Vul in het venster de bestede **testuren** in. Deze komen automatisch op je weekstaat.",
                ]),
                ("warn", "Zonder voltooide keuring zie je: Je moet eerst een keuring voltooien voordat je de status naar Levering kunt wijzigen! Voor Leerdam is daarnaast een goedgekeurde pre-testing nodig."),
            ],
        },
    ],
}

LOGISTIEK = {
    "title": "Logistiek",
    "intro": "Logistiek ziet de projecten en verdelers met de status Levering. Je controleert de verdelers voor verzending, maakt de pakbon en stickers en zorgt dat de klant tekent voor ontvangst.",
    "sections": [
        {
            "title": "Verdelers klaarzetten voor levering",
            "blocks": [
                ("p", "De projectleider of tester zet verdelers klaar via **Verdelers Klaarzetten voor Levering**: selecteer de verdelers en klik op **Bevestigen**. Ze krijgen dan de status **Levering** en verschijnen bij logistiek."),
            ],
        },
        {
            "title": "De Levering Checklist",
            "blocks": [
                ("steps", [
                    "Open de verdeler en ga naar het tabblad **Levering Checklist**, of open op de projectpagina **Levering per Verdeler**.",
                    "Vink bij **Fysieke Verpakking** alle punten af: gereinigd, gecontroleerd op krassen, deuren en sloten werken, accessoires toegevoegd, stevig verpakt, beschermhoeken en labels aangebracht.",
                    "Vink bij **Documentatie** alle punten af: technisch dossier, handleiding en certificaten, leverbon, projectgegevens op de verpakking, kopie digitaal opgeslagen.",
                    "Upload bij **Verzend Foto's** minimaal één foto van de verpakte verdeler.",
                    "Klik op **Checklist Opslaan**. Bij een complete checklist zie je **Checklist Compleet!**",
                ]),
                ("p", "Tussentijds opslaan kan; je gegevens blijven bewaard. Het blok **Voortgang** laat per verdeler zien hoe ver je bent."),
                ("shot", "De Levering Checklist met fotovak"),
            ],
        },
        {
            "title": "Pakbon maken en laten tekenen",
            "blocks": [
                ("steps", [
                    "Klik op de projectpagina op **Pakbon**, of bij **Pakbon Beheer** op **Genereer Pakbon**.",
                    "Kies een of meer verdelers. Maak per verdeler een pakbon of een **Gecombineerde pakbon** voor alle geselecteerde verdelers.",
                    "Vul bij **Ontvangstgegevens** de **Naam ontvanger** in en laat de ontvanger tekenen in het vak **Handtekening**.",
                    "Bevestig. De getekende pakbon wordt bij het project opgeslagen. Met **Print Pakbon** print je hem.",
                ]),
                ("shot", "Het venster Pakbon Genereren met handtekeningvak"),
            ],
        },
        {
            "title": "Leveringsstickers",
            "blocks": [
                ("steps", [
                    "Klik op de projectpagina op **Levering Sticker**.",
                    "Klik bij een verdeler op **Download** voor één sticker, of klik op **Selecteer alles** en dan op **Download N Stickers (PDF)**.",
                    "Print de stickers en plak ze op de verpakking.",
                ]),
                ("p", "De sticker bevat de klantnaam, het projectnummer, de kastnaam, beide referenties en het afleveradres."),
                ("shot", "Een voorbeeld van de leveringssticker"),
            ],
        },
        {
            "title": "De klant informeren",
            "blocks": [
                ("p", "Via **Levering Notificatie** krijgt de klant een e-mail met een link naar het klantportaal. De werkwijze staat in hoofdstuk 6 bij 'Klant Portals en leveringsnotificatie'."),
            ],
        },
    ],
}

OVERIGE_ROLLEN = {
    "title": "Magazijn, Servicedesk en Finance",
    "sections": [
        {
            "title": "Magazijn",
            "blocks": [
                ("p", "Het magazijn kan projecten, verdelers, klanten en documenten bekijken. Gebruik de onderdelenlijsten in de map **Onderdelen** van iedere verdeler om materiaal klaar te zetten. Daarnaast vul je je weekstaat en verlof in zoals beschreven in hoofdstuk 4."),
            ],
        },
        {
            "title": "Servicedesk",
            "blocks": [
                ("p", "De servicedesk handelt onderhoudsmeldingen en werkbonnen af via **EWP Services** (zie hoofdstuk 4)."),
                ("steps", [
                    "Open de nieuwe melding met **Details bekijken**.",
                    "Zet de status op **In uitvoering** en plan een monteur in.",
                    "Houd de klant op de hoogte via **Reacties**.",
                    "Zet de melding op **Voltooid** als het werk klaar is. Download de werkbon met **Download werkbon PDF**.",
                ]),
                ("p", "Voor nieuwe servicewerk wordt een project aangemaakt met de locatie **Service (9P)**."),
            ],
        },
        {
            "title": "Finance",
            "blocks": [
                ("steps", [
                    "Open **Projecten**. Projecten die klaar zijn voor facturatie staan onder **Gereed voor Facturatie**.",
                    "Open het project en klik bij **Factuurrapport** op **Download Factuurrapport**.",
                    "Het rapport bevat de projectinformatie, een samenvatting, de uren per medewerker, de werkbonnen en een materiaaloverzicht.",
                ]),
                ("p", "De weekstaten exporteer je voor de salarisadministratie via **Personeelsbeheer** > **Syntess Export** (als je toegang hebt tot Personeelsbeheer)."),
            ],
        },
    ],
}

KLANT = {
    "title": "Voor de klant: portalen",
    "intro": "Dit hoofdstuk kun je los aan klanten geven. Het beschrijft de twee portalen die klanten zonder account gebruiken.",
    "sections": [
        {
            "title": "Het Klant Portal",
            "blocks": [
                ("steps", [
                    "Open de link uit de leveringsmail.",
                    "Vul bij **Klant Portal** de toegangscode uit de mail in en klik op **Toegang tot portal**.",
                    "Bekijk de **Project Informatie**, **Contactgegevens** en **Verdeler Specificaties**.",
                    "Kies in de **Document Explorer** een verdeler en een map, selecteer de documenten en klik op **Download**.",
                ]),
                ("p", "Het portaal is tijdelijk geldig. Is de code verlopen, neem dan contact op met EWP Paneelbouw."),
                ("shot", "Het Klant Portal zoals de klant het ziet"),
            ],
        },
        {
            "title": "Het Verdeler Portaal (QR-code)",
            "blocks": [
                ("p", "Op iedere verdeler zit een label met een QR-code (**Scan voor onderhoud**). Hiermee kan de klant of een servicemonteur gegevens bekijken en een melding indienen."),
                ("steps", [
                    "Scan de QR-code met een telefoon.",
                    "Vul de toegangscode van 5 cijfers in die je van EWP hebt gekregen.",
                    "Bekijk de projectinformatie, contactgegevens, verdelerspecificaties en downloadbare documenten.",
                    "Kies bij **Type rapport**: **Melding** (onderhoud of inspectie), **Werkbon** of **Beide**.",
                    "Vul de naam van de monteur en een omschrijving in. Voeg eventueel foto's toe.",
                    "Bij een werkbon: vul de start- en eindtijd in en laat de klant tekenen.",
                    "Verstuur de melding. Je ziet **Melding succesvol verstuurd!**",
                ]),
                ("shot", "Het Verdeler Portaal met het meldingsformulier"),
            ],
        },
    ],
}
