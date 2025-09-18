# FundVerse Project Creation Refactor & Role-Based Authentication

## Overview

This document describes the refactored project creation system with a 4-step wizard and the implementation of role-based authentication using Internet Identity.

## 🎯 **Project Creation Wizard - 4 Steps**

### Step 1: Basic Project Information
- **Project Title**: Name of the project
- **Description**: Detailed project description
- **Funding Goal**: Amount in ICP
- **Contact Info**: Email address
- **Legal Entity**: Company or organization name
- **Category**: Project category (Technology, Healthcare, etc.)
- **Business Registration**: Registration number

### Step 2: Financial Documents
Users must upload the following documents in PDF format:
- **Business Plan**: Comprehensive business strategy
- **Financial Projections**: 3-5 year financial forecasts
- **Legal Documents**: Legal compliance documents
- **Tax Returns**: Last 2 years of tax returns

### Step 3: Project Milestones
- **Project Duration**: Total project timeline in days
- **Milestones**: Multiple milestones with:
  - Title and description
  - Funding amount for each milestone
  - Due dates
  - Dynamic add/remove functionality

### Step 4: Agreements
Users must accept:
- **Terms and Conditions**: FundVerse platform terms
- **Privacy Policy**: Data handling and privacy terms
- **Egyptian Legal Framework**: Compliance with Egyptian laws

## 🔐 **Role-Based Authentication System**

### User Roles

#### 1. **User** (Default Role)
- Can browse projects and campaigns
- Can contribute to funding campaigns
- Basic platform access

#### 2. **Innovator**
- All User permissions
- Can submit projects for review
- Can upload financial documents
- Can manage their own projects
- Can view project status and admin feedback

#### 3. **Admin**
- All Innovator permissions
- Can review and approve/reject projects
- Can manage user roles
- Can add/remove admins and innovators
- Full system administration access

### Authentication Flow

1. **Internet Identity Integration**
   - Users authenticate using Internet Identity
   - Secure, decentralized authentication
   - No password management required

2. **Role Assignment**
   - New users default to "User" role
   - Admins can promote users to "Innovator" or "Admin"
   - Role changes are tracked and audited

3. **Access Control**
   - Route protection based on roles
   - Component-level permission checks
   - Graceful fallbacks for unauthorized access

## 🏗️ **Technical Implementation**

### Frontend Components

#### 1. **CreateProjectWizard** (`src/FundVerse_frontend/src/components/CreateProjectWizard.tsx`)
- Multi-step form with validation
- File upload handling for documents
- Dynamic milestone management
- Progress indicator
- Form state persistence across steps

#### 2. **AuthContext** (`src/FundVerse_frontend/src/contexts/AuthContext.tsx`)
- Internet Identity integration
- Role management
- User session handling
- Authentication state management

#### 3. **RoleGuard** (`src/FundVerse_frontend/src/components/RoleGuard.tsx`)
- Route protection components
- Role-based access control
- Authentication guards
- Custom fallback components

#### 4. **AdminPage** (`src/FundVerse_frontend/src/pages/AdminPage.tsx`)
- Project review interface
- User management dashboard
- Role assignment tools
- System statistics

### Backend Canisters

#### 1. **Enhanced Admin Canister** (`src/Admin/src/lib.rs`)
- **New Data Structures**:
  ```rust
  pub enum Role { Admin, User, Innovator }
  pub enum IdeaStatus { Pending, UnderReview, Approved, Rejected, RequiresRevision }
  pub struct Project { /* comprehensive project data */ }
  pub struct Milestone { /* milestone information */ }
  ```

- **New Methods**:
  - `submit_project()`: Submit projects with milestones and documents
  - `review_project()`: Admin project review and status updates
  - `add_innovator()` / `remove_innovator()`: Innovator role management
  - `get_projects()` / `get_my_projects()`: Project retrieval
  - Enhanced user management with role tracking

#### 2. **Updated FundVerse Backend**
- Document upload/retrieval using `Doc` struct
- Integration with Admin canister for project approval
- Enhanced campaign creation with project duration

## 📋 **API Reference**

### Admin Canister Methods

#### User Management
```typescript
// Add users with specific roles
add_admin(principal: string): Promise<Result>
add_innovator(principal: string): Promise<Result>
set_role(principal: string, role: Role): Promise<Result>

// User queries
get_users(): Promise<RegisteredUser[]>
get_my_role(): Promise<Role>
get_innovators(): Promise<RegisteredUser[]>
```

#### Project Management
```typescript
// Submit project with full details
submit_project(
  title: string,
  description: string,
  funding_goal_e8s: bigint,
  legal_entity: string,
  contact_info: string,
  category: string,
  business_registration: number,
  project_duration_days: number,
  milestones: Array<[string, string, bigint, bigint]>,
  document_ids: bigint[]
): Promise<Result<Project>>

// Review projects
review_project(
  project_id: bigint,
  status: IdeaStatus,
  notes?: string
): Promise<Result<Project>>

// Query projects
get_projects(): Promise<Project[]>
get_projects_by_status(status: IdeaStatus): Promise<Project[]>
get_my_projects(): Promise<Project[]>
```

