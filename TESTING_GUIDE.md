# EWP Management System - Complete Testing Guide

## Testing Workflow Overview

The EWP Management System includes a comprehensive 4-stage testing process for electrical distributors (verdelers). This guide provides detailed instructions for each testing phase.

---

## Testing Process Flow

```
Workshop Checklist → Factory Acceptance Test → High Voltage Test → On-Site Test → Final Inspection
```

Each stage must be completed before proceeding to the next, ensuring quality and safety compliance.

---

## Stage 1: Workshop Checklist (Werkplaats Checklist)

### Purpose
Pre-testing preparation and quality control verification before factory testing.

### Access
1. Navigate to verdeler details
2. Click "Verdeler testen" button
3. Enter test date and tester name

### Checklist Categories (54 Total Items)

#### 1. Goederenstroom (1 item)
**1.01** - Ontvangstprocedure volgens ISO 9003
- **Options**: Akkoord, N.v.t., Fout, Hersteld
- **Purpose**: Verify receiving procedures compliance

#### 2. Railsystemen (5 items)
**2.01** - Railsystemen aanwezig
**2.02** - Nominale waarde railsysteem
- **Options**: 250A (12×5mm), 315A (20×5mm), 400A (30×5mm), 500A (20×10mm), 630A (30×10mm)
**2.03** - Juiste CU-doorsnede toegepast
**2.04** - Extra coderingen (L1, L2, L3, N, PE)
**2.05** - Kunststof afscherming railsysteem

#### 3. Componenten (11 items)
**3.01** - Componenten volgens schema geplaatst
**3.02** - Componenten ingesteld (automaten, relais, klokken, meetinstrumenten)
**3.03** - Voldoende koeling tussen componenten
**3.04** - Rijgklemmen aanwezig
**3.05** - Rijgklemmen vastgedraaid
**3.06** - Juiste kleuren drukknoppen / signaallampen
**3.07** - Juiste spanning signaallampen
**3.08** - Juiste spoelspanning besturingscomponenten
**3.09** - Mechanische controle schakelaars
**3.10** - Componenten in kastdeur gemonteerd
**3.11** - Componenten in kastdeur gecodeerd

#### 4. Interne Bedrading (11 items)
**4.01** - 90°C bedrading toegepast
**4.02** - Doorsnede juist gekozen
**4.03** - Juiste draadkleuren
**4.04** - Bedrading vrij t.o.v. railsysteem
**4.05** - Juiste railklemmen
**4.06** - Vastgedraaid met juiste momenten
**4.07** - Overzichtelijk aangelegd (uitbreiding)
**4.08** - Bedrading gecodeerd (hoofdstroom, hulpstroom, kleuren, cijfers/letters, symbolen)
**4.09** - PEN-sticker aanwezig (bij TNC)
**4.10** - Bedrading gebundeld
**4.11** - Bedrading gecontroleerd

#### 5. Montageframe (6 items)
**5.01** - Controle diepte-instelling componenten
**5.02** - Frame geplaatst in verdeler
**5.03** - Frame bevestigd aan beschermingsleiding (sticker zichtbaar)
**5.04** - Scheidingsschotten opgenomen
**5.05** - Deur(en) bevestigd aan beschermingsleiding (sticker zichtbaar)
**5.06** - Bij kunststof verdelers: frame/deur niet verbinden met aarde

#### 6. Beproeving (7 items)
**6.01** - Routineproef: inspectie verdeler, functionele proef, aardlek-test, schakelingen
**6.02** - Functietest beproevingsapparatuur
**6.03** - Toetsing beschermingsmaatregelen & PE-verbinding
**6.04** - Hoogspanningstest (1000V, 2000V, 2500V afhankelijk van spanning)
**6.05** - Functietest apparatuur
**6.06** - Isolatieweerstand meten (≥300 MΩ)
**6.07** - Kruip- en luchtwegen volgens norm

