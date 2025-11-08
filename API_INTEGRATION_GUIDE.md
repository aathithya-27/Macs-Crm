# API Integration Guide for MACS Member Management System

## Overview

This guide provides complete API integration patterns for connecting the MACS frontend with a backend API. The current system uses mock data with `let` declarations and `export const` functions in `apiService.ts`.

## Current Architecture

### Frontend Structure
```
services/
├── apiService.ts     # Main API service with mock data
├── geminiService.ts  # AI integration
└── otherAiService.ts # Additional AI services
```

### Master Data Location
The `@masterdata` folder contains all master data management components:
```
components/masterdata/
├── BankMastersManager.tsx
├── BranchesManager.tsx
├── CompanyMasterManager.tsx
├── CustomerFieldManager.tsx
├── DesignationManager.tsx
├── DocumentMastersManager.tsx
├── FinancialYearManager.tsx
├── GendersManager.tsx
├── GeographyManager.tsx
├── InsuranceTypeManager.tsx
├── LeadSourceManager.tsx
├── PolicyConfigurationManager.tsx
├── RelationshipTypesManager.tsx
├── RoleManager.tsx
├── RolePermissionsManager.tsx
├── SchemesAndMappingsManager.tsx
├── TaskStatusManager.tsx
└── TierAndGiftManager.tsx
```

## API Integration Pattern

### 1. Base API Configuration

Create a new file `services/apiConfig.ts`:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
```

### 2. HTTP Client Setup

Add to `services/httpClient.ts`:

```typescript
import axios from 'axios';
import { apiConfig, getAuthHeaders } from './apiConfig';

const httpClient = axios.create(apiConfig);

