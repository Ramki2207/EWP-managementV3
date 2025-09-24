# EWP Management System - Administrator Guide

## System Administration Overview

This guide covers all administrative functions, user management, system configuration, and maintenance procedures for the EWP Management System.

---

## Table of Contents

1. [Initial System Setup](#initial-system-setup)
2. [User Management](#user-management)
3. [Permission System](#permission-system)
4. [Database Management](#database-management)
5. [Security Administration](#security-administration)
6. [System Monitoring](#system-monitoring)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)

---

## Initial System Setup

### First-Time Configuration

#### 1. Database Setup (Supabase)

**Environment Variables Required**:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Database Tables**:
- `users` - User authentication and permissions
- `projects` - Main project entities
- `distributors` - Electrical distribution panels
- `clients` - Customer information
- `contacts` - Client contact persons
- `documents` - File management system
- `test_data` - Test results storage
- `work_entries` - Time tracking
- `notifications` - Service desk system
- `access_codes` - QR code access system
- `client_portals` - Customer access portals
- `project_locks` - Concurrent editing protection

#### 2. Default Admin Accounts

**Pre-configured Accounts**:
- `admin` / `admin123` - System administrator
- `Patrick Herman` / `Welkom123` - EWP admin
- `Stefano de Weger` / `Welkom123` - EWP admin
- `Lysander koenraadt` / `Welkom123` - EWP admin

**First Login Tasks**:
1. Change default passwords
2. Create additional admin accounts
3. Configure user roles
4. Set up location-based access
5. Test all system functions

#### 3. System Configuration

**Location Setup**:
- Configure available locations: Leerdam, Naaldwijk, Rotterdam
- Set up location-based project numbering
- Assign users to specific locations

**Document Folders**:
- Default folder structure is pre-configured
- Can be customized per project requirements
- Revision management enabled for specific folders

---

## User Management

### User Roles & Permissions

#### Available Roles

1. **Admin** - Full system access
   - All modules: Full CRUD + special permissions
   - User management capabilities
   - System configuration access
   - Force-unlock projects
   - Access to all locations

2. **Standard User** - Regular business operations
   - Most modules: CRUD access
   - No user management
   - No system configuration
   - Location-restricted access possible

3. **Tester** - Quality assurance focus
   - Testing modules: Full access
   - Projects: Read-only (only "Testen" status)
   - Verdelers: Update and approve
   - Limited document access

4. **Servicedesk** - Support operations
   - Notifications: Full access
   - Projects/Verdelers: Read-only
   - Access codes: Create and read
   - Limited system access

5. **Specialized Roles**:
   - **Planner**: Project planning and resource management
   - **Projectleider**: Full project responsibility
   - **Magazijn**: Inventory and material management
   - **Logistiek**: Transport and delivery coordination
   - **Montage**: Assembly and production work
   - **Finance**: Financial administration

### Creating Users

#### Standard User Creation

1. **Navigate to User Management**
   - Click "Gebruikers" in sidebar
   - Click "Gebruiker toevoegen"

2. **Basic Information**
   ```
   Username: john.doe
   Email: john.doe@company.com
   Password: SecurePassword123
   Role: standard_user
   ```

3. **Location Assignment**
   - Select specific locations or "All locations"
   - Affects project visibility
   - Critical for multi-site operations

4. **Permission Configuration**
   - Use role-based permissions (recommended)
   - Or enable custom permissions for granular control

#### Advanced User Configuration

**Custom Permissions Example**:
```json
{
  "projects": { "create": true, "read": true, "update": true, "delete": false },
  "verdelers": { "create": true, "read": true, "update": true, "delete": false },
  "testing": { "create": false, "read": true, "update": false, "delete": false },
  "insights": { "create": false, "read": true, "update": false, "export": true }
}
```

**Location Restrictions**:
- **All Locations**: Full access (default for admins)
- **Specific Locations**: ["Leerdam", "Rotterdam"]
- **Single Location**: ["Naaldwijk"]

### User Management Operations

#### Editing Users

1. **Access User Details**
   - Click edit icon on user row
   - Modify any user information
   - Change roles and permissions
   - Update location access

2. **Password Management**
   - Leave password fields empty to keep current password
   - Require password confirmation for changes
   - Passwords automatically hashed with bcrypt

3. **Permission Updates**
   - Role changes automatically update permissions
   - Custom permissions override role defaults
   - Changes take effect immediately

#### User Status Management

**Blocking Users**:
1. Click block icon (X) on user row
2. Confirm blocking action
3. User cannot log in while blocked
4. Existing sessions remain active until logout

**Unblocking Users**:
1. Click unblock icon (✓) on blocked user
2. Confirm unblocking action
3. User can log in immediately

**Deleting Users**:
1. Click delete icon (trash) on user row
2. Confirm deletion (permanent action)
3. User data removed from system
4. Cannot be undone

---

## Permission System

### Role-Based Access Control (RBAC)

#### Permission Types

Each module has 8 permission types:
- **Create**: Add new records
- **Read**: View existing data
- **Update**: Modify records
- **Delete**: Remove records
- **Approve**: Approve workflows
- **Configure**: System settings
- **Export**: Download reports
- **Assign**: Assign to others

#### Module Permissions

**System Modules**:
- `dashboard` - Main dashboard and KPIs
- `projects` - Project management
- `verdelers` - Distributor management
- `clients` - Client information
- `uploads` - Document management
- `testing` - Testing workflows
- `meldingen` - Service desk notifications
- `gebruikers` - User management
- `access_codes` - QR code management
- `client_portals` - Customer portals
- `insights` - Business intelligence
- `account` - Personal account management

#### Permission Matrix Examples

**Admin Role**:
```json
{
  "projects": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true },
  "verdelers": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true },
  "testing": { "create": true, "read": true, "update": true, "delete": true, "approve": true, "configure": true, "export": true, "assign": true }
}
```

**Tester Role**:
```json
{
  "projects": { "create": false, "read": true, "update": false, "delete": false, "approve": false, "configure": false, "export": false, "assign": false },
  "verdelers": { "create": false, "read": true, "update": true, "delete": false, "approve": true, "configure": false, "export": true, "assign": false },
  "testing": { "create": true, "read": true, "update": true, "delete": false, "approve": true, "configure": true, "export": true, "assign": true }
}
```

### Location-Based Access

#### Configuration

**Available Locations**:
- Leerdam (PM prefix)
- Naaldwijk (PD prefix)
- Rotterdam (PR prefix)

**Access Levels**:
- **All Locations**: See all projects regardless of location
- **Specific Locations**: Only see projects from assigned locations
- **No Restrictions**: Legacy users (see all projects)

#### Implementation

**User Assignment**:
```javascript
user.assignedLocations = ["Leerdam", "Rotterdam"]; // User sees only these locations
user.assignedLocations = []; // User sees all projects (legacy)
```

**Project Filtering**:
- Projects without location: Visible to all users
- Projects with location: Only visible to users with access
- Admins: Always see all projects

---

## Database Management

### Data Structure

#### Core Relationships

```
Projects (1) → (Many) Distributors
Projects (1) → (Many) Documents
Distributors (1) → (Many) Documents
Distributors (1) → (Many) Test_Data
Clients (1) → (Many) Projects
Clients (1) → (Many) Contacts
```

#### Data Flow

1. **Project Creation**:
   - Project record created
   - Distributors linked to project
   - Documents organized by project/distributor/folder

2. **Testing Process**:
   - Test data stored in localStorage
   - PDF reports generated and saved to documents
   - Status updates tracked

3. **Client Portal**:
   - Portal created when status = "Levering"
   - Access codes generated
   - Document access controlled

### Database Maintenance

#### Regular Tasks

**Daily**:
- Monitor active project locks
- Clean up expired access codes
- Check system performance

**Weekly**:
- Review user activity logs
- Clean up old document revisions
- Monitor storage usage

**Monthly**:
- Generate backup reports
- Review permission changes
- Audit user access patterns

#### Data Migration

**localStorage to Supabase**:
- Automatic migration on first login
- Preserves all existing data
- Maintains data integrity
- Provides fallback capability

**Migration Process**:
1. System detects localStorage data
2. Prompts for migration during login
3. Transfers all projects, distributors, clients
4. Maintains relationships and references
5. Clears localStorage after successful migration

---

## Security Administration

### Access Control

#### Authentication

**Password Requirements**:
- Minimum 8 characters (recommended)
- bcrypt hashing with salt rounds
- No password expiration (configurable)
- Account lockout after failed attempts

**Session Management**:
- localStorage-based sessions
- No automatic timeout (user-controlled)
- Secure session data storage
- Proper cleanup on logout

#### Authorization

**Permission Validation**:
- Frontend checks for user experience
- Backend RLS policies for data security
- Multi-layer validation
- Audit logging for all actions

**Project Locking**:
- Automatic lock on project access
- 5-minute inactivity timeout
- Real-time lock status updates
- Admin force-unlock capability

### Security Monitoring

#### Audit Logging

**Tracked Activities**:
- User login/logout events
- Permission changes
- Project access and modifications
- Document uploads and downloads
- Test completions and approvals

**Log Analysis**:
- Review unusual access patterns
- Monitor failed login attempts
- Track permission escalations
- Identify security anomalies

#### Access Code Security

**QR Code Management**:
- Time-limited access codes
- Verdeler-specific restrictions
- Usage tracking and limits
- Automatic expiration

**Best Practices**:
- Regular code rotation
- Monitor usage patterns
- Deactivate unused codes
- Audit maintenance access

---

## System Monitoring

### Performance Monitoring

#### Key Metrics

**System Performance**:
- Page load times
- Database query performance
- Document upload speeds
- User session activity

**Business Metrics**:
- Project completion rates
- Testing throughput
- User activity levels
- Document storage usage

#### Health Checks

**Daily Monitoring**:
- Database connectivity
- User login success rates
- Document upload success
- Test completion rates

**Weekly Reviews**:
- Performance trends
- Error rate analysis
- User feedback review
- System capacity planning

### Real-Time Monitoring

#### Live Activity

**Project Locks**:
- Monitor active project locks
- Track user collaboration
- Identify stale locks
- Resolve conflicts

**User Activity**:
- Track concurrent users
- Monitor session durations
- Identify inactive accounts
- Plan capacity requirements

#### Notification System

**Browser Notifications**:
- New maintenance requests
- System alerts
- User activity updates
- Performance warnings

---

## Backup & Recovery

### Data Protection

#### Automatic Backups

**Supabase Backups**:
- Daily automatic backups
- Point-in-time recovery
- Geographic redundancy
- Automated retention policies

**localStorage Backup**:
- Client-side data persistence
- Offline capability
- Automatic sync when online
- Data integrity verification

#### Manual Backup Procedures

**Export Functions**:
1. **Business Intelligence Reports**
   - Generate comprehensive PDF reports
   - Export chart data
   - Save monthly statistics
   - Archive historical data

2. **Document Exports**
   - Bulk document downloads
   - Project-specific exports
   - Test certificate packages
   - Client delivery packages

### Disaster Recovery

#### Recovery Procedures

**Database Failure**:
1. System automatically falls back to localStorage
2. Users can continue working offline
3. Data syncs when database restored
4. No data loss during outage

**Complete System Failure**:
1. Restore from Supabase backups
2. Verify data integrity
3. Test all system functions
4. Notify users of restoration

**Data Corruption**:
1. Identify affected records
2. Restore from backup
3. Verify user data integrity
4. Communicate with affected users

---

## System Configuration

### Environment Configuration

#### Production Settings

**Supabase Configuration**:
```javascript
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Security Settings**:
- Row Level Security (RLS) enabled
- API rate limiting configured
- CORS policies set
- SSL/TLS encryption enforced

#### Development Settings

**Local Development**:
```javascript
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=local-dev-key
```

**Testing Configuration**:
- Separate test database
- Mock data generation
- Performance testing tools
- Debug logging enabled

### Feature Configuration

#### Document Management

**File Restrictions**:
- Maximum file size: 5MB
- Allowed formats: Images, PDFs, Office documents
- Storage: Base64 in database
- Revision management: Enabled for specific folders

**Folder Structure**:
```
Project/
├── Verdeler/
│   ├── Verdeler aanzicht/
│   ├── Test certificaat/
│   │   ├── Actueel/
│   │   └── Historie/
│   ├── Algemene informatie/
│   ├── Installatie schema/
│   │   ├── Actueel/
│   │   └── Historie/
│   └── [other folders]/
```

#### Testing Configuration

**Test Workflows**:
- Workshop Checklist: 54 items across 9 categories
- Factory Acceptance Test: 96 items across 9 categories
- High Voltage Test: 15 safety items
- On-Site Test: 20 installation items
- Inspection Report: 4 final approval items

**PDF Generation**:
- Automatic report generation
- Company branding included
- Professional formatting
- Saved to appropriate folders

---

## Advanced Administration

### Project Lock Management

#### Lock Configuration

**Settings**:
- Lock timeout: 5 minutes of inactivity
- Heartbeat interval: 15 seconds
- Cleanup frequency: 10 seconds
- Force unlock: Admin only

**Monitoring**:
```javascript
// Debug lock status
window.debugLocks(); // Available in browser console
```

#### Lock Administration

**Force Unlock Projects**:
1. Navigate to Projects page
2. Identify locked project
3. Click force unlock (admin only)
4. Confirm action
5. Lock immediately released

**Stale Lock Cleanup**:
- Automatic cleanup every 10 seconds
- Removes locks older than 5 minutes
- Notifies all users of changes
- Maintains system performance

### Access Code Management

#### Code Administration

**Global Code Management**:
1. Navigate to "Toegangscodes"
2. View all active codes
3. Monitor usage statistics
4. Deactivate expired codes

**Bulk Operations**:
- Extend multiple code expiration dates
- Deactivate codes by project
- Generate usage reports
- Clean up unused codes

#### Security Policies

**Code Generation**:
- 5-digit numeric codes
- Cryptographically secure random generation
- Verdeler-specific validation
- Time-limited access

**Usage Monitoring**:
- Track code usage frequency
- Monitor access patterns
- Identify suspicious activity
- Generate security reports

### Client Portal Administration

#### Portal Management

**Portal Lifecycle**:
1. **Creation**: Automatic when project status = "Levering"
2. **Activation**: 30-day default expiration
3. **Usage**: Track client access patterns
4. **Deactivation**: Manual or automatic expiration

**Portal Configuration**:
```javascript
{
  access_code: "6-digit-code",
  expires_at: "30 days from creation",
  delivery_status: "preparing|ready|in_transit|delivered|completed",
  document_access: ["Verdeler aanzicht", "Test certificaat", "Installatie schema"]
}
```

#### Portal Security

**Access Control**:
- Unique access codes per portal
- Time-limited access
- Usage tracking and limits
- Secure document access

**Monitoring**:
- Track portal access frequency
- Monitor document downloads
- Identify inactive portals
- Generate usage reports

---

## System Maintenance

### Regular Maintenance Tasks

#### Daily Tasks

**System Health**:
- [ ] Check database connectivity
- [ ] Monitor user login success rates
- [ ] Review error logs
- [ ] Verify backup completion

**User Management**:
- [ ] Review new user requests
- [ ] Process permission changes
- [ ] Monitor user activity
- [ ] Handle support requests

#### Weekly Tasks

**Performance Review**:
- [ ] Analyze system performance metrics
- [ ] Review slow queries
- [ ] Monitor storage usage
- [ ] Check document upload success rates

**Security Review**:
- [ ] Review access logs
- [ ] Monitor failed login attempts
- [ ] Check permission changes
- [ ] Audit access code usage

#### Monthly Tasks

**Data Management**:
- [ ] Clean up old document revisions
- [ ] Archive completed projects
- [ ] Review storage usage
- [ ] Generate backup reports

**User Review**:
- [ ] Review inactive users
- [ ] Update user permissions
- [ ] Process role changes
- [ ] Generate user activity reports

### Performance Optimization

#### Database Optimization

**Query Performance**:
- Monitor slow queries
- Optimize database indexes
- Review RLS policy performance
- Implement query caching

**Storage Management**:
- Monitor document storage usage
- Implement compression for large files
- Archive old documents
- Clean up unused files

#### Frontend Optimization

**Performance Monitoring**:
- Page load times
- Component render performance
- Memory usage patterns
- Network request efficiency

**Optimization Strategies**:
- Implement lazy loading
- Optimize image sizes
- Cache frequently accessed data
- Minimize bundle sizes

---

## Troubleshooting

### Common Issues

#### User Access Problems

**Issue**: User cannot log in
**Diagnosis**:
1. Check if account is blocked
2. Verify password correctness
3. Check database connectivity
4. Review error logs

**Solutions**:
1. Unblock user account
2. Reset user password
3. Check system status
4. Contact technical support

#### Permission Issues

**Issue**: User sees "Access denied"
**Diagnosis**:
1. Check user role and permissions
2. Verify location access settings
3. Review module permissions
4. Check for recent permission changes

**Solutions**:
1. Update user permissions
2. Assign correct locations
3. Change user role if needed
4. Force permission refresh (page reload)

#### Project Lock Issues

**Issue**: Project permanently locked
**Diagnosis**:
1. Check lock status in database
2. Verify user activity
3. Check for stale locks
4. Review lock timestamps

**Solutions**:
1. Force unlock project (admin)
2. Clean up stale locks
3. Restart lock manager
4. Check system performance

### System Recovery

#### Database Issues

**Connection Problems**:
1. Check Supabase status
2. Verify environment variables
3. Test network connectivity
4. Review error logs

**Data Corruption**:
1. Identify affected tables
2. Restore from backup
3. Verify data integrity
4. Test system functions

#### Performance Issues

**Slow Performance**:
1. Check database query performance
2. Monitor network latency
3. Review browser performance
4. Optimize slow queries

**High Memory Usage**:
1. Check for memory leaks
2. Monitor component performance
3. Optimize image loading
4. Clear browser cache

---

## Security Best Practices

### Access Management

#### User Security

**Account Security**:
- Enforce strong passwords
- Regular password updates
- Monitor login patterns
- Disable inactive accounts

**Permission Management**:
- Principle of least privilege
- Regular permission audits
- Role-based access control
- Document permission changes

#### System Security

**Data Protection**:
- Encrypt sensitive data
- Secure API endpoints
- Implement rate limiting
- Monitor for vulnerabilities

**Access Monitoring**:
- Log all access attempts
- Monitor unusual patterns
- Alert on security events
- Regular security reviews

### Compliance

#### Data Protection

**GDPR Compliance**:
- User consent management
- Data retention policies
- Right to deletion
- Data portability

**Industry Standards**:
- ISO 9001 quality management
- IEC 61439 electrical standards
- NEN 1010 installation standards
- CE marking requirements

---

## Emergency Procedures

### System Outages

#### Planned Maintenance

**Preparation**:
1. Notify all users in advance
2. Schedule during low-usage periods
3. Prepare rollback procedures
4. Test backup systems

**Execution**:
1. Enable maintenance mode
2. Perform updates/maintenance
3. Test all functions
4. Restore normal operation

#### Unplanned Outages

**Immediate Response**:
1. Assess outage scope
2. Implement fallback systems
3. Communicate with users
4. Begin recovery procedures

**Recovery Process**:
1. Identify root cause
2. Implement fixes
3. Verify system integrity
4. Resume normal operations

### Data Recovery

#### Backup Restoration

**Process**:
1. Identify data loss scope
2. Select appropriate backup
3. Restore affected data
4. Verify data integrity
5. Test system functions
6. Notify affected users

**Validation**:
- Check all restored records
- Verify relationships intact
- Test user access
- Confirm functionality

---

## System Updates & Maintenance

### Update Procedures

#### Application Updates

**Preparation**:
1. Test updates in development environment
2. Create backup before deployment
3. Prepare rollback procedures
4. Schedule maintenance window

**Deployment**:
1. Deploy to staging environment
2. Perform comprehensive testing
3. Deploy to production
4. Monitor for issues
5. Verify all functions working

#### Database Updates

**Schema Changes**:
1. Create migration scripts
2. Test on backup database
3. Apply during maintenance window
4. Verify data integrity
5. Update application code

**Data Updates**:
1. Backup current data
2. Apply data transformations
3. Verify results
4. Update related systems

---

## Contact & Support

### Technical Support

**Internal Support**:
- System Administrator: [Your contact info]
- Database Administrator: [Your contact info]
- Security Officer: [Your contact info]

**External Support**:
- **Process Improvement B.V.**
- **Email**: tech@processimprovement.nl
- **Phone**: +31 85 760 76 27
- **Emergency**: +31 (0)6 52 44 70 27 (24/7)

### Escalation Procedures

**Level 1**: User Support
- Basic troubleshooting
- Permission issues
- Account problems

**Level 2**: System Administration
- Performance issues
- Configuration problems
- Integration issues

**Level 3**: Technical Support
- Database problems
- Security incidents
- System failures

---

This administrator guide provides comprehensive coverage of all administrative functions in the EWP Management System. Regular review and updates ensure optimal system performance and security.