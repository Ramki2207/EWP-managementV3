# EWP Management System - Detailed Workflow Examples

## Complete Project Workflow Example

### Scenario: New Electrical Panel Project for ABC Manufacturing

Let's walk through a complete project from start to finish.

---

## 1. Project Creation Workflow

### Step 1: Initial Project Setup

**User**: Project Manager logs in and navigates to Projects

1. **Click "Project toevoegen"**
2. **Fill Project Details**:
   - **Locatie**: Select "Leerdam"
   - **Projectnummer**: Automatically becomes "PM25-456" (example)
   - **Datum**: Set to today's date
   - **Klant**: Select "ABC Manufacturing" or create new client
   - **Status**: Set to "Intake"
   - **Omschrijving**: "Main electrical distribution panel for new production facility"

3. **Optional: Complete Intake Form**
   - Check "Intake formulier invullen"
   - **Kast Specificaties**:
     - Merk: "Schneider Electric"
     - Uitvoering: "Wandmontage"
     - Breedte: "80" cm
     - Hoogte: "120" cm
     - Diepte: "25" cm
     - IP Klasse: "IP40"
     - Amperage: "400"
     - Hoofdschakelaar: "400A"
   
   - **Kabel Configuratie**:
     - Inkomende kabel: "4x95mm²"
     - Afgaande kabels: "12x 5x2.5mm²"
     - ✅ Wartels
     - ❌ Draai
   
   - **Extra Opties**:
     - ✅ Meterbord
     - ✅ PV Groepen
     - ❌ PV Subsidie
     - ✅ Totaal Meting

4. **Click "Volgende stap"**

### Step 2: Adding Verdelers

1. **Click "Verdeler toevoegen"**
2. **Fill Verdeler Details**:
   - **Verdeler ID**: "VD8996" (auto-generated)
   - **Kastnaam**: "Hoofdverdeler Productiehal A"
   - **Systeem**: "400V TN-S"
   - **Voeding**: "3x400V + N + PE"
   - **Bouwjaar**: "2025"
   - **Keuring datum**: Today's date
   - **Getest door**: "Jan Technicus"
   - **Un in V**: "400"
   - **In in A**: "400"
   - **Ik Th in KA 1s**: "25"
   - **Ik Dyn in KA**: "65"
   - **Freq. in Hz**: "50"
   - **Type nr. HS**: "NS400N"
   - **Fabrikant**: "Schneider Electric"
   - **Status**: "In productie"

3. **Upload Profile Photo** (optional)
4. **Click "Opslaan"**
5. **Repeat for additional verdelers if needed**
6. **Click "Volgende stap"**

### Step 3: Document Upload

1. **Select Verdeler**: Click "VD8996 - Hoofdverdeler Productiehal A"
2. **Choose Folder**: Click "Algemene informatie"
3. **Upload Documents**:
   - Drag & drop: "Project_specificaties.pdf"
   - Upload: "Elektrisch_schema_rev.1.pdf"
   - Add: "Componentenlijst.xlsx"

4. **Repeat for other folders**:
   - **Installatie schema**: Upload wiring diagrams
   - **Onderdelen**: Upload component specifications
   - **Handleidingen**: Upload manuals and guides

5. **Click "Project opslaan"**

**Result**: Complete project created with verdelers and initial documentation

---

## 2. Complete Testing Workflow Example

### Scenario: Testing VD8996 for Project PM25-456

#### Phase 1: Workshop Checklist

**User**: Workshop Technician opens verdeler details

1. **Navigate to Verdeler**:
   - Go to "Verdelers" → Click "VD8996"
   - Or from project details → Verdelers tab

2. **Start Workshop Test**:
   - Click "Verdeler testen" button
   - **Date**: Today's date
   - **Tested by**: "Jan Technicus"

3. **Complete Checklist Categories**:

   **1. Goederenstroom**:
   - 1.01 Ontvangstprocedure volgens ISO 9003: ✅ **Akkoord**

   **2. Railsystemen**:
   - 2.01 Railsystemen aanwezig: ✅ **Akkoord**
   - 2.02 Nominale waarde railsysteem: **630 A (30×10 mm)**
   - 2.03 Juiste CU-doorsnede toegepast: ✅ **Akkoord**
   - 2.04 Extra coderingen (L1, L2, L3, N, PE): ✅ **Akkoord**
   - 2.05 Kunststof afscherming railsysteem: ✅ **Akkoord**

   **3. Componenten**:
   - 3.01 Componenten volgens schema geplaatst: ✅ **Akkoord**
   - 3.02 Componenten ingesteld: ✅ **Akkoord**
   - Notes: "Alle automaten ingesteld op juiste waarden"
   - Continue through all component checks...

   **Continue through all 9 categories** (54 total items)

