# EWP Management System - Complete Technical Documentation

## System Overview

The EWP Management System is a comprehensive web application built for electrical panel manufacturing and project management. It's designed to handle the complete lifecycle of electrical distribution projects from initial intake to final delivery.

## Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for styling with custom design system
- **Vite** as the build tool and development server
- **React Router** for client-side routing
- **Lucide React** for consistent iconography

### Backend & Database
- **Supabase** (PostgreSQL) as the primary database
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates
- **Edge functions** for serverless operations

### Key Libraries
- **bcryptjs** for password hashing
- **jsPDF** for PDF generation
- **html2canvas** for capturing UI elements
- **react-hot-toast** for notifications
- **recharts** for data visualization
- **qrcode.react** for QR code generation
- **papaparse** for CSV processing

## Database Schema

### Core Tables

1. **users** - User authentication and permissions
   - id (uuid, primary key)
   - username, email, password (hashed)
   - role (admin/user)
   - permissions (jsonb for granular access control)

2. **projects** - Main project entities
   - id (uuid, primary key)
   - project_number (unique identifier)
   - date, location, client, status, description
   - intake_form (jsonb for complex form data)

3. **distributors** - Electrical distribution panels
   - id (uuid, primary key)
   - distributor_id (text identifier like "VD8996")
   - project_id (foreign key to projects)
   - Technical specs: kast_naam, systeem, voeding, bouwjaar
   - Test data: keuring_datum, getest_door, un_in_v, in_in_a, etc.

4. **clients** - Customer information
   - id (uuid, primary key)
   - name, status
   - Address fields: visit_street, visit_postcode, visit_city
   - Delivery address: delivery_street, delivery_postcode, delivery_city
   - Business info: vat_number, kvk_number

5. **contacts** - Client contact persons
   - id (uuid, primary key)
   - client_id (foreign key to clients)
   - first_name, last_name, email, phone, department, function

6. **documents** - File management system
   - id (uuid, primary key)
   - project_id, distributor_id (foreign keys)
   - folder (organization system)
   - name, type, size, content (base64 encoded)

7. **test_data** - Test results storage
   - id (uuid, primary key)
   - distributor_id (foreign key)
   - test_type, data (jsonb for flexible test data)

8. **work_entries** - Time tracking
   - id (uuid, primary key)
   - distributor_id, worker_id (foreign keys)
   - date, hours, status, notes

9. **notifications** - Service desk system
   - id (uuid, primary key)
   - verdeler_id, project_number, kast_naam
   - type (maintenance/repair/inspection)
   - status, description, worker_name, photos

10. **access_codes** - QR code access system
    - id (uuid, primary key)
    - code (5-digit numeric)
    - created_by, expires_at, is_active
    - usage_count, max_uses
    - verdeler_id, project_number (for scoped access)

11. **client_portals** - Customer access portals
    - id (uuid, primary key)
    - project_id, client_id (foreign keys)
    - access_code, portal_url, expires_at
    - delivery_status, email_sent, access_count

12. **project_locks** - Concurrent editing protection
    - id (uuid, primary key)
    - project_id, user_id (foreign keys)
    - username, locked_at, last_activity, is_active

## Key Features & Functionality

### 1. Project Management
- **Project Creation Wizard**: Multi-step process (Details → Verdelers → Documents)
- **Project Lifecycle**: Intake → Offerte → Order → Testen → Levering → Opgeleverd
- **Real-time Locking**: Prevents concurrent editing conflicts
- **Intake Forms**: Complex JSONB storage for detailed project specifications

### 2. Distributor (Verdeler) Management
- **Technical Specifications**: Voltage, amperage, frequency, manufacturer details
- **Testing Workflows**: Workshop checklist → FAT → High voltage → On-site testing
- **QR Code Labels**: Printable labels with maintenance access QR codes
- **Status Tracking**: From creation through delivery

### 3. Document Management
- **Hierarchical Organization**: Project → Distributor → Folder structure
- **Default Folders**: 
  - Verdeler aanzicht
  - Test certificaat
  - Algemene informatie
  - Installatie schema
  - Onderdelen
  - Handleidingen
  - Documentatie
  - Oplever foto's
- **File Upload**: Drag & drop, multiple files, 5MB limit
- **Preview System**: Images and PDFs can be previewed
- **Base64 Storage**: Files stored as base64 in database

### 4. Testing System
- **Workshop Checklist**: 18-item checklist for workshop preparation
- **Factory Acceptance Test (FAT)**: 96-item comprehensive test with categories:
  - Algemeen (General)
  - Railsysteem (Rail system)
  - Montage (Assembly)
  - Afscherming (Shielding)
  - Aarding (Grounding)
  - Coderingen (Coding)
  - Instellingen (Settings)
  - Functioneel (Functional)
  - Diversen (Miscellaneous)
- **High Voltage Test**: 15-item safety and test checklist
- **On-Site Test**: 20-item installation and commissioning checklist
- **Inspection Report**: Final approval with pass/fail/conditional results
- **PDF Generation**: Automatic test report PDF creation