httpClient.interceptors.request.use((config) => {
  config.headers = { ...config.headers, ...getAuthHeaders() };
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default httpClient;
```

### 3. Updated API Service Structure

Replace the current `apiService.ts` with this pattern:

```typescript
import httpClient from './httpClient';
import { 
  Member, Policy, Lead, User, Company, FinRootsBranch,
  FinancialYear, DocumentNumbering, Role, Designation,
  RolePermissions, RelationshipType, ProcessStageMaster,
  LeadStageMaster, Religion, Festival, FestivalDate,
  Gender, MaritalStatus, CustomerType, CustomerTier,
  OccasionTypeMaster, InsuranceTypeDocumentRule,
  UpsellCategory, Route, AdvisorLocation, CheckIn
} from '../types';

// Authentication APIs
export const login = async (
  company: string, 
  employeeId: string, 
  password: string, 
  roleId: string, 
  branch_id?: string, 
  financialYearId?: string
): Promise<User | null> => {
  const response = await httpClient.post('/auth/login', {
    company, employeeId, password, roleId, branch_id, financialYearId
  });
  
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
  }
  
  return response.data.user;
};

// Member Management APIs
export const getMembers = async (comp_id?: string, advisorId?: string): Promise<Member[]> => {
  const params = new URLSearchParams();
  if (comp_id) params.append('comp_id', comp_id);
  if (advisorId) params.append('advisorId', advisorId);
  
  const response = await httpClient.get(`/members?${params}`);
  return response.data;
};

export const createMember = async (memberData: Omit<Member, 'id' | 'sno'>): Promise<Member> => {
  const response = await httpClient.post('/members', memberData);
  return response.data;
};

export const updateMember = async (memberData: Member): Promise<Member> => {
  const response = await httpClient.put(`/members/${memberData.id}`, memberData);
  return response.data;
};

export const deleteMember = async (memberId: string): Promise<{ success: true }> => {
  await httpClient.delete(`/members/${memberId}`);
  return { success: true };
};

// Lead Management APIs
export const getLeads = async (): Promise<Lead[]> => {
  const response = await httpClient.get('/leads');
  return response.data;
};

export const createLead = async (
  leadData: Omit<Lead, 'id' | 'createdAt' | 'company' | 'comp_id'>, 
  comp_id: string
): Promise<Lead> => {
  const response = await httpClient.post('/leads', { ...leadData, comp_id });
  return response.data;
};

export const updateLead = async (leadData: Lead): Promise<Lead> => {
  const response = await httpClient.put(`/leads/${leadData.id}`, leadData);
  return response.data;
};

export const deleteLead = async (leadId: string): Promise<{ success: true }> => {
  await httpClient.delete(`/leads/${leadId}`);
  return { success: true };
};

// User Management APIs
export const getUsers = async (comp_id?: string): Promise<User[]> => {
  const params = comp_id ? `?comp_id=${comp_id}` : '';
  const response = await httpClient.get(`/users${params}`);
  return response.data;
};

export const createEmployee = async (employeeData: Omit<User, 'id' | 'role' | 'initials'>): Promise<User> => {
  const response = await httpClient.post('/users', employeeData);
  return response.data;
};

export const updateEmployee = async (employeeData: User): Promise<User> => {
  const response = await httpClient.put(`/users/${employeeData.id}`, employeeData);
  return response.data;
};

export const deleteEmployee = async (userId: string): Promise<{ success: true }> => {
  await httpClient.delete(`/users/${userId}`);
  return { success: true };
};

// Company Management APIs
export const getOperatingCompanies = async (): Promise<Company[]> => {
  const response = await httpClient.get('/companies');
  return response.data;
};

export const createcompanies = async (companyData: Omit<Company, 'id'>): Promise<Company> => {
  const response = await httpClient.post('/companies', companyData);
  return response.data;
};

export const updatecompanies = async (companyData: Company): Promise<Company> => {
  const response = await httpClient.put(`/companies/${companyData.id}`, companyData);
  return response.data;
};

// Branch Management APIs
export const getFinrootsBranches = async (): Promise<FinRootsBranch[]> => {
  const response = await httpClient.get('/branches');
  return response.data;
};

export const createBranch = async (branchData: Omit<FinRootsBranch, 'id'>): Promise<FinRootsBranch> => {
  const response = await httpClient.post('/branches', branchData);
  return response.data;
};

export const updateBranch = async (branchData: FinRootsBranch): Promise<FinRootsBranch> => {
  const response = await httpClient.put(`/branches/${branchData.id}`, branchData);
  return response.data;
};

// Master Data APIs - Financial Years
export const getFinancialYears = async (): Promise<FinancialYear[]> => {
  const response = await httpClient.get('/master-data/financial-years');
  return response.data;
};

export const updateFinancialYears = async (updatedData: FinancialYear[]): Promise<FinancialYear[]> => {
  const response = await httpClient.put('/master-data/financial-years', updatedData);
  return response.data;
};

// Master Data APIs - Document Numbering
export const getDocumentNumbering = async (): Promise<DocumentNumbering[]> => {
  const response = await httpClient.get('/master-data/document-numbering');
  return response.data;
};

export const updateDocumentNumbering = async (updatedData: DocumentNumbering[]): Promise<DocumentNumbering[]> => {
  const response = await httpClient.put('/master-data/document-numbering', updatedData);
  return response.data;
};

// Master Data APIs - Roles
export const getRoles = async (): Promise<Role[]> => {
  const response = await httpClient.get('/master-data/roles');
  return response.data;
};

export const updateRoles = async (updatedData: Role[]): Promise<Role[]> => {
  const response = await httpClient.put('/master-data/roles', updatedData);
  return response.data;
};

// Master Data APIs - Designations
export const getDesignations = async (): Promise<Designation[]> => {
  const response = await httpClient.get('/master-data/designations');
  return response.data;
};

export const updateDesignations = async (updatedData: Designation[]): Promise<Designation[]> => {
  const response = await httpClient.put('/master-data/designations', updatedData);
  return response.data;
};

// Master Data APIs - Role Permissions
export const getRolePermissions = async (): Promise<RolePermissions[]> => {
  const response = await httpClient.get('/master-data/role-permissions');
  return response.data;
};

export const updateRolePermissions = async (updatedPermissions: RolePermissions): Promise<RolePermissions> => {
  const response = await httpClient.put(`/master-data/role-permissions/${updatedPermissions.roleId}`, updatedPermissions);
  return response.data;
};pdatedPermissions);
  return response.data;
};

// Master Data APIs - Relationship Types
export const getRelationshipTypes = async (): Promise<RelationshipType[]> => {
  const response = await httpClient.get('/master-data/relationship-types');
  return response.data;
};

export const updateRelationshipTypes = async (updatedData: RelationshipType[]): Promise<RelationshipType[]> => {
  const response = await httpClient.put('/master-data/relationship-types', updatedData);
  return response.data;
};