#### 7. Eindafwerking (11 items)
**7.01** - Tekeninghouder opgenomen
**7.02** - Tekeningen en handleidingen meegeleverd
**7.03** - Wandbevestigingsbeugels aanwezig
**7.04** - Deursleutels meegeleverd
**7.05** - Rijgklemmen gecodeerd
**7.06** - Groepencodering op afdekplaten
**7.07** - Creditcard en keuringssticker in kastdeur
**7.08** - Flensplaten gemonteerd
**7.09** - Warmteberekening uitgevoerd
**7.10** - Algemene reiniging uitgevoerd

#### 8. Eindcontrole (2 items)
**8.01** - Keuringsrapport volledig
**8.02** - Kopie rapport + sticker toegevoegd aan projectgegevens

#### 9. Diversen (1 item)
**9.01** - Vrije opmerkingenvelden (text field)

### Completion Process

1. **Complete All Items**
   - Each item must have a status (except text fields)
   - Add notes for any issues or observations
   - System prevents completion until all required items done

2. **Inspection Report**
   - **Date**: Inspection date
   - **Inspected by**: Quality inspector name
   - **Approved by**: Final approver name
   - **Final Checks**: 4 compliance items
   - **Result**: Goedgekeurd / Voorwaardelijk goedgekeurd / Afgekeurd
   - **Notes**: Final comments and recommendations

3. **PDF Generation**
   - System automatically generates comprehensive PDF
   - Includes all checklist items and results
   - Saves to "Test certificaat" folder
   - Professional formatting with company branding

---

## Stage 2: Factory Acceptance Test (FAT)

### Purpose
Comprehensive 96-point factory testing before delivery.

### Access
1. Click "FAT Test" button on verdeler
2. Enter test date and tester name

### Measurement Recording

**Required Measurements**:
- **Isolatieweerstand (MΩ)**: Insulation resistance
- **Doorgangstest (Ω)**: Continuity test
- **Functionele test (V)**: Functional voltage test
- **Spanningstest (V)**: Voltage test

### Test Categories (96 Total Items)

#### Algemeen (14 items)
1. Afmetingen
2. Lakwerk
3. Scharnieren en deursluitingen
4. Tekening- groepenverklaringhouder
5. Beschermingsgraad IP
6. Naamplaat fabrikant
7. Aantal en plaats kabeldoorvoeringen
8. Aantal en plaats doorvoertulen
9. Kast en draadgoten schoongemaakt
10. Deurkoppelingen schakelaars
11. Bedieningsgreep smeltveiligheden
12. Montageframes wand/vloer
13. Certificaten, CE verklaring installatie onderdelen
14. Verklaring integraal bouwen

#### Railsysteem (5 items)
15. Raildoorsnede
16. Kruip- en luchtwegen
17. Verbindingsbouten kwaliteit 8.8
18. Bouten aangetrokken en gelakt
19. Tapbouten in rail van de juiste lengte

#### Montage (18 items)
20. Voeding direct op hoofdschakelaar
21. Licht- en krachtinstallatie gescheiden
22. Niet beveiligde geleiders separaat aangebracht
23. Reserveruimte volgens tekening aanwezig
24. Reserveruimte in draadgoten
25. Voldoende ruimte voor inkomende kabels
26. Kabelopvangrail aanwezig
27. Afgaande groepen op klemmen uitgevoerd
28. Aansluitklemmen geschikt voor inkomende kabels
29. Scheidingsschotten tussen de aansluitklemmen
30. Apparatuur van juiste fabricaat en type
31. Bevestiging van de apparatuur
32. Draadbundels flexibel en voorzien van trekontlasting
33. Ventilatieroosters t.b.v. koeling
34. Intrinsiekveilige bedrading in aparte goot
35. Draaddoorsnede
36. Draadkleuren
37. Alle apparatuur goed bereikbaar

#### Afscherming (6 items)
38. Niet beveiligde geleiders
39. Vreemde spanningen
40. Aansluitklemmen voedingskabel
41. Hoofdschakelaar
42. Apparatuur binnenzijde deuren
43. Overige spanningvoerende delen >50V ~ of 110V =