### 5. Client Portal System
- **Secure Access**: 6-digit access codes with expiration
- **Project Overview**: Summary of project details and progress
- **Distributor Specifications**: Technical details for each distributor
- **Test Report Downloads**: Automatically generated PDFs from test data
- **Delivery Tracking**: Status updates from preparation to completion

### 6. Access Control & Security
- **Role-Based Access**: Admin vs User roles
- **Granular Permissions**: Page-level read/write permissions
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: localStorage-based with proper cleanup
- **QR Code Access**: Time-limited codes for maintenance reports

### 7. Notification System
- **Service Desk**: Maintenance and repair request management
- **Real-time Updates**: Supabase real-time subscriptions
- **Photo Uploads**: Base64 image storage with maintenance reports
- **Status Tracking**: Pending → In Progress → Completed workflow
- **Priority Levels**: Low, Medium, High priority classification

### 8. Business Intelligence
- **Dashboard Analytics**: KPI cards with project statistics
- **Insights Page**: Comprehensive charts and metrics using Recharts
- **PDF Reports**: Exportable business intelligence reports
- **Time-based Filtering**: Monthly, quarterly, yearly views
- **Client-specific Analytics**: Filter by specific clients

### 9. User Management
- **Multi-user Support**: Multiple users with different access levels
- **Profile Management**: User profiles with photos
- **Permission Assignment**: Granular control over feature access
- **Default Admins**: Pre-configured admin accounts

### 10. Data Migration & Sync
- **localStorage Fallback**: Works offline with localStorage
- **Database Sync**: Automatic migration from localStorage to Supabase
- **Hybrid Storage**: Uses both localStorage and database for reliability

## File Structure

### Core Application Files
- `src/App.tsx` - Main application with routing
- `src/main.tsx` - Application entry point
- `src/index.css` - Global styles and Tailwind configuration

### Pages (Main Views)
- `src/pages/Dashboard.tsx` - Main dashboard with KPIs
- `src/pages/Projects.tsx` - Project listing and management
- `src/pages/ProjectDetails.tsx` - Individual project details
- `src/pages/CreateProject.tsx` - Multi-step project creation
- `src/pages/Verdelers.tsx` - Distributor listing
- `src/pages/VerdelerDetails.tsx` - Individual distributor details
- `src/pages/Clients.tsx` - Client management
- `src/pages/Uploads.tsx` - Document management interface
- `src/pages/Users.tsx` - User management (admin only)
- `src/pages/Insights.tsx` - Business intelligence dashboard
- `src/pages/Meldingen.tsx` - Service desk notifications
- `src/pages/AccessCodes.tsx` - QR code access management
- `src/pages/ClientPortal.tsx` - Customer-facing portal
- `src/pages/MaintenanceReport.tsx` - QR code maintenance form
- `src/pages/Login.tsx` - Authentication

### Components (Reusable UI)
- `src/components/Sidebar.tsx` - Navigation sidebar
- `src/components/DocumentViewer.tsx` - File upload/preview
- `src/components/VerdelerTesting.tsx` - Testing workflow modals
- `src/components/FATTest.tsx` - Factory Acceptance Test
- `src/components/HighVoltageTest.tsx` - High voltage testing
- `src/components/OnSiteTest.tsx` - On-site testing
- `src/components/TestReportViewer.tsx` - Test result display
- `src/components/ProjectLockStatus.tsx` - Lock status indicators
- `src/components/PermissionRoute.tsx` - Access control wrapper

### Services & Utilities
- `src/lib/supabase.ts` - Database service layer
- `src/lib/projectLocks.ts` - Concurrent editing management
- `src/lib/clientPortalService.ts` - Customer portal logic
- `src/lib/notifications.ts` - Browser notification system
- `src/lib/migrateData.ts` - Data migration utilities
- `src/types/index.ts` - TypeScript type definitions

## Data Flow

### Project Creation Flow
1. **Project Details Step**: Basic project information + intake form
2. **Verdelers Step**: Add distributors with technical specifications
3. **Uploads Step**: Upload documents organized by distributor/folder
4. **Database Save**: All data saved atomically to Supabase

### Testing Workflow
1. **Workshop Checklist**: Initial preparation verification
2. **Factory Acceptance Test**: Comprehensive 96-point inspection
3. **High Voltage Test**: Safety and electrical testing
4. **On-Site Test**: Installation and commissioning
5. **Inspection Report**: Final approval/rejection
6. **PDF Generation**: Automatic test report creation

### Client Portal Flow
1. **Project Status Change**: When status becomes "Levering"
2. **Portal Creation**: Automatic portal generation with access code
3. **Email Notification**: Template-based delivery notification
4. **Client Access**: Secure portal with project documents
5. **Test Report Access**: Generated PDFs from completed tests

### Document Organization
```
Project
├── Distributor 1
│   ├── Verdeler aanzicht
│   ├── Test certificaat
│   ├── Algemene informatie
│   ├── Installatie schema
│   ├── Onderdelen
│   ├── Handleidingen
│   ├── Documentatie
│   └── Oplever foto's
└── Distributor 2
    └── [same folder structure]
```