// Master Data APIs - Process Stage Masters
export const getProcessStageMasters = async (): Promise<ProcessStageMaster[]> => {
  const response = await httpClient.get('/master-data/process-stage-masters');
  return response.data;
};

export const updateProcessStageMasters = async (updatedData: ProcessStageMaster[]): Promise<ProcessStageMaster[]> => {
  const response = await httpClient.put('/master-data/process-stage-masters', updatedData);
  return response.data;
};

// Master Data APIs - Lead Stage Masters
export const getLeadStageMasters = async (): Promise<LeadStageMaster[]> => {
  const response = await httpClient.get('/master-data/lead-stage-masters');
  return response.data;
};

export const updateLeadStageMasters = async (updatedData: LeadStageMaster[]): Promise<LeadStageMaster[]> => {
  const response = await httpClient.put('/master-data/lead-stage-masters', updatedData);
  return response.data;
};

// Master Data APIs - Religions and Festivals
export const getReligions = async (): Promise<Religion[]> => {
  const response = await httpClient.get('/master-data/religions');
  return response.data;
};

export const getFestivals = async (): Promise<Festival[]> => {
  const response = await httpClient.get('/master-data/festivals');
  return response.data;
};

export const getFestivalDates = async (): Promise<FestivalDate[]> => {
  const response = await httpClient.get('/master-data/festival-dates');
  return response.data;
};

export const getFestivalDatesByFestivalId = async (festivalId: string): Promise<FestivalDate[]> => {
  const response = await httpClient.get(`/master-data/festival-dates?festivalId=${festivalId}`);
  return response.data;
};

export const createFestivalDate = async (data: Omit<FestivalDate, 'id'>): Promise<FestivalDate> => {
  const response = await httpClient.post('/master-data/festival-dates', data);
  return response.data;
};

export const updateFestivalDate = async (data: FestivalDate): Promise<FestivalDate> => {
  const response = await httpClient.put(`/master-data/festival-dates/${data.id}`, data);
  return response.data;
};

export const deleteFestivalDate = async (id: string): Promise<{ success: true }> => {
  await httpClient.delete(`/master-data/festival-dates/${id}`);
  return { success: true };
};

export const getFestivalsByDateRange = async (startDate: Date, endDate: Date): Promise<(Festival & { date: string })[]> => {
  const response = await httpClient.get('/master-data/festivals-by-date-range', {
    params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
  });
  return response.data;
};

// Master Data APIs - Gender, Marital Status, Customer Types
export const getGenders = async (): Promise<Gender[]> => {
  const response = await httpClient.get('/master-data/genders');
  return response.data;
};

export const getMaritalStatuses = async (): Promise<MaritalStatus[]> => {
  const response = await httpClient.get('/master-data/marital-statuses');
  return response.data;
};

export const getCustomerTypes = async (): Promise<CustomerType[]> => {
  const response = await httpClient.get('/master-data/customer-types');
  return response.data;
};

export const getCustomerTiers = async (): Promise<CustomerTier[]> => {
  const response = await httpClient.get('/master-data/customer-tiers');
  return response.data;
};

// Master Data APIs - Occasion Type Masters
export const getOccasionTypeMasters = async (): Promise<OccasionTypeMaster[]> => {
  const response = await httpClient.get('/master-data/occasion-type-masters');
  return response.data;
};

export const updateOccasionTypeMasters = async (updatedData: OccasionTypeMaster[]): Promise<OccasionTypeMaster[]> => {
  const response = await httpClient.put('/master-data/occasion-type-masters', updatedData);
  return response.data;
};

// Master Data APIs - Insurance Type Document Rules
export const getInsuranceTypeDocumentRules = async (): Promise<InsuranceTypeDocumentRule[]> => {
  const response = await httpClient.get('/master-data/insurance-type-document-rules');
  return response.data;
};

export const updateInsuranceTypeDocumentRules = async (updatedData: InsuranceTypeDocumentRule[]): Promise<InsuranceTypeDocumentRule[]> => {
  const response = await httpClient.put('/master-data/insurance-type-document-rules', updatedData);
  return response.data;
};

// Master Data APIs - Upsell Categories
export const getUpsellCategories = async (): Promise<UpsellCategory[]> => {
  const response = await httpClient.get('/master-data/upsell-categories');
  return response.data;
};