#### Aarding (8 items)
44. Deuren
45. Montageplaten
46. Meet- en regelapparatuur
47. Stroomtransformatoren / transformatoren
48. Aardrail goed bereikbaar
49. Aardbout- en aardraildoorsnede
50. Voldoende aansluitbouten op aardrail
51. Schone aarde

#### Coderingen (8 items)
52. Railsysteem
53. Bedrading
54. Aansluitklemmen
55. Apparatuur in kast- resopal
56. Apparatuur in front- resopal
57. Gravering schakelaars
58. Kleur signaallamplensjes
59. Codering kastnaam

#### Waarden/Instellingen apparatuur (10 items)
60. Hoofdautomaat trafo thermisch
61. Hoofdautomaat trafo maximaal
62. Hoofdschakelaars/schakelaars In = 2500 A
63. Maximaalautomaten
64. Thermische relais
65. Installatieautomaten
66. Smeltveiligheden wel / niet leveren
67. Tijdrelais
68. Transformatoren
69. Meetinstrumenten- stoomtransformatoren
70. Spoelspanningen

#### Bedradingscontrole/Functionele test (18 items)
71. Fasevolgorde
72. Bedrading schakelapparatuur
73. Bedrading elektronische apparatuur
74. Bedrading meet- en regelapparatuur
75. Functionele elektrische test voedende (trafo) zijde
76. Functionele elektrische test (preferente) zijde
77. Kastverlichting/ventilatie/verwarming
78. Servicewandkontaktdoos
79. Blindschema's kleuren symbolen
80. Aanwijzing meetinstrumenten
81. Functionele pneumatische test
82. Sleutels van schakelaars onverwisselbaar
83. Schakelaar niet preferent aangesloten op juiste klemmen
84. Schakelaar preferent aangesloten op juiste klemmen
85. Controle werking storingscontacten
86. Controle sturingen in status net
87. Controle sturingen in status nood
88. Controle voeding sprinklerinstallatie in net situatie

#### Diversen (8 items)
89. Wordt de kast in de afgesproken delen aangevoerd
90. Zijn voldoende hijsogen aangebracht
91. Deursleutels aanwezig
92. Reserve onderdelen kompleet
93. Busje reservelak
94. Certificaat van kast of systeem
95. Bedienings- en onderhoudsvoorschrift apparatuur
96. Revisiegegevens verwerkt op tekening

### FAT Completion
- All 96 items must be completed
- Each item: Pass (✓) / N.v.t. / Fail (✗)
- Add notes for any issues
- Record all measurements
- System generates comprehensive PDF report

---

## Stage 3: High Voltage Test (Hoogspanning Test)

### Purpose
Electrical safety and insulation testing at high voltage levels.

### Safety Requirements
⚠️ **CRITICAL**: Only qualified electrical personnel should perform HV testing

### Test Parameters

**Required Information**:
- **Testspanning (V)**: Test voltage based on system voltage
  - 400V systems: 2500V test voltage
  - 230V systems: 2000V test voltage
  - Low voltage: 1000V test voltage
- **Test duur**: Minimum 1 minute
- **Omgevingstemperatuur**: Ambient temperature
- **Luchtvochtigheid**: Humidity percentage

### Safety Checklist (15 Items)

1. **Is het verdeelsysteem volledig spanningsloos gemaakt vóór de test?**
   - Verify complete de-energization
   - Lock out/tag out procedures

2. **Zijn alle externe verbindingen en de aarding gecontroleerd en indien nodig losgekoppeld of goed geaard?**
   - Check all external connections
   - Verify proper grounding

3. **Is de juiste testspanning volgens de geldende norm ingesteld?**
   - Confirm correct test voltage
   - Reference applicable standards

4. **Wordt de testspanning aangelegd tussen de juiste punten?**
   - Test between all active parts and earth
   - Proper test point selection

5. **Is de testspanning gedurende de voorgeschreven tijdsduur aangehouden?**
   - Minimum 1 minute duration
   - Stable voltage application

6. **Is de meetopstelling veilig voor het personeel?**
   - Safety barriers in place
   - Personal protective equipment

