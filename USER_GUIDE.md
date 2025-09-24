# EWP Management System - Complete User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [System Overview](#system-overview)
3. [Project Management](#project-management)
4. [Verdeler Management](#verdeler-management)
5. [Testing Workflows](#testing-workflows)
6. [Document Management](#document-management)
7. [Client Management](#client-management)
8. [Service Desk & Notifications](#service-desk--notifications)
9. [Business Intelligence](#business-intelligence)
10. [User Management](#user-management)
11. [Advanced Features](#advanced-features)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Login

1. **Navigate to the login page**
   - Open your web browser and go to the EWP Management System URL
   - You'll see the EWP Paneelbouw logo and login form

2. **Enter your credentials**
   - **Username**: Your assigned username
   - **Password**: Your secure password
   - Click the eye icon to show/hide your password

3. **Default Admin Accounts** (for initial setup):
   - `admin` / `admin123`
   - `Patrick Herman` / `Welkom123`
   - `Stefano de Weger` / `Welkom123`
   - `Lysander koenraadt` / `Welkom123`

4. **First Login**
   - The system will automatically migrate any existing data
   - You'll be redirected to the dashboard upon successful login

### User Roles Overview

The system supports multiple user roles with different access levels:

- **Admin**: Full system access including user management
- **Standard User**: Regular business operations and project management
- **Tester**: Quality assurance and testing workflows (only sees projects in "Testen" status)
- **Servicedesk**: Maintenance and customer support operations
- **Planner**: Project planning and resource management
- **Projectleider**: Full project responsibility and team coordination
- **Magazijn**: Inventory and material management
- **Logistiek**: Transport and delivery coordination
- **Montage**: Assembly and production work
- **Finance**: Financial administration and invoicing

---

## System Overview

### Dashboard Navigation

The main dashboard provides:

1. **KPI Cards**: Quick overview of system statistics
   - Total Projects, Active Projects, Clients, Verdelers
   - Monthly growth indicators
   - Real-time data updates

2. **Navigation Sidebar** (left side):
   - **Home**: Dashboard with KPIs
   - **Projecten**: Project management
   - **Verdelers**: Distributor management
   - **Klanten**: Client management
   - **Meldingen**: Service desk notifications
   - **Uploads**: Document management
   - **Gebruikers**: User management (admin only)
   - **Toegangscodes**: QR code access management
   - **Klant Portals**: Customer portal management
   - **Inzichten**: Business intelligence and reporting

3. **User Account Menu** (bottom of sidebar):
   - **Mijn account**: Personal profile management
   - **Help**: Support and documentation

### Project Lifecycle

Projects follow this standard workflow:
```
Intake → Offerte → Order → Productie → Testen → Levering → Opgeleverd
```

Each status change triggers different system behaviors and access permissions.

---

## Project Management

### Creating a New Project

The project creation process uses a 3-step wizard:

#### Step 1: Project Details

1. **Navigate to Project Creation**
   - Click "Projecten" in the sidebar
   - Click "Project toevoegen" button

2. **Fill in Basic Information**
   - **Locatie** (required): Select from Leerdam, Naaldwijk, or Rotterdam
   - **Projectnummer**: Automatically generated based on location and year
     - Leerdam: PM25-XXX
     - Naaldwijk: PD25-XXX  
     - Rotterdam: PR25-XXX
   - **Datum** (required): Project start date
   - **Klant**: Select existing client or create new one
   - **Status**: Select current project status
   - **Omschrijving**: Detailed project description

3. **Optional: Intake Formulier**
   - Check "Intake formulier invullen" to add detailed specifications
   - **Kast Specificaties**: Merk, uitvoering, dimensions, IP class, amperage
   - **Kabel Configuratie**: Incoming/outgoing cables, wartels, draai options
   - **Extra Opties**: Meterbord, PV groups, laadpaal groups, etc.
   - **Afgaande Velden**: Two detailed tables for electrical specifications
   - **Opmerkingen**: Additional notes and special requirements

4. **Client Management**
   - Click "Nieuwe klant aanmaken" to add clients during project creation
   - Fill in company details, visit/delivery addresses, VAT/KvK numbers
   - Add multiple contact persons with roles and departments

#### Step 2: Verdelers

1. **Add Verdelers to Project**
   - Click "Verdeler toevoegen"
   - **Verdeler ID**: Automatically generated (VD + 4 digits)
   - **Kastnaam** (required): Descriptive name for the distributor
   - **Technical Specifications**:
     - Systeem, Voeding, Bouwjaar
     - Un in V, In in A (voltage/amperage)
     - Ik Th in KA 1s, Ik Dyn in KA (short circuit values)
     - Freq. in Hz, Type nr. HS
     - Fabrikant (manufacturer)
   - **Status**: In productie, Testen, Gereed, Opgeleverd
   - **Profile Photo**: Optional image upload

2. **Verdeler Actions**
   - **Info**: View complete verdeler specifications
   - **Bewerken**: Modify verdeler details
   - **Verwijderen**: Delete verdeler (with confirmation)
   - **Testing Buttons**: Access to all testing workflows
   - **Toegangscode**: Generate QR access codes
   - **Print Label**: Generate printable QR labels

#### Step 3: Uploads

1. **Document Organization**
   - Documents are organized: Project → Verdeler → Folder
   - **Default Folders**:
     - Verdeler aanzicht
     - Test certificaat
     - Algemene informatie
     - Installatie schema
     - Onderdelen
     - Handleidingen
     - Documentatie
     - Oplever foto's

2. **Upload Process**
   - Select verdeler from navigation tree
   - Choose target folder
   - Drag & drop files or click to browse
   - Maximum file size: 5MB per file
   - Supported formats: Images, PDFs, Office documents

3. **Revision Management** (for specific folders)
   - Files with "rev.1", "rev.2" etc. trigger automatic revision management
   - Old versions moved to "Historie" subfolder
   - New versions placed in "Actueel" subfolder

### Managing Existing Projects

#### Project Details View

1. **Access Project**
   - Navigate to "Projecten"
   - Click on any project row to open details
   - System automatically locks project for editing

2. **Project Tabs**
   - **Details**: Basic project information and editing
   - **Verdelers**: Manage distributors and testing
   - **Documents**: Document management interface
   - **Intake**: View intake form data (if available)
   - **Productie**: Production tracking and work entries

3. **Project Locking System**
   - Projects are automatically locked when opened for editing
   - Other users see "Vergrendeld door [username]" status
   - Admins can force-unlock projects if needed
   - Locks automatically expire after 5 minutes of inactivity

#### Project Status Management

1. **Status Changes**
   - Edit project details to change status
   - Status change to "Levering" automatically triggers client portal creation
   - Status "Opgeleverd" marks project as completed

2. **Delivery Process** (when status = "Levering")
   - System automatically creates client portal
   - Generate delivery notification email
   - Set custom delivery date or use "zoals afgesproken"
   - Portal includes access code and document access

---

## Verdeler Management

### Verdeler Overview

1. **Access Verdelers**
   - Click "Verdelers" in sidebar
   - View all verdelers across all projects
   - Search by verdeler ID, kastnaam, or project number

2. **Verdeler Information**
   - **Basic Info**: ID, kastnaam, project association
   - **Technical Specs**: All electrical specifications
   - **Status Tracking**: Current verdeler status
   - **Access Codes**: Active QR codes for maintenance

### Verdeler Details

1. **Navigation**
   - Click any verdeler row to open details
   - Three main tabs: Details, Documents, Testrapporten

2. **Details Tab**
   - View/edit all technical specifications
   - Update status and testing information
   - Generate access codes for maintenance

3. **Documents Tab**
   - Verdeler-specific document management
   - Same folder structure as project documents
   - Upload verdeler-specific files

4. **Testrapporten Tab**
   - View all completed test results
   - Download test certificates
   - Print comprehensive test reports

---

## Testing Workflows

### Complete Testing Process

The system supports a comprehensive 4-stage testing process:

#### 1. Werkplaats Checklist (Workshop Checklist)

**Purpose**: Pre-testing preparation and quality control

**Process**:
1. Click "Verdeler testen" on any verdeler
2. Fill in date and tester name
3. Complete 54 checklist items across 9 categories:

**Categories**:
- **1. Goederenstroom**: Receiving procedures
- **2. Railsystemen**: Rail system specifications and installation
- **3. Componenten**: Component placement and configuration
- **4. Interne bedrading**: Internal wiring standards
- **5. Montageframe**: Mounting frame installation
- **6. Beproeving**: Testing and validation procedures
- **7. Eindafwerking**: Final finishing and documentation
- **8. Eindcontrole**: Final inspection and quality control
- **9. Diversen**: Miscellaneous items and free text fields

**Completion**:
- Each item has options: Akkoord, N.v.t., Fout, Hersteld
- Some items have dropdown selections for specific values
- Add notes for any issues or special observations
- Must complete all items before proceeding

#### 2. Factory Acceptance Test (FAT)

**Purpose**: Comprehensive 96-point factory testing

**Process**:
1. Click "FAT Test" button
2. Enter test date and tester name
3. Record measurement values:
   - Isolatieweerstand (MΩ)
   - Doorgangstest (Ω)
   - Functionele test (V)
   - Spanningstest (V)

4. **Complete 96 test items** across categories:
   - **Algemeen**: Dimensions, paint, hinges, documentation
   - **Railsysteem**: Rail specifications and connections
   - **Montage**: Installation and component mounting
   - **Afscherming**: Protection and shielding
   - **Aarding**: Grounding and earth connections
   - **Coderingen**: Labeling and identification
   - **Instellingen**: Equipment settings and values
   - **Functioneel**: Functional testing and verification
   - **Diversen**: Miscellaneous items and delivery preparation

**Each item**: Pass (✓) / N.v.t. / Fail (✗) + notes

#### 3. Hoogspanning Test (High Voltage Test)

**Purpose**: Electrical safety and insulation testing

**Process**:
1. Click "Hoogspanning test" button
2. Enter test parameters:
   - Testspanning (V)
   - Test duur (minuten)
   - Omgevingstemperatuur (°C)
   - Luchtvochtigheid (%)

3. **Complete 15 safety items**:
   - Pre-test safety checks
   - Proper test voltage application
   - Insulation measurements
   - Equipment calibration verification
   - Post-test inspection

#### 4. Test op Locatie (On-Site Test)

**Purpose**: Installation and commissioning verification

**Process**:
1. Click "Test op locatie" button
2. Enter location details and installation info
3. Check transport damage and reassembly requirements
4. **Complete 20 installation items**:
   - Transport damage inspection
   - Electrical connection verification
   - Functional testing of all systems
   - Safety system validation
   - Customer handover procedures

#### 5. Keuringsrapport (Inspection Report)

**Purpose**: Final approval and certification

**Process**:
1. Automatically available after completing workshop checklist
2. Enter inspection details:
   - Inspection date
   - Inspector name
   - Approver name
3. **Complete 4 final checks**:
   - Technical specifications compliance
   - Safety requirements compliance
   - Documentation completeness
   - Test results approval
4. **Final Decision**:
   - **Goedgekeurd**: Approved for delivery
   - **Voorwaardelijk goedgekeurd**: Conditionally approved
   - **Afgekeurd**: Rejected (requires rework)

### PDF Report Generation

**Automatic PDF Creation**:
- Comprehensive test report generated automatically
- Includes all test data, measurements, and results
- Saved to "Test certificaat" folder
- Professional formatting with company branding
- Downloadable for client delivery

---

## Document Management

### Document Organization Structure

```
Project
├── Verdeler 1 (VD1234)
│   ├── Verdeler aanzicht
│   ├── Test certificaat
│   │   ├── Actueel (latest versions)
│   │   └── Historie (previous versions)
│   ├── Algemene informatie
│   ├── Installatie schema
│   │   ├── Actueel
│   │   └── Historie
│   ├── Onderdelen
│   ├── Handleidingen
│   ├── Documentatie
│   └── Oplever foto's
└── Verdeler 2 (VD5678)
    └── [same structure]
```

### Upload Process

1. **Navigate to Documents**
   - Go to "Uploads" page
   - Select project from left navigation
   - Expand verdeler to see folders

2. **File Upload Methods**
   - **Drag & Drop**: Drag files directly onto upload area
   - **Click Upload**: Click upload area to browse files
   - **Multiple Files**: Upload multiple files simultaneously

3. **File Restrictions**
   - Maximum size: 5MB per file
   - Supported formats: Images (JPG, PNG), PDFs, Office documents
   - Files stored as base64 in database

### Revision Management

**Automatic Versioning** (for specific folders):
- Applies to: "Verdeler aanzicht", "Test certificaat", "Installatie schema"
- **Trigger**: Upload files with "rev.1", "rev.2", etc. in filename
- **Process**:
  1. System detects revision number in filename
  2. Finds matching base document
  3. Moves original to "Historie" subfolder
  4. Places new version in "Actueel" subfolder

**Example**:
- Upload "Schema_VD1234_rev.1.pdf"
- System moves existing "Schema_VD1234.pdf" to Historie
- Places new revision in Actueel folder

### Document Preview & Download

1. **Preview Documents**
   - Click any document card to preview
   - Images: Full image preview
   - PDFs: Embedded PDF viewer
   - Other files: Download option

2. **Download Process**
   - Click download icon on document card
   - Or use download button in preview modal
   - Files download with original filename

---

## Client Management

### Adding New Clients

1. **Navigate to Clients**
   - Click "Klanten" in sidebar
   - Click "Klant toevoegen"

2. **Client Information**
   - **Organisatienaam** (required)
   - **Status**: Actief/Inactief
   - **Bezoekadres**: Street, postcode, city
   - **Afleveradres**: Delivery address (can be different)
   - **Business Info**: BTW-nummer, KvK-nummer

3. **Contact Persons**
   - Add multiple contacts per client
   - **Fields**: First name, last name, email, phone, department, function
   - Use "Contact toevoegen" to add more contacts
   - Remove contacts with trash icon

### CSV Import

1. **Prepare CSV File**
   - Required columns: Organisatienaam
   - Optional columns: Status, addresses, contact info
   - Use exact column names as shown in interface

2. **Import Process**
   - Click "Importeer CSV" button
   - Select your CSV file
   - System validates and imports valid records
   - Shows success message with import count

### Client Details Management

1. **Access Client Details**
   - Click any client row in the table
   - View complete client information

2. **Edit Client Information**
   - Click "Klantgegevens bewerken"
   - Modify any client details
   - Add/remove contact persons
   - Save changes

---

## Service Desk & Notifications

### QR Code Maintenance System

#### Creating Access Codes

1. **Navigate to Access Codes**
   - Go to "Toegangscodes" page
   - Click "Code aanmaken"

2. **Configure Access Code**
   - **Verdeler**: Select specific verdeler (required)
   - **Toegangscode**: 5-digit numeric code (auto-generated)
   - **Vervaldatum**: Set expiration date/time
   - **Maximum gebruik**: Optional usage limit
   - **Status**: Active/inactive

3. **Code Management**
   - View all active codes
   - Track usage statistics
   - Deactivate or reactivate codes
   - Extend expiration dates

#### QR Code Labels

1. **Generate Labels**
   - From verdeler details, click "Print Label"
   - Preview label with QR code
   - QR code links to maintenance report form

2. **Label Contents**
   - Company logo and contact information
   - QR code for maintenance access
   - Verdeler specifications
   - Project information

#### Maintenance Report Process

1. **Scan QR Code**
   - Maintenance personnel scan verdeler QR code
   - Opens maintenance report form

2. **Enter Access Code**
   - Enter 5-digit access code
   - System validates code for specific verdeler
   - Grants access to report form

3. **Submit Report**
   - Choose report type: Melding, Werkbon, or Both
   - **Melding**: Maintenance/repair/inspection report
   - **Werkbon**: Work order with hours and materials
   - **Both**: Combined report with all information

4. **Werkbon Features**
   - Time tracking (start/end times)
   - Material usage with costs
   - Photo documentation
   - **Client signature required**
   - Automatic PDF generation

### Notification Management

1. **View Notifications**
   - Go to "Meldingen" page
   - See all maintenance requests and work orders

2. **Notification Details**
   - **Status Management**: Pending → In Progress → Completed
   - **Priority Levels**: Low, Medium, High
   - **Type Indicators**: Maintenance, Repair, Inspection, Werkbon
   - **Photo Gallery**: View uploaded photos
   - **Comments System**: Add internal comments
   - **Activity Log**: Track all status changes

3. **Werkbon Management**
   - Download PDF work orders
   - View client signatures
   - Track material costs
   - Export for billing

---

## Business Intelligence

### Analytics Dashboard

1. **Access Insights**
   - Click "Inzichten" in sidebar
   - View comprehensive business analytics

2. **KPI Overview**
   - **Total Projects**: All projects in system
   - **Active Projects**: Currently in progress
   - **Total Clients**: Client count
   - **Verdelers**: Total distributor count
   - **Monthly Growth**: New additions this month

3. **Interactive Charts**
   - **Monthly Trends**: Area chart showing growth over time
   - **Project Status Distribution**: Pie chart of project statuses
   - **Monthly Activity**: Bar chart of monthly activity
   - **Growth Metrics**: Progress bars for key metrics

### Filtering & Analysis

1. **Time Range Filters**
   - Quick selections: This month, quarter, 6 months, year
   - Custom date range selection
   - Real-time chart updates

2. **Client Filtering**
   - Filter all data by specific client
   - Client-specific performance metrics
   - Comparative analysis

3. **Export Capabilities**
   - **PDF Reports**: Comprehensive business reports
   - **Chart Export**: High-quality chart images
   - **Data Tables**: Monthly statistics
   - **Professional Formatting**: Company branding

### Report Generation

1. **Generate PDF Report**
   - Click "Rapport Genereren"
   - System captures current charts and data
   - Creates professional PDF with:
     - Executive summary
     - KPI overview
     - Chart visualizations
     - Monthly data tables
     - Company branding

2. **Report Contents**
   - Business performance overview
   - Growth trends and analysis
   - Project completion rates
   - Client activity metrics
   - Time-based comparisons

---

## User Management

### User Roles & Permissions

#### Role-Based Access Control

Each role has specific permissions across system modules:

**Permission Types**:
- **Create**: Add new records
- **Read**: View existing data
- **Update**: Modify records
- **Delete**: Remove records
- **Approve**: Approve workflows
- **Configure**: System settings
- **Export**: Download reports
- **Assign**: Assign to others

#### Location-Based Access

Users can be restricted to specific locations:
- **Leerdam**: Only see Leerdam projects
- **Naaldwijk**: Only see Naaldwijk projects  
- **Rotterdam**: Only see Rotterdam projects
- **All Locations**: Full access (default for admins)

### Creating Users

1. **Navigate to User Management**
   - Click "Gebruikers" (admin only)
   - Click "Gebruiker toevoegen"

2. **Basic Information**
   - **Gebruikersnaam** (required): Unique username
   - **E-mail** (required): Valid email address
   - **Wachtwoord** (required): Secure password
   - **Bevestig wachtwoord**: Password confirmation

3. **Role Assignment**
   - Select from available roles
   - View role description and permissions
   - Option for custom permissions

4. **Location Access**
   - Select specific locations or "Alle locaties"
   - Affects which projects user can see
   - Critical for multi-location operations

5. **Custom Permissions** (optional)
   - Enable "Aangepaste permissies"
   - Granular control over each module
   - Override role-based defaults

### User Management Actions

1. **Edit Users**
   - Modify user details and permissions
   - Change passwords
   - Update location access
   - Modify role assignments

2. **User Status**
   - **Block Users**: Prevent login access
   - **Unblock Users**: Restore access
   - **Delete Users**: Permanently remove

3. **Permission Auditing**
   - Track permission changes
   - Monitor user activity
   - Security compliance

---

## Advanced Features

### Client Portal System

#### Automatic Portal Creation

1. **Trigger**: Project status changes to "Levering"
2. **Process**:
   - System generates 6-digit access code
   - Creates secure portal URL
   - Sets 30-day expiration
   - Links to project and verdelers

#### Portal Features

1. **Client Access**
   - Secure login with access code
   - Project overview and status
   - Verdeler specifications
   - Document downloads (limited folders)

2. **Portal Management**
   - View all active portals
   - Track access statistics
   - Extend expiration dates
   - Deactivate completed projects

### Production Tracking

1. **Work Entry Registration**
   - Track hours per verdeler
   - Record materials used
   - Photo documentation
   - Worker assignment

2. **Production Analytics**
   - Total hours per project
   - Material cost tracking
   - Worker productivity stats
   - Verdeler progress monitoring

### Real-Time Collaboration

1. **Project Locking**
   - Automatic lock when editing
   - Real-time lock status updates
   - Prevent concurrent editing conflicts
   - Admin force-unlock capability

2. **Live Notifications**
   - Browser notifications for new maintenance requests
   - Real-time status updates
   - Activity monitoring

---

## Troubleshooting

### Common Issues

#### Login Problems

**Issue**: Cannot log in
**Solutions**:
1. Check username/password spelling
2. Ensure account is not blocked
3. Try default admin accounts
4. Clear browser cache
5. Check internet connection

#### Document Upload Issues

**Issue**: Files won't upload
**Solutions**:
1. Check file size (max 5MB)
2. Verify file format is supported
3. Ensure stable internet connection
4. Try uploading one file at a time
5. Clear browser cache

#### Testing Workflow Problems

**Issue**: Test data not saving
**Solutions**:
1. Complete all required fields
2. Check browser localStorage availability
3. Ensure stable connection
4. Try refreshing page and re-entering data

#### Permission Errors

**Issue**: "Access denied" messages
**Solutions**:
1. Check user role and permissions
2. Contact admin for permission updates
3. Verify location access settings
4. Log out and log back in

### Database Connection Issues

**Issue**: "Database connection failed"
**Solutions**:
1. Check internet connectivity
2. Verify Supabase configuration
3. Contact system administrator
4. System falls back to localStorage

### Performance Optimization

1. **Large Projects**
   - System automatically paginates large datasets
   - Use search filters to narrow results
   - Close unused browser tabs

2. **File Management**
   - Regularly clean up old documents
   - Use revision management for updated files
   - Compress images before upload

### Browser Compatibility

**Recommended Browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features**:
- JavaScript enabled
- LocalStorage available
- Modern CSS support
- File API support

---

## Best Practices

### Project Management

1. **Consistent Naming**
   - Use descriptive project names
   - Follow location-based numbering
   - Maintain consistent verdeler naming

2. **Status Updates**
   - Update project status regularly
   - Use comments for status changes
   - Coordinate with team members

3. **Documentation**
   - Upload documents as work progresses
   - Use proper folder organization
   - Implement revision control

### Testing Procedures

1. **Sequential Testing**
   - Complete workshop checklist first
   - Perform FAT before high voltage testing
   - Finish all tests before delivery

2. **Quality Control**
   - Document all test failures
   - Require approval for conditional passes
   - Maintain test equipment calibration

3. **Documentation**
   - Generate PDFs for all completed tests
   - Store certificates in proper folders
   - Provide copies to clients

### Security Guidelines

1. **Access Management**
   - Use strong passwords
   - Regularly review user permissions
   - Deactivate unused accounts

2. **Data Protection**
   - Regular backups (automatic)
   - Secure client information
   - Proper access code management

3. **Audit Trail**
   - Monitor user activities
   - Track permission changes
   - Review access logs

---

## Quick Reference

### Keyboard Shortcuts

- **Ctrl + S**: Save current form (where applicable)
- **Esc**: Close modals and forms
- **Enter**: Submit forms
- **Tab**: Navigate between form fields

### Status Indicators

**Project Statuses**:
- 🔵 **Intake**: Initial project phase
- 🟡 **Offerte**: Quote preparation
- 🔵 **Order**: Order confirmed
- 🟣 **Productie**: Manufacturing phase
- 🟡 **Testen**: Quality testing phase
- 🟢 **Levering**: Ready for delivery
- 🟢 **Opgeleverd**: Project completed
- 🔴 **Verloren**: Project cancelled

**User Roles**:
- 🛡️ **Admin**: Full system access
- 👤 **Standard User**: Regular operations
- ✅ **Tester**: Quality assurance
- 🎧 **Servicedesk**: Customer support
- 📅 **Planner**: Project planning
- 👑 **Projectleider**: Project leadership
- 📦 **Magazijn**: Inventory management
- 🚛 **Logistiek**: Transport coordination
- 🔧 **Montage**: Assembly work
- 💰 **Finance**: Financial administration

### File Size Limits

- **Documents**: 5MB maximum
- **Photos**: 5MB maximum
- **Profile Pictures**: 5MB maximum
- **Supported Formats**: JPG, PNG, PDF, DOC, DOCX, XLS, XLSX

### Contact Information

**Technical Support**:
- **Email**: tech@processimprovement.nl
- **Phone**: +31 85 760 76 27
- **Emergency**: +31 (0)6 52 44 70 27 (24/7)

**Company Information**:
- **Process Improvement B.V.**
- **Address**: Twentehaven 2, 3433 PT Nieuwegein
- **Website**: processimprovement.nl

---

*© 2025 Process Improvement B.V. - EWP Management System User Guide v1.0*