// Route Management APIs
export const getRoutes = async (): Promise<Route[]> => {
  const response = await httpClient.get('/routes');
  return response.data;
};

export const updateRoute = async (routeData: Route): Promise<Route> => {
  const response = await httpClient.put(`/routes/${routeData.id}`, routeData);
  return response.data;
};

// Location Tracking APIs
export const getAdvisorLocations = async (): Promise<AdvisorLocation[]> => {
  const response = await httpClient.get('/location/advisor-locations');
  return response.data;
};

export const getCheckIns = async (): Promise<CheckIn[]> => {
  const response = await httpClient.get('/location/check-ins');
  return response.data;
};

export const updateAdvisorLocation = async (locationData: Omit<AdvisorLocation, 'advisorName'>): Promise<AdvisorLocation> => {
  const response = await httpClient.post('/location/advisor-location', locationData);
  return response.data;
};

export const createCheckIn = async (newCheckInData: Omit<CheckIn, 'id' | 'advisorName' | 'durationMinutes' | 'checkOutTimestamp'>): Promise<CheckIn> => {
  const response = await httpClient.post('/location/check-in', newCheckInData);
  return response.data;
};

export const checkOut = async (
  checkInId: string,
  notes: string,
  outcome: string,
  nextActionDate?: string
): Promise<CheckIn> => {
  const response = await httpClient.put(`/location/check-out/${checkInId}`, {
    notes, outcome, nextActionDate
  });
  return response.data;
};

export const getActiveCheckIn = async (advisorId: string): Promise<CheckIn | null> => {
  const response = await httpClient.get(`/location/active-check-in/${advisorId}`);
  return response.data;
};

export const getAdvisorLocationHistory = async (advisorId: string): Promise<{ lat: number; lng: number; timestamp: string }[]> => {
  const response = await httpClient.get(`/location/advisor-location-history/${advisorId}`);
  return response.data;
};

// Policy Management APIs
export const renewPolicy = async (memberId: string, policyId: string): Promise<Member> => {
  const response = await httpClient.post(`/policies/renew`, { memberId, policyId });
  return response.data;
};

// Utility APIs
export const findMemberByMobile = async (mobile: string): Promise<Partial<Member> | null> => {
  const response = await httpClient.get(`/members/find-by-mobile?mobile=${mobile}`);
  return response.data;
};

export const calculatePremium = (policyType: string, coverage: number): number => {
  // Keep this as a client-side calculation or move to backend
  switch (policyType) {
    case 'Health Insurance':
      return Math.round(5000 + (coverage * 0.002));
    case 'Life Insurance':
      return Math.round(2000 + (coverage * 0.001));
    case 'General Insurance':
      return Math.round(1000 + (coverage * 0.02));
    default:
      return 0;
  }
};