7. **Is er tijdens de test geen ongewenste doorslag of te hoge lekstroom gemeten?**
   - No breakdown or excessive leakage
   - Record actual measurements

8. **Zijn alle relevante polen en combinaties van fasen en nul getest?**
   - Test all phase combinations
   - Include neutral testing

9. **Is de test uitgevoerd onder geschikte omgevingstemperatuur en luchtvochtigheid?**
   - Suitable environmental conditions
   - Record actual conditions

10. **Zijn gevoelige componenten vooraf losgenomen of beschermd?**
    - Protect sensitive electronics
    - Document protection measures

11. **Zijn de meetresultaten en de tijdsduur correct geregistreerd?**
    - Accurate measurement recording
    - Proper documentation

12. **Is de verdeler na de test weer correct aangesloten en bedrijfsklaar gemaakt?**
    - Proper reconnection
    - Operational readiness

13. **Zijn er na de test geen zichtbare beschadigingen aan de isolatie of componenten geconstateerd?**
    - Visual inspection post-test
    - Document any damage

14. **Is de gebruikte testapparatuur gekalibreerd en goedgekeurd?**
    - Equipment calibration current
    - Calibration certificates available

15. **Is het testresultaat besproken met de verantwoordelijke of opdrachtgever?**
    - Results communicated
    - Approval obtained

### Test Execution

1. **Pre-Test Safety**
   - Complete all safety items
   - Verify equipment calibration
   - Ensure personnel safety

2. **Test Execution**
   - Apply test voltage gradually
   - Monitor for breakdown or leakage
   - Maintain voltage for required duration
   - Record all measurements

3. **Post-Test**
   - Visual inspection for damage
   - Reconnect all systems
   - Verify operational readiness
   - Document results

### Pass/Fail Criteria

**Pass**: All safety items verified, no breakdown, acceptable leakage current
**Fail**: Any safety violation, breakdown, or excessive leakage
**N.v.t.**: Not applicable for specific configuration

---

## Stage 4: On-Site Test (Test op Locatie)

### Purpose
Installation and commissioning verification at customer site.

### Pre-Installation Checks

**Transport Assessment**:
- **Transportschade geconstateerd?**: Visual inspection for shipping damage
- **Hermontage vereist?**: Determine if reassembly needed

### Installation Checklist (20 Items)

1. **Visuele inspectie op transportschade**
   - Check for physical damage
   - Document any issues found

2. **Controle bevestigingen en verbindingen na transport**
   - Verify all connections secure
   - Check mounting hardware

3. **Herbevestiging van losgeraakte onderdelen**
   - Retighten any loose components
   - Verify proper assembly

4. **Controle van alle elektrische verbindingen**
   - Check all electrical connections
   - Verify proper terminations

5. **Controle van aardverbindingen**
   - Verify grounding connections
   - Check earth continuity

6. **Controle van kabelverbindingen en wartels**
   - Check cable connections
   - Verify cable gland integrity

7. **Test van hoofdschakelaar functionaliteit**
   - Verify main switch operation
   - Check mechanical operation

8. **Controle van beveiligingen en automaten**
   - Test protective devices
   - Verify circuit breaker operation

9. **Test van noodstop functionaliteit (indien aanwezig)**
   - Emergency stop testing
   - Safety system verification

10. **Controle van signalering en indicatie**
    - Test indicator lights
    - Verify alarm systems

11. **Isolatiemeting tussen fasen**
    - Phase-to-phase insulation
    - Record measurements

12. **Isolatiemeting fase naar aarde**
    - Phase-to-earth insulation
    - Verify insulation integrity

13. **Doorgangsmeting aardverbindingen**
    - Earth continuity testing
    - Verify low resistance

14. **Functionele test van alle uitgaande groepen**
    - Test all outgoing circuits
    - Verify proper operation

15. **Controle van fasevolgorde (bij 3-fasen installaties)**
    - Phase sequence verification
    - Correct rotation direction

16. **Test van RCD/aardlekschakelaars (indien aanwezig)**
    - Earth leakage testing
    - Trip time verification

