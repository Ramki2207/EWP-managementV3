# EWP Management System - Quick Reference Guide

## Navigation Quick Reference

### Main Menu
| Icon | Page | Purpose | Admin Only |
|------|------|---------|------------|
| 🏠 | Dashboard | KPIs and overview | No |
| 📁 | Projecten | Project management | No |
| 🖥️ | Verdelers | Distributor management | No |
| 🏢 | Klanten | Client management | No |
| 🔔 | Meldingen | Service desk notifications | No |
| 📤 | Uploads | Document management | No |
| 👥 | Gebruikers | User management | Yes |
| 🔑 | Toegangscodes | QR access codes | No |
| 🌐 | Klant Portals | Customer portals | No |
| 📊 | Inzichten | Business intelligence | No |

---

## Project Status Flow

```
Intake → Offerte → Order → Productie → Testen → Levering → Opgeleverd
```

### Status Colors
- 🔵 **Intake**: Blue - Initial project phase
- 🟡 **Offerte**: Yellow - Quote preparation
- 🔵 **Order**: Blue - Order confirmed
- 🟣 **Productie**: Purple - Manufacturing
- 🟡 **Testen**: Yellow - Quality testing
- 🟢 **Levering**: Green - Ready for delivery
- 🟢 **Opgeleverd**: Green - Completed
- 🔴 **Verloren**: Red - Cancelled

---

## User Roles & Permissions

### Role Overview
| Role | Icon | Access Level | Key Permissions |
|------|------|--------------|-----------------|
| Admin | 🛡️ | Full System | All modules, user management |
| Standard User | 👤 | Business Ops | Projects, verdelers, clients, documents |
| Tester | ✅ | Quality Focus | Testing workflows, limited project access |
| Servicedesk | 🎧 | Support Focus | Notifications, access codes |
| Planner | 📅 | Planning | Project planning, resource management |
| Projectleider | 👑 | Project Lead | Full project control, team coordination |
| Magazijn | 📦 | Inventory | Material management, limited access |
| Logistiek | 🚛 | Transport | Delivery coordination, logistics |
| Montage | 🔧 | Assembly | Production work, assembly tasks |
| Finance | 💰 | Financial | Financial admin, reporting |

### Permission Types
- **Create**: ➕ Add new records
- **Read**: 👁️ View existing data
- **Update**: ✏️ Modify records
- **Delete**: 🗑️ Remove records
- **Approve**: ✅ Approve workflows
- **Configure**: ⚙️ System settings
- **Export**: 📥 Download reports
- **Assign**: 👥 Assign to others

---

## Testing Workflow Quick Guide

### 4-Stage Testing Process

#### 1. Workshop Checklist (54 items)
**Access**: Verdeler details → "Verdeler testen"
**Categories**: 9 categories from Goederenstroom to Diversen
**Completion**: All items + Inspection Report
**Output**: PDF checklist report

#### 2. Factory Acceptance Test (96 items)
**Access**: Verdeler details → "FAT Test"
**Measurements**: Isolation, continuity, functional, voltage
**Categories**: Algemeen, Railsysteem, Montage, etc.
**Output**: Comprehensive FAT report

#### 3. High Voltage Test (15 items)
**Access**: Verdeler details → "Hoogspanning test"
**Parameters**: Test voltage, duration, environment
**Focus**: Electrical safety and insulation
**Output**: HV test certificate

#### 4. On-Site Test (20 items)
**Access**: Verdeler details → "Test op locatie"
**Location**: Customer installation site
**Focus**: Installation and commissioning
**Output**: Installation verification report

### Test Status Indicators
- ⚪ **Niet getest**: No testing completed
- 🔵 **Checklist Voltooid**: Workshop checklist done
- 🟡 **FAT Voltooid**: Factory test completed
- 🟠 **HV Test Voltooid**: High voltage test done
- 🟢 **Goedgekeurd**: Fully approved
- 🟡 **Voorwaardelijk**: Conditionally approved
- 🔴 **Afgekeurd**: Rejected

---

## Document Management Quick Guide

### Folder Structure
```
📁 Verdeler aanzicht (photos, views)
📁 Test certificaat (test reports) *
📁 Algemene informatie (general docs)
📁 Installatie schema (wiring diagrams) *
📁 Onderdelen (component specs)
📁 Handleidingen (manuals)
📁 Documentatie (general docs)
📁 Oplever foto's (delivery photos)

* = Revision management enabled
```

### Upload Methods
1. **Drag & Drop**: Drag files to upload area
2. **Click Upload**: Click area to browse files
3. **Multiple Files**: Upload several files at once

### File Limits
- **Maximum Size**: 5MB per file
- **Formats**: JPG, PNG, PDF, DOC, DOCX, XLS, XLSX
- **Storage**: Base64 in database

### Revision Management
- **Trigger**: Files with "rev.1", "rev.2" in name
- **Process**: Old version → Historie, New version → Actueel
- **Folders**: Verdeler aanzicht, Test certificaat, Installatie schema

---

## Access Code System

### QR Code Workflow