4. **Complete Inspection Report**:
   - **Date**: Today's date
   - **Inspected by**: "Kees Kwaliteit"
   - **Approved by**: "Piet Projectleider"
   
   **Final Checks**:
   - Voldoet aan technische specificaties: ✅ **Pass**
   - Voldoet aan veiligheidseisen: ✅ **Pass**
   - Documentatie compleet: ✅ **Pass**
   - Testresultaten goedgekeurd: ✅ **Pass**
   
   **Final Result**: **Goedgekeurd**
   **Notes**: "Verdeler voldoet aan alle eisen en is gereed voor FAT"

5. **Click "Voltooien en afronden"**

**Result**: Workshop checklist completed, PDF automatically generated and saved

#### Phase 2: Factory Acceptance Test (FAT)

1. **Start FAT Test**:
   - Click "FAT Test" button
   - **Date**: Today's date
   - **Tested by**: "Henk Tester"

2. **Record Measurements**:
   - **Isolatieweerstand**: "500 MΩ"
   - **Doorgangstest**: "0.05 Ω"
   - **Functionele test**: "400 V"
   - **Spanningstest**: "400 V"

3. **Complete 96 Test Items**:

   **Algemeen Category** (14 items):
   - Afmetingen: ✅ **Pass** - "Conform tekening"
   - Lakwerk: ✅ **Pass** - "RAL7035, geen beschadigingen"
   - Scharnieren en deursluitingen: ✅ **Pass**
   - Continue through all general checks...

   **Railsysteem Category** (5 items):
   - Raildoorsnede: ✅ **Pass** - "30x10mm conform specificatie"
   - Kruip- en luchtwegen: ✅ **Pass**
   - Continue through rail system checks...

   **Continue through all categories**:
   - Montage (18 items)
   - Afscherming (6 items)
   - Aarding (8 items)
   - Coderingen (8 items)
   - Instellingen (10 items)
   - Functioneel (18 items)
   - Diversen (8 items)

4. **Complete All Items**
5. **Click "Test voltooien"**

**Result**: FAT completed, comprehensive test data recorded

#### Phase 3: High Voltage Test

1. **Start HV Test**:
   - Click "Hoogspanning test" button
   - **Date**: Today's date
   - **Tested by**: "Erik Elektro"

2. **Test Parameters**:
   - **Testspanning**: "2500 V"
   - **Test duur**: "1 minuut"
   - **Omgevingstemperatuur**: "22°C"
   - **Luchtvochtigheid**: "45%"

3. **Safety Checklist** (15 items):
   - Is het verdeelsysteem volledig spanningsloos gemaakt: ✅ **Pass**
   - Zijn alle externe verbindingen gecontroleerd: ✅ **Pass**
   - Is de juiste testspanning ingesteld: ✅ **Pass**
   - Continue through all safety checks...

4. **Click "Test voltooien"**

**Result**: High voltage test completed, safety verified

#### Phase 4: On-Site Test (Optional)

1. **Start On-Site Test**:
   - Click "Test op locatie" button
   - **Date**: Installation date
   - **Tested by**: "Piet Monteur"
   - **Location**: "ABC Manufacturing, Productiehal A"

2. **Transport Check**:
   - **Transportschade**: ❌ **Nee**
   - **Hermontage vereist**: ❌ **Nee**

3. **Installation Checklist** (20 items):
   - Visuele inspectie op transportschade: ✅ **Pass**
   - Controle bevestigingen na transport: ✅ **Pass**
   - Test van hoofdschakelaar functionaliteit: ✅ **Pass**
   - Continue through all installation checks...

4. **Click "Test voltooien"**

**Result**: On-site testing completed, ready for handover

---

## 3. Document Management Workflow

### Scenario: Managing Technical Documentation

#### Uploading Initial Documents