### Frontend Hooks

#### Authentication Hooks
```typescript
// Basic authentication
const { isAuthenticated, user, role, login, logout } = useAuth();

// Role-based guards
const { loading } = useRequireAuth();
const { loading } = useRequireRole('Admin');
const { loading } = useRequireAdmin();
const { loading } = useRequireInnovator();
```

#### Role Guard Components
```typescript
// Protect routes by role
<AdminGuard>
  <AdminPage />
</AdminGuard>

<InnovatorGuard>
  <CreateProjectWizard />
</InnovatorGuard>

<AuthGuard>
  <UserDashboard />
</AuthGuard>
```

## 🚀 **Usage Examples**

### Creating a New Project
```typescript
// 1. User must be authenticated and have Innovator role
const { isAuthenticated, role } = useAuth();

// 2. Use the wizard component
<CreateProjectWizard 
  backendActor={backendActor}
  onProjectCreated={() => {
    // Handle successful project creation
  }}
/>
```

### Admin Review Process
```typescript
// 1. Admin reviews pending projects
const projects = await adminActor.get_projects_by_status('Pending');

// 2. Review and update status
await adminActor.review_project(
  projectId,
  'Approved',
  'Project meets all requirements'
);
```

### Role Management
```typescript
// 1. Admin promotes user to Innovator
await adminActor.add_innovator(userPrincipal);

// 2. Admin promotes user to Admin
await adminActor.add_admin(userPrincipal);

// 3. Remove elevated roles
await adminActor.remove_innovator(userPrincipal);
```

## 🔒 **Security Considerations**

### Authentication Security
- Internet Identity provides secure, decentralized authentication
- No password storage or management required
- Session management handled by Internet Identity
- Automatic session expiration and renewal

### Role-Based Access Control
- Server-side role validation
- Client-side route protection
- Graceful degradation for unauthorized access
- Audit trail for role changes

### Data Protection
- Document uploads validated and sanitized
- Financial data encrypted in transit
- User privacy protected through role isolation
- Admin actions logged and auditable

## 📊 **Project Review Workflow**

### 1. **Project Submission**
- Innovator submits project through 4-step wizard
- All required documents uploaded
- Project status: `Pending`

### 2. **Admin Review**
- Admin reviews project details and documents
- Can request revisions or approve/reject
- Project status: `UnderReview` → `Approved`/`Rejected`/`RequiresRevision`

### 3. **Project Approval**
- Approved projects can create campaigns
- Funding can begin
- Milestone tracking activated

### 4. **Ongoing Management**
- Admins can monitor project progress
- Milestone completion tracking
- Funding distribution management

## 🎨 **UI/UX Features**

### Progress Indicators
- Step-by-step progress bar
- Form validation feedback
- Upload progress for documents
- Real-time status updates

### Responsive Design
- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly controls

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## 🔧 **Configuration**

### Environment Variables
```bash
# Internet Identity
REACT_APP_INTERNET_IDENTITY_URL=https://identity.ic0.app

# Canister IDs
REACT_APP_ADMIN_CANISTER_ID=rrkah-fqaaa-aaaaa-aaaaq-cai
REACT_APP_FUNDVERSE_BACKEND_CANISTER_ID=your-backend-canister-id

# Network
DFX_NETWORK=ic  # or 'local' for development
```

### Development Setup
```bash
# Install dependencies
npm install

# Start local development
dfx start --background
dfx deploy

# Start frontend
npm run dev
```

## 🧪 **Testing**

### Unit Tests
```bash
# Test backend canisters
dfx test

# Test frontend components
npm test
```

### Integration Tests
- End-to-end project creation flow
- Role-based access control testing
- Document upload and retrieval
- Admin review workflow

## 📈 **Future Enhancements**

### Planned Features
1. **Advanced Document Management**
   - Document versioning
   - Digital signatures
   - Automated document validation

2. **Enhanced Review Process**
   - Multi-admin review system
   - Review templates and checklists
   - Automated compliance checking

3. **Project Analytics**
   - Funding progress tracking
   - Milestone completion analytics
   - Performance metrics

4. **Communication System**
   - Admin-innovator messaging
   - Notification system
   - Status update alerts

### Scalability Improvements
- Database optimization for large project volumes
- Caching strategies for improved performance
- Load balancing for high-traffic scenarios
- Microservice architecture for better modularity

## 📞 **Support**

For technical support or questions about the implementation:
- Check the documentation in the codebase
- Review the Candid interface definitions
- Test with the provided examples
- Contact the development team for assistance

---

This refactored system provides a robust, secure, and user-friendly platform for project creation and management with comprehensive role-based access control.