17. **Controle van kastverlichting en hulpvoeding**
    - Panel lighting operation
    - Auxiliary power verification

18. **Documentatie controle (schema's, certificaten)**
    - Verify documentation complete
    - Check certificates present

19. **Oplevering aan eindgebruiker met instructies**
    - Customer handover process
    - Operation instructions

20. **Ondertekening opleveringsprotocol**
    - Customer acceptance signature
    - Final documentation

### Site-Specific Information

**Required Details**:
- **Location**: Specific installation location
- **Site Contact**: Customer representative
- **Installation Date**: Actual installation date
- **Environmental Conditions**: Site-specific factors

---

## Testing Best Practices

### Quality Assurance

1. **Sequential Testing**
   - Complete workshop checklist before FAT
   - Finish FAT before high voltage testing
   - Complete all factory tests before site installation

2. **Documentation Standards**
   - Record all measurements accurately
   - Add detailed notes for any issues
   - Take photos of critical items
   - Generate PDFs for all completed tests

3. **Issue Resolution**
   - Mark items as "Fout" when issues found
   - Document corrective actions taken
   - Change status to "Hersteld" after fixes
   - Re-test critical items after repairs

### Safety Protocols

1. **High Voltage Testing**
   - Only qualified personnel
   - Proper safety equipment required
   - Follow lockout/tagout procedures
   - Emergency procedures in place

2. **Workshop Safety**
   - Verify de-energization
   - Use appropriate PPE
   - Follow company safety procedures
   - Report any safety concerns

### Test Data Management

1. **Data Integrity**
   - All test data automatically saved
   - No data loss on browser crashes
   - Can resume testing anytime
   - Audit trail maintained

2. **Report Generation**
   - PDFs automatically generated
   - Professional formatting
   - Company branding included
   - Saved to appropriate folders

3. **Client Delivery**
   - Test certificates available in client portal
   - Professional presentation
   - Complete documentation package
   - Digital signatures where required

---

## Troubleshooting Testing Issues

### Common Problems

#### Test Data Not Saving
**Symptoms**: Progress lost when closing browser
**Solutions**:
1. Check browser localStorage enabled
2. Complete required fields before closing
3. Use "Save" functionality where available
4. Avoid browser private/incognito mode

#### Cannot Complete Test
**Symptoms**: "Complete" button disabled
**Solutions**:
1. Verify all required items completed
2. Check that tester name is filled
3. Ensure date is set
4. Review any mandatory measurements

#### PDF Generation Fails
**Symptoms**: No PDF created after test completion
**Solutions**:
1. Check browser PDF support
2. Disable popup blockers
3. Try different browser
4. Contact technical support

#### Permission Denied
**Symptoms**: Cannot access testing functions
**Solutions**:
1. Verify user role permissions
2. Check if project is in "Testen" status
3. Ensure verdeler is assigned to user
4. Contact administrator

### Recovery Procedures

#### Interrupted Testing
1. Navigate back to verdeler
2. Click appropriate test button
3. System loads saved progress
4. Continue from last completed item

#### Data Corruption
1. Clear browser cache
2. Restart testing process
3. Contact technical support if needed
4. Use backup data if available

---

## Testing Compliance & Standards

### Applicable Standards

- **IEC 61439**: Low-voltage switchgear and controlgear assemblies
- **NEN 1010**: Dutch electrical installation standard
- **ISO 9001**: Quality management systems
- **CE Marking**: European conformity requirements

### Compliance Requirements

1. **Documentation**
   - Complete test records
   - Calibrated equipment certificates
   - Qualified personnel records
   - Traceability documentation

2. **Quality Control**
   - Independent inspection
   - Approval workflows
   - Non-conformance handling
   - Corrective action tracking

3. **Customer Requirements**
   - Project-specific standards
   - Client approval processes
   - Special testing requirements
   - Delivery documentation

---

This comprehensive testing guide ensures consistent, safe, and compliant testing procedures for all electrical distributors in the EWP Management System.