1. **Navigate to Uploads**
2. **Select Project**: "PM25-456"
3. **Select Verdeler**: "VD8996 - Hoofdverdeler Productiehal A"

4. **Upload to Different Folders**:

   **Verdeler aanzicht**:
   - Upload: "VD8996_Front_View.jpg"
   - Upload: "VD8996_Internal_View.jpg"

   **Installatie schema**:
   - Upload: "Electrical_Diagram_v1.0.pdf"
   - Upload: "Wiring_Schematic_v1.0.dwg"

   **Algemene informatie**:
   - Upload: "Technical_Specifications.pdf"
   - Upload: "Component_List.xlsx"

#### Revision Management Example

1. **Initial Upload**:
   - Upload "Electrical_Diagram_v1.0.pdf" to "Installatie schema"
   - File saved in main folder

2. **First Revision**:
   - Upload "Electrical_Diagram_rev.1.pdf"
   - System automatically:
     - Moves "Electrical_Diagram_v1.0.pdf" to "Historie" subfolder
     - Places "Electrical_Diagram_rev.1.pdf" in "Actueel" subfolder

3. **Second Revision**:
   - Upload "Electrical_Diagram_rev.2.pdf"
   - System automatically:
     - Moves "rev.1" from Actueel to Historie
     - Places "rev.2" in Actueel

**Result**: Clean document organization with version history

---

## 4. Maintenance Workflow Example

### Scenario: Scheduled Maintenance on VD8996

#### Creating Access Code

**User**: Admin creates maintenance access

1. **Navigate to Toegangscodes**
2. **Click "Code aanmaken"**
3. **Configure Code**:
   - **Verdeler**: Select "VD8996 - Hoofdverdeler Productiehal A"
   - **Code**: "12345" (auto-generated)
   - **Vervaldatum**: Set to next week
   - **Maximum gebruik**: Leave empty (unlimited)
   - ✅ **Direct activeren**

4. **Click "Code aanmaken"**

#### Maintenance Execution

**User**: Field technician performs maintenance

1. **Scan QR Code**:
   - Use phone to scan QR code on verdeler label
   - Opens maintenance report form

2. **Enter Access Code**:
   - Enter "12345" in access code field
   - System validates code for VD8996
   - Grants access to report form

3. **Select Report Type**: **"Werkbon"** (work order with materials)

4. **Fill Work Details**:
   - **Naam monteur**: "Kees Onderhoud"
   - **Datum**: Today's date
   - **Start tijd**: "09:00"
   - **Eind tijd**: "12:30"
   - **Totale uren**: 3.5 (auto-calculated)
   - **Beschrijving**: "Preventief onderhoud hoofdverdeler - controle verbindingen en reiniging"

5. **Add Materials**:
   - **Material 1**:
     - Beschrijving: "Contactspray"
     - Aantal: 1
     - Eenheid: "stuks"
     - Prijs: €15.50
   - **Material 2**:
     - Beschrijving: "Reinigingsdoeken"
     - Aantal: 5
     - Eenheid: "stuks"
     - Prijs: €2.50

6. **Upload Photos**:
   - Take before/after photos
   - Upload work progress images

7. **Client Signature**:
   - Fill client details:
     - **Naam**: "Jan Janssen"
     - **Functie**: "Maintenance Manager"
     - **Bedrijf**: "ABC Manufacturing"
   - **Digital signature**: Client signs on tablet/phone
   - System captures signature with timestamp

8. **Submit Werkbon**

**Result**: 
- Werkbon submitted to system
- Notification created in Meldingen
- PDF work order generated
- Client receives signed copy

#### Processing Maintenance Request

**User**: Servicedesk processes the request

1. **Navigate to Meldingen**
2. **View New Notification**:
   - Type: "Werkbon"
   - Status: "Pending"
   - Verdeler: "VD8996"
   - Worker: "Kees Onderhoud"

3. **Review Details**:
   - Check work description
   - Verify materials used
   - Review photos
   - Validate client signature

4. **Update Status**: Change to "Completed"
5. **Download PDF**: Generate final work order PDF
6. **Add Comments**: "Work completed satisfactorily, no issues found"

**Result**: Maintenance request processed and documented

---

## 5. Client Portal Workflow

### Scenario: Project Ready for Delivery