## Security Features

### Authentication
- bcrypt password hashing
- Session management via localStorage
- Role-based access control (admin/user)
- Granular page-level permissions

### Data Protection
- Row Level Security (RLS) on all tables
- Input validation and sanitization
- File size limits (5MB per file)
- Access code expiration and usage limits

### Concurrent Access
- Project locking system prevents editing conflicts
- Real-time lock status updates
- Automatic stale lock cleanup
- Admin force-unlock capability

## API Integration

### Supabase Integration
- Real-time subscriptions for live updates
- Automatic data synchronization
- Edge functions for serverless operations
- Storage for file uploads (when needed)

### External Services
- QR code generation for maintenance access
- PDF generation for reports and certificates
- Email template generation for client notifications

## Development Patterns

### State Management
- React hooks for local state
- localStorage for offline capability
- Supabase for persistent storage
- Real-time subscriptions for live data

### Error Handling
- Comprehensive try-catch blocks
- User-friendly error messages
- Fallback to localStorage when database fails
- Connection testing and retry logic

### Performance Optimization
- Lazy loading for large datasets
- Memoized components to prevent re-renders
- Efficient database queries with proper indexing
- Image optimization and lazy loading

## Deployment

### Build Process
- Vite build system
- TypeScript compilation
- Tailwind CSS processing
- Asset optimization

### Hosting
- Netlify for static hosting
- Environment variables for Supabase connection
- Automatic deployments from repository

## Usage Scenarios

### Daily Operations
1. **Project Manager**: Creates projects, assigns distributors, tracks progress
2. **Workshop Technician**: Completes testing workflows, uploads photos
3. **Quality Inspector**: Reviews test results, approves/rejects distributors
4. **Client**: Accesses portal to view project status and download certificates

### Maintenance Workflow
1. **QR Code Scan**: Maintenance personnel scan distributor QR code
2. **Access Code Entry**: Enter time-limited access code
3. **Report Submission**: Submit maintenance report with photos
4. **Notification**: Automatic notification to management
5. **Status Tracking**: Track resolution through service desk

### Business Intelligence
1. **KPI Monitoring**: Real-time project and distributor statistics
2. **Trend Analysis**: Monthly/quarterly performance charts
3. **Report Generation**: PDF exports for stakeholders
4. **Client Analytics**: Per-client performance metrics

## Configuration

### Environment Variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Default Users
- admin / admin123
- Patrick Herman / Welkom123
- Stefano de Weger / Welkom123
- Lysander koenraadt / Welkom123

### Default Folders
- Verdeler aanzicht
- Test certificaat
- Algemene informatie
- Installatie schema
- Onderdelen
- Handleidingen
- Documentatie
- Oplever foto's

## Key Business Rules

### Project Status Flow
Intake → Offerte → Order → Testen → Levering → Opgeleverd

### Testing Requirements
- Workshop checklist must be completed before FAT
- FAT must pass before high voltage testing
- All tests must be completed before delivery
- Inspection report provides final approval

### Access Control
- Admins have full system access
- Users have configurable page-level permissions
- Project locking prevents concurrent editing
- Access codes provide time-limited external access

### Data Relationships
- Projects can have multiple distributors
- Distributors belong to one project
- Documents are organized by project/distributor/folder
- Clients can have multiple projects
- Test data is linked to specific distributors

## Integration Points

### QR Code System
- Each distributor gets a unique QR code
- QR codes link to maintenance report forms
- Access codes provide time-limited access
- Maintenance reports create notifications

### Client Portal
- Automatic portal creation when project status = "Levering"
- Secure access with 6-digit codes
- Document access and test report downloads
- Delivery status tracking

### PDF Generation
- Test reports from completed testing workflows
- Business intelligence reports with charts
- Maintenance certificates
- Project documentation

## Troubleshooting Common Issues

### Database Connection
- Check Supabase environment variables
- Verify RLS policies are configured
- Test connection with built-in test function

### File Upload Issues
- Check file size limits (5MB max)
- Verify base64 encoding is working
- Check browser storage limits

### Testing Workflow
- Ensure localStorage is available
- Check test data persistence
- Verify PDF generation dependencies

### Real-time Updates
- Check Supabase real-time subscriptions
- Verify WebSocket connections
- Test notification permissions

## Future Enhancement Areas

### Potential Improvements
1. **Email Integration**: Actual SMTP for client notifications
2. **Mobile App**: React Native version for field technicians
3. **Advanced Analytics**: Machine learning for predictive maintenance
4. **Integration APIs**: Connect with ERP/CRM systems
5. **Offline Mode**: Enhanced offline capabilities with sync
6. **Multi-language**: Support for multiple languages
7. **Advanced Reporting**: More sophisticated business intelligence
8. **Workflow Automation**: Automated status transitions
9. **Digital Signatures**: Electronic approval workflows
10. **Asset Management**: Track physical equipment and tools

This system represents a complete digital transformation of electrical panel manufacturing operations, from initial client contact through final delivery and ongoing maintenance support.