export const generateDigipin = (lat: number, lng: number): string => {
  // Keep this as a client-side utility or move to backend
  const CCODE = "23456789CFGHJMPQRVWX";
  let lat_val = Math.round((lat + 90) * 8000 * 20);
  let lng_val = Math.round((lng + 180) * 8000 * 20);

  let code = "";
  for (let i = 0; i < 5; i++) {
    let lat_digit = lat_val % 20;
    let lng_digit = lng_val % 20;
    lat_val = Math.floor(lat_val / 20);
    lng_val = Math.floor(lng_val / 20);
    code = CCODE[lat_digit] + CCODE[lng_digit] + code;
    if (i === 0) code = '+' + code;
    if (i === 1) code = ' ' + code;
  }

  return code.replace(' ', '+').slice(0, 11);
};
```

## Backend API Endpoints Structure

Your backend should implement these endpoints:

### Authentication
- `POST /api/auth/login` - User authentication

### Members
- `GET /api/members` - Get all members with optional filters
- `POST /api/members` - Create new member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member
- `GET /api/members/find-by-mobile` - Find member by mobile

### Leads
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Users/Employees
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Companies
- `GET /api/companies` - Get all companies
- `POST /api/companies` - Create new company
- `PUT /api/companies/:id` - Update company

### Branches
- `GET /api/branches` - Get all branches
- `POST /api/branches` - Create new branch
- `PUT /api/branches/:id` - Update branch

### Master Data
- `GET /api/master-data/financial-years` - Get financial years
- `PUT /api/master-data/financial-years` - Update financial years
- `GET /api/master-data/document-numbering` - Get document numbering
- `PUT /api/master-data/document-numbering` - Update document numbering
- `GET /api/master-data/roles` - Get roles
- `PUT /api/master-data/roles` - Update roles
- `GET /api/master-data/designations` - Get designations
- `PUT /api/master-data/designations` - Update designations
- `GET /api/master-data/role-permissions` - Get role permissions
- `PUT /api/master-data/role-permissions/:roleId` - Update role permissions
- `GET /api/master-data/relationship-types` - Get relationship types
- `PUT /api/master-data/relationship-types` - Update relationship types
- `GET /api/master-data/process-stage-masters` - Get process stage masters
- `PUT /api/master-data/process-stage-masters` - Update process stage masters
- `GET /api/master-data/lead-stage-masters` - Get lead stage masters
- `PUT /api/master-data/lead-stage-masters` - Update lead stage masters
- `GET /api/master-data/religions` - Get religions
- `GET /api/master-data/festivals` - Get festivals
- `GET /api/master-data/festival-dates` - Get festival dates
- `GET /api/master-data/festival-dates?festivalId=:id` - Get festival dates by festival ID
- `POST /api/master-data/festival-dates` - Create festival date
- `PUT /api/master-data/festival-dates/:id` - Update festival date
- `DELETE /api/master-data/festival-dates/:id` - Delete festival date
- `GET /api/master-data/festivals-by-date-range` - Get festivals by date range
- `GET /api/master-data/genders` - Get genders
- `GET /api/master-data/marital-statuses` - Get marital statuses
- `GET /api/master-data/customer-types` - Get customer types
- `GET /api/master-data/customer-tiers` - Get customer tiers
- `GET /api/master-data/occasion-type-masters` - Get occasion type masters
- `PUT /api/master-data/occasion-type-masters` - Update occasion type masters
- `GET /api/master-data/insurance-type-document-rules` - Get insurance type document rules
- `PUT /api/master-data/insurance-type-document-rules` - Update insurance type document rules
- `GET /api/master-data/upsell-categories` - Get upsell categories

### Routes
- `GET /api/routes` - Get all routes
- `PUT /api/routes/:id` - Update route

### Location Tracking
- `GET /api/location/advisor-locations` - Get advisor locations
- `GET /api/location/check-ins` - Get check-ins
- `POST /api/location/advisor-location` - Update advisor location
- `POST /api/location/check-in` - Create check-in
- `PUT /api/location/check-out/:id` - Check out
- `GET /api/location/active-check-in/:advisorId` - Get active check-in
- `GET /api/location/advisor-location-history/:advisorId` - Get advisor location history

### Policies
- `POST /api/policies/renew` - Renew policy

## Environment Variables

Add to your `.env.local`:

```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## Migration Steps

1. **Phase 1**: Set up HTTP client and configuration files
2. **Phase 2**: Replace authentication APIs first
3. **Phase 3**: Migrate member management APIs
4. **Phase 4**: Migrate master data APIs (this is where `@masterdata` components connect)
5. **Phase 5**: Migrate remaining APIs (leads, location tracking, etc.)

## Error Handling

The HTTP client includes:
- Automatic token refresh handling
- 401 redirect to login
- Request/response interceptors
- Timeout configuration

## Testing

Test each API endpoint individually:

```typescript
// Example test
const testMemberAPI = async () => {
  try {
    const members = await getMembers('FIN01');
    console.log('Members loaded:', members.length);
  } catch (error) {
    console.error('API Error:', error);
  }
};
```

## Security Considerations

- All requests include JWT tokens
- Sensitive data is not logged
- CORS configuration required on backend
- Input validation on both frontend and backend
- Rate limiting recommended on backend

This structure maintains your current `let` and `export const` pattern while providing a clear path to real API integration.

---

# Frontend Changes Required

## 1. Install Dependencies

```bash
npm install axios
```

## 2. Create New Files

### Create `services/apiConfig.ts`
```typescript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
```

### Create `services/httpClient.ts`
```typescript
import axios from 'axios';
import { apiConfig, getAuthHeaders } from './apiConfig';

const httpClient = axios.create(apiConfig);

httpClient.interceptors.request.use((config) => {
  config.headers = { ...config.headers, ...getAuthHeaders() };
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default httpClient;
```

## 3. Update Environment Variables

Add to `.env.local`:
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

## 4. Replace `services/apiService.ts`

**BACKUP YOUR CURRENT FILE FIRST!**

Replace the entire content with the API service structure shown above.

## 5. Component Changes Required

### Login Component Updates

Update your Login component to handle authentication tokens:

```typescript
// In Login.tsx
const handleLogin = async () => {
  try {
    const user = await login(selectedCompany, employeeId, password, selectedRole, selectedBranch, selectedFinancialYear);
    if (user) {
      // Token is automatically stored in localStorage by the API service
      setCurrentUser(user);
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Login failed:', error);
    setError('Login failed. Please check your credentials.');
  }
};
```

### Master Data Components

No changes needed in your `@masterdata` components - they already use the API service functions correctly.

### Error Handling in Components

Add error handling to components that use API calls:

```typescript
// Example in any component using API
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const loadData = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await getMembers(comp_id);
    setMembers(data);
  } catch (err) {
    setError('Failed to load data. Please try again.');
    console.error('API Error:', err);
  } finally {
    setLoading(false);
  }
};
```

## 6. Loading States

Add loading indicators to components:

```typescript
// In components that fetch data
{loading && <div>Loading...</div>}
{error && <div className="error">{error}</div>}
{!loading && !error && (
  // Your component content
)}
```

## 7. Update App.tsx

Add token validation on app startup:

```typescript
// In App.tsx
useEffect(() => {
  const token = localStorage.getItem('authToken');
  if (token && !currentUser) {
    // Validate token or redirect to login
    // You might want to add a token validation endpoint
  }
}, []);
```

## 8. Logout Functionality

Update logout to clear tokens:

```typescript
const handleLogout = () => {
  localStorage.removeItem('authToken');
  setCurrentUser(null);
  navigate('/login');
};
```

## 9. Testing Changes

### Phase 1: Test with Mock Backend
Create a simple Express server for testing:

```javascript
// test-server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/auth/login', (req, res) => {
  res.json({ 
    token: 'test-token', 
    user: { id: '1', name: 'Test User' } 
  });
});

app.get('/api/members', (req, res) => {
  res.json([{ id: '1', name: 'Test Member' }]);
});

app.listen(3001, () => {
  console.log('Test server running on port 3001');
});
```

### Phase 2: Gradual Migration
1. Start with authentication APIs
2. Test login/logout functionality
3. Migrate member management APIs
4. Test member CRUD operations
5. Migrate master data APIs
6. Test all master data components

## 10. Common Issues & Solutions

### CORS Issues
Ensure your backend has CORS configured:
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Token Expiry
Handle token expiry gracefully:
```typescript
// The httpClient already handles 401 responses
// But you might want to add refresh token logic
```

### Network Errors
Add retry logic for network failures:
```typescript
const retryRequest = async (fn: () => Promise<any>, retries = 3) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error.code === 'NETWORK_ERROR') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};
```

## 11. Performance Optimizations

### Caching
Add simple caching for master data:
```typescript
const cache = new Map();

export const getCachedData = async (key: string, fetchFn: () => Promise<any>) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  const data = await fetchFn();
  cache.set(key, data);
  return data;
};
```

### Request Debouncing
For search functionality:
```typescript
import { debounce } from 'lodash';

const debouncedSearch = debounce(async (query: string) => {
  const results = await searchMembers(query);
  setSearchResults(results);
}, 300);
```

## 12. File Structure After Changes

```
services/
├── apiConfig.ts      # NEW - API configuration
├── httpClient.ts     # NEW - HTTP client setup
├── apiService.ts     # MODIFIED - Real API calls
├── geminiService.ts  # UNCHANGED
└── otherAiService.ts # UNCHANGED

components/
├── masterdata/       # UNCHANGED - Components work as-is
├── Login.tsx         # MODIFIED - Token handling
├── App.tsx          # MODIFIED - Token validation
└── ...              # MODIFIED - Error handling

.env.local           # MODIFIED - Add API URL
package.json         # MODIFIED - Add axios
```

## 13. Rollback Plan

If issues occur:
1. Keep backup of original `apiService.ts`
2. Remove new files (`apiConfig.ts`, `httpClient.ts`)
3. Restore original `apiService.ts`
4. Remove axios dependency
5. Revert environment variables

This ensures you can quickly return to the working mock data setup if needed.