#### Automatic Portal Creation

**User**: Project manager updates project status

1. **Open Project Details**: PM25-456
2. **Edit Project Status**: Change from "Testen" to "Levering"
3. **Save Changes**

**System automatically**:
- Creates client portal with 6-digit access code
- Generates secure portal URL
- Sets 30-day expiration
- Prepares delivery notification

#### Sending Delivery Notification

1. **Delivery Notification Section Appears**
2. **Click "Genereer Notificatie"**
3. **Review Portal Information**:
   - **Portal Link**: https://ewp-management.nl/client-portal/ABC123
   - **Access Code**: "789456"
   - **Expiration**: 30 days from today

4. **Set Delivery Date** (optional):
   - Select specific delivery date
   - Or leave empty for "zoals afgesproken"

5. **Preview Email Template**:
   ```
   Beste ABC Manufacturing,

   Goed nieuws! Uw verdelers voor project PM25-456 zijn succesvol getest en gereed voor levering.

   LEVERING DETAILS:
   - Project: PM25-456
   - Locatie: Leerdam
   - Verwachte leverdatum: Vrijdag 15 maart 2025
   - Aantal verdelers: 1

   DOCUMENTATIE PORTAL:
   Voor uw gemak hebben wij alle testdocumenten, certificaten en technische informatie beschikbaar gesteld in een beveiligde online portal.

   Portal toegang:
   Link: https://ewp-management.nl/client-portal/ABC123
   Toegangscode: 789456

   In de portal vindt u:
   - Alle testcertificaten en keuringsrapporten
   - Technische specificaties per verdeler
   - Installatie-instructies en handleidingen

   Met vriendelijke groet,
   EWP groep B.V.
   ```

6. **Click "Verstuur Notificatie"**

**Result**: 
- Email template generated
- Project status updated to "Opgeleverd"
- Client portal activated

#### Client Portal Usage

**User**: Client accesses portal

1. **Receive Email**: Client gets delivery notification
2. **Access Portal**: Click portal link or navigate manually
3. **Enter Access Code**: "789456"
4. **Portal Access Granted**

**Portal Features**:
- **Project Overview**: Status, specifications, contact info
- **Verdeler Specifications**: Technical details for each verdeler
- **Document Downloads**: Access to approved documents
- **Test Certificates**: Download generated test reports

---

## 6. Advanced Testing Scenario

### Scenario: Complex Multi-Verdeler Project Testing

#### Project: PM25-789 with 3 Verdelers

**Verdelers**:
- VD1001: "Hoofdverdeler Gebouw A"
- VD1002: "Subverdeler Productie"  
- VD1003: "Noodvoeding Verdeler"

#### Sequential Testing Process

**Week 1: Workshop Preparation**

**Day 1: VD1001 Workshop Checklist**
1. **Tester**: "Jan Technicus"
2. **Complete all 54 items**
3. **Issues Found**:
   - 3.02 Componenten ingesteld: ❌ **Fout** - "Automaat C16 verkeerd ingesteld"
   - Notes: "Automaat aangepast naar C20 conform schema"
   - Status changed to: 🔧 **Hersteld**
4. **Inspection Result**: **Goedgekeurd**

**Day 2: VD1002 Workshop Checklist**
1. **Tester**: "Piet Monteur"
2. **Complete checklist**
3. **All items pass**
4. **Inspection Result**: **Goedgekeurd**

**Day 3: VD1003 Workshop Checklist**
1. **Tester**: "Jan Technicus"
2. **Issues Found**:
   - 6.04 Hoogspanningstest: ❌ **Fout** - "Isolatieweerstand te laag"
   - Notes: "Hersteld: kabel vervangen, nieuwe meting OK"
   - Status: 🔧 **Hersteld**
3. **Inspection Result**: **Voorwaardelijk goedgekeurd**
4. **Notes**: "Hertest vereist na kabelvervanging"

**Week 2: Factory Acceptance Testing**

**Day 1: VD1001 FAT**
1. **Tester**: "Erik Expert"
2. **Measurements**:
   - Isolatieweerstand: "750 MΩ"
   - Doorgangstest: "0.03 Ω"
   - Functionele test: "400 V"
   - Spanningstest: "400 V"