#### 1. Generate Access Code
**Location**: Toegangscodes → "Code aanmaken"
**Settings**:
- **Code**: 5-digit numeric (auto-generated)
- **Verdeler**: Specific verdeler selection
- **Expiration**: Date/time limit
- **Usage**: Optional usage limit

#### 2. Print QR Label
**Location**: Verdeler details → "Print Label"
**Contents**:
- Company logo and contact info
- QR code linking to maintenance form
- Verdeler technical specifications
- Project information

#### 3. Maintenance Access
**Process**:
1. Scan QR code on verdeler
2. Enter 5-digit access code
3. Submit maintenance report
4. System creates notification

### Access Code Management
- **Active Codes**: Green indicator, usage tracking
- **Expired Codes**: Red indicator, reactivation option
- **Usage Stats**: Track access frequency
- **Security**: Verdeler-specific validation

---

## Client Portal System

### Portal Creation
**Trigger**: Project status changes to "Levering"
**Process**:
1. System generates 6-digit access code
2. Creates secure portal URL
3. Sets 30-day expiration
4. Prepares delivery notification

### Portal Features
**Client Access**:
- Secure login with access code
- Project overview and status
- Verdeler specifications
- Document downloads (limited folders)
- Test certificate access

**Management**:
- Track portal usage
- Monitor document downloads
- Extend expiration dates
- Deactivate completed projects

---

## Keyboard Shortcuts

### General Navigation
- **Ctrl + S**: Save current form
- **Esc**: Close modals and forms
- **Enter**: Submit forms
- **Tab**: Navigate form fields
- **Shift + Tab**: Navigate backwards

### Testing Shortcuts
- **Space**: Toggle pass/fail in tests
- **Enter**: Move to next test item
- **Ctrl + Enter**: Complete test section

---

## Common Tasks Quick Steps

### Create New Project
1. Projecten → "Project toevoegen"
2. Fill details (location auto-generates project number)
3. Add verdelers with specifications
4. Upload initial documents
5. Save project

### Complete Verdeler Testing
1. Verdeler details → "Verdeler testen"
2. Complete 54 workshop items
3. Fill inspection report
4. "FAT Test" → Complete 96 items
5. "Hoogspanning test" → Complete safety checks
6. Generate final PDF reports

### Generate Client Portal
1. Open project details
2. Change status to "Levering"
3. Click "Genereer Notificatie"
4. Set delivery date (optional)
5. Send notification to client

### Create Maintenance Access
1. Toegangscodes → "Code aanmaken"
2. Select verdeler
3. Set expiration date
4. Generate 5-digit code
5. Print QR label

### Process Maintenance Request
1. Meldingen → View notification
2. Review details and photos
3. Update status as needed
4. Add comments
5. Download PDF if werkbon

---

## File Size & Format Reference

### Supported Formats
| Type | Extensions | Max Size | Notes |
|------|------------|----------|-------|
| Images | JPG, PNG, GIF | 5MB | Auto-preview |
| Documents | PDF | 5MB | Embedded viewer |
| Office | DOC, DOCX, XLS, XLSX | 5MB | Download only |
| Other | TXT, CSV | 5MB | Download only |

### Storage Information
- **Method**: Base64 encoding in database
- **Backup**: Automatic with database backups
- **Access**: Role-based permissions
- **Retention**: Permanent (manual cleanup)

---

## Error Messages & Solutions

### Common Error Messages

**"Database connection failed"**
- Check internet connection
- Verify Supabase configuration
- System falls back to localStorage

**"Access denied"**
- Check user permissions
- Verify role assignments
- Contact administrator

**"Project wordt bewerkt door [user]"**
- Project is locked by another user
- Wait for lock to expire (5 minutes)
- Admin can force unlock

**"File too large"**
- Reduce file size below 5MB
- Compress images
- Split large documents

**"Invalid access code"**
- Check code spelling
- Verify code hasn't expired
- Ensure code is for correct verdeler

---

## Contact Information

### Technical Support
- **Email**: tech@processimprovement.nl
- **Phone**: +31 85 760 76 27
- **Emergency**: +31 (0)6 52 44 70 27 (24/7)

### Company Information
- **Process Improvement B.V.**
- **Address**: Twentehaven 2, 3433 PT Nieuwegein
- **Website**: processimprovement.nl
- **KvK**: 87610477
- **BTW**: NL8643.47.388.B01

---

## System Status Indicators

### Project Indicators
- 🔒 **Locked**: Project being edited by user
- ⏰ **Stale Lock**: Inactive lock (>3 minutes)
- ✅ **Available**: Ready for editing
- 🔄 **Syncing**: Data synchronization in progress

### User Status
- 🟢 **Active**: User can log in
- 🔴 **Blocked**: Login disabled
- 👤 **Online**: Currently active
- ⏰ **Idle**: Inactive session

### System Status
- 🟢 **Online**: Full functionality
- 🟡 **Offline**: localStorage mode
- 🔴 **Error**: System issues
- 🔄 **Syncing**: Data synchronization

---

*Quick Reference Guide v1.0 - © 2025 Process Improvement B.V.*