3. **96 Items Completed**:
   - All general checks pass
   - Rail system verified
   - All mounting confirmed
   - Shielding adequate
   - Grounding verified
   - All coding correct
   - Settings confirmed
   - Functional tests pass
   - Delivery items complete
4. **Result**: All items pass

**Day 2-3: VD1002 and VD1003 FAT**
- Similar process for remaining verdelers
- All tests completed successfully

**Week 3: High Voltage Testing**

**All Verdelers HV Test**:
1. **Test Parameters**:
   - **Testspanning**: "2500 V" (for 400V system)
   - **Test duur**: "1 minuut"
   - **Omgevingstemperatuur**: "20°C"
   - **Luchtvochtigheid**: "50%"

2. **Safety Checklist**: All 15 items verified
3. **Results**: All verdelers pass HV testing

**Week 4: Final Documentation**

1. **Generate Test Reports**:
   - Comprehensive PDFs for each verdeler
   - Include all test data and measurements
   - Professional formatting with company branding

2. **Upload to Documents**:
   - Save PDFs to "Test certificaat" folders
   - Upload final photos to "Oplever foto's"
   - Add installation guides to "Handleidingen"

3. **Update Project Status**: "Testen" → "Levering"

**Result**: Complete testing documentation for 3 verdelers, ready for delivery

---

## 7. Business Intelligence Workflow

### Scenario: Monthly Performance Review

#### Generating Business Reports

**User**: Management reviews monthly performance

1. **Navigate to Inzichten**
2. **Set Time Range**:
   - Click "Deze maand" for current month
   - Or set custom range: "01-01-2025" to "31-01-2025"

3. **Apply Filters**:
   - **Client Filter**: "Alle klanten" (or select specific client)
   - View real-time data updates

4. **Analyze KPIs**:
   - **Total Projects**: 45 (+5 this month)
   - **Active Projects**: 23 (51% of total)
   - **Total Clients**: 18 (+2 this month)
   - **Verdelers**: 127 (+15 this month)

5. **Review Charts**:
   - **Monthly Trends**: Steady growth in projects
   - **Status Distribution**: 30% in testing, 25% in production
   - **Activity Patterns**: Peak activity in weeks 2-3

6. **Generate PDF Report**:
   - Click "Rapport Genereren"
   - System captures all charts and data
   - Creates professional PDF with:
     - Executive summary
     - KPI overview
     - Chart visualizations
     - Monthly data tables
     - Company branding

**Result**: Comprehensive business intelligence report for stakeholders

---

## 8. Multi-User Collaboration Example

### Scenario: Team Working on Large Project

#### Project PM25-999: Industrial Complex

**Team Members**:
- **Project Manager**: "Lisa Leider" (full project access)
- **Workshop Technician**: "Jan Technicus" (testing access)
- **Quality Inspector**: "Kees Kwaliteit" (approval access)
- **Client**: "ABC Manufacturing" (portal access only)

#### Day 1: Project Setup

**9:00 AM - Lisa (Project Manager)**:
1. Creates new project PM25-999
2. Adds 5 verdelers with specifications
3. Uploads initial documentation
4. Assigns project to testing phase

**10:00 AM - Jan (Technician)**:
1. Receives notification of new project
2. Can only see project (status = "Testen")
3. Begins workshop checklist for VD2001
4. System locks VD2001 for Jan's editing

**10:30 AM - Kees (Quality Inspector)**:
1. Tries to access VD2001
2. Sees "Vergrendeld door Jan Technicus"
3. Works on VD2002 instead
4. System locks VD2002 for Kees

#### Day 2: Concurrent Testing

**Morning**:
- Jan completes workshop checklist for VD2001
- Kees completes FAT for VD2002
- Lisa monitors progress from dashboard
- No conflicts due to automatic locking

**Afternoon**:
- Jan starts FAT for VD2003
- Kees performs final inspection on VD2001
- System tracks all activities in real-time

#### Day 3: Quality Control

**Kees (Quality Inspector)**:
1. Reviews all completed tests
2. Approves VD2001 and VD2002
3. Requests rework on VD2003 (conditional approval)
4. Updates project status to "Levering"

**Lisa (Project Manager)**:
1. Sees status change notification
2. Generates client portal automatically
3. Sends delivery notification to ABC Manufacturing

**ABC Manufacturing (Client)**:
1. Receives email with portal access
2. Logs into portal with access code
3. Downloads test certificates
4. Reviews verdeler specifications

**Result**: Seamless collaboration with no conflicts, complete audit trail

---

## 9. Error Handling & Recovery

### Scenario: System Issues and Recovery

#### Database Connection Lost

**Situation**: Internet connection interrupted during work

**System Behavior**:
1. Automatically falls back to localStorage
2. Shows warning: "Working offline"
3. Continues normal operation
4. Syncs when connection restored

**User Actions**:
1. Continue working normally
2. Save work frequently
3. System auto-syncs when online

#### Project Lock Conflicts

**Situation**: User tries to access locked project

**System Response**:
1. Shows "Project wordt bewerkt door [username]"
2. Displays lock duration and last activity
3. Prevents access to avoid conflicts

**Resolution Options**:
1. **Wait**: Lock expires after 5 minutes of inactivity
2. **Admin Override**: Admin can force-unlock
3. **Alternative Work**: Work on different project/verdeler

#### Test Data Recovery

**Situation**: Browser crash during testing

**Recovery Process**:
1. Reopen browser and navigate to verdeler
2. Click testing button
3. System automatically loads saved progress
4. Continue from where you left off

**Data Safety**:
- All test data auto-saved to localStorage
- No data loss on browser crashes
- Can resume testing anytime

---

## 10. Integration Examples

### Scenario: Complete Project Integration

#### Project PM25-555: From Intake to Delivery

**Month 1: Project Initiation**
1. **Intake Meeting**: Client requirements gathered
2. **Project Creation**: Full intake form completed
3. **Client Setup**: ABC Corp added with 3 contacts
4. **Initial Documentation**: Specifications uploaded

**Month 2: Design & Production**
1. **Status Update**: "Intake" → "Offerte" → "Order"
2. **Verdeler Design**: 2 verdelers added with full specs
3. **Production Planning**: Work entries tracked
4. **Document Updates**: Schemas uploaded with revisions

**Month 3: Testing Phase**
1. **Status Update**: "Order" → "Productie" → "Testen"
2. **Workshop Testing**: Both verdelers complete checklists
3. **FAT Testing**: Comprehensive 96-point tests
4. **Quality Control**: Final inspections and approvals
5. **Documentation**: Test certificates generated

**Month 4: Delivery**
1. **Status Update**: "Testen" → "Levering"
2. **Portal Creation**: Automatic client portal generation
3. **Notification**: Delivery email sent to client
4. **Client Access**: Portal provides document access
5. **Final Status**: "Levering" → "Opgeleverd"

**Integration Points**:
- Project data flows to all modules
- Test results auto-generate certificates
- Status changes trigger portal creation
- Client portal provides secure document access
- All activities logged for audit trail

---

## Quick Start Checklist

### For New Users

**First Day Setup**:
- [ ] Log in with provided credentials
- [ ] Explore dashboard and navigation
- [ ] Review your role permissions
- [ ] Update your profile information
- [ ] Familiarize yourself with your assigned modules

**First Project**:
- [ ] Create a test project
- [ ] Add a verdeler with basic specs
- [ ] Upload a test document
- [ ] Complete a workshop checklist
- [ ] Generate a test report

**First Week Goals**:
- [ ] Complete full project workflow
- [ ] Perform all testing procedures
- [ ] Generate client portal
- [ ] Create maintenance access code
- [ ] Review business intelligence reports

### For Administrators

**System Setup**:
- [ ] Configure user roles and permissions
- [ ] Set up location-based access
- [ ] Create default clients and projects
- [ ] Configure access code policies
- [ ] Set up backup procedures

**User Management**:
- [ ] Create user accounts for team
- [ ] Assign appropriate roles
- [ ] Configure location restrictions
- [ ] Test permission systems
- [ ] Train users on workflows

**Ongoing Maintenance**:
- [ ] Monitor system performance
- [ ] Review audit logs
- [ ] Manage expired access codes
- [ ] Clean up old documents
- [ ] Generate business reports

---

This comprehensive guide covers all major workflows and features of the EWP Management System. Each section includes detailed step-by-step instructions, real-world examples, and best practices for optimal system usage.

For additional support, contact Process Improvement B.V. technical support or refer to the built-in help system.