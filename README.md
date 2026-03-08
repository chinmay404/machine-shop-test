# Machine Shop Tool Management System

> Streamlined, production-ready tool management system for machine shops

## Overview
A slim Django application for tool management with:
- Core tool data management (Shape, Life, Other Details)
- Structured Bill of Materials (BOM) tracking
- Trial form approval workflow for data changes
- Status-based data locking (DRAFT → FINALIZED)

## Project Structure
```
toolmanagment/
├── toolmanager/
│   ├── models.py              # Core models (MachineTools, ToolShape, etc.)
│   ├── api.py                 # Chief API endpoints (343 lines, cleaned)
│   ├── api_trial.py           # Trial submission & approval
│   ├── api_bom.py             # BOM structure & components
│   ├── views.py               # Route handlers
│   ├── urls.py                # URL mapping (clean, essential only)
│   ├── templates/
│   │   ├── toolstore.html     # Main UI
│   │   ├── tool_data.html     # Trial forms
│   │   └── trial_form_modal.html
│   └── static/js/
│       ├── toolManager.js     # Core app logic
│       └── toolData.js        # Data ops
└── db.sqlite3
```

**Recent Cleanup:** Reduced from 2,184 lines to 343 lines in api.py by removing unused CRUD, materials, suppliers, and old trial-master system.

## Key Features

### 1. Tool Data Management
- **Initial Entry (DRAFT):** Fill Shape, Life, Other Details freely
- **Finalization:** Lock data after verification
- **Trial Forms:** Request changes via formal submission process

### 2. Status Workflow
```
DRAFT (Editable)
  ↓
Finalize Data
  ↓
FINALIZED (Read-only)
  ↓
Submit Trial Form
  ↓
Trial Modal (Original vs Proposed comparison)
  ↓
Manager Approval
  ↓
Changes Applied
```

### 3. Database Models
- **ToolShape** - Cutting tool geometry (nom_d, length, corners, etc.)
- **ToolLife** - Tool lifespan data (life, cut_time, etc.)
- **ToolOtherDetails** - Additional info (supplier, purchase date, etc.)
- **ToolTrial** - Trial record management
- **MachineTools** - Tool master record

## Key APIs

### Tool Data Endpoints
```
GET  /api/tools/<id>/shape/              # Get shape data
PUT  /api/tools/<id>/shape/update/       # Save/update shape
GET  /api/tools/<id>/life/               # Get life data
PUT  /api/tools/<id>/life/update/        # Save/update life
GET  /api/tools/<id>/other/              # Get other details
PUT  /api/tools/<id>/other/update/       # Save/update other
```

### Trial Form Endpoints
```
POST /api/trials/<id>/submit/             # Submit trial form
POST /api/trials/<id>/approve-and-apply/  # Approve & apply changes
```

## HTTP Response Codes
- **200 OK** - Data saved (DRAFT mode)
- **201 Created** - Trial form created (FINALIZED mode)
- **400 Bad Request** - Validation error
- **404 Not Found** - Resource not found

## Quick Start

### Setup
```bash
cd toolmanagment
python manage.py migrate
python manage.py runserver
```

### Access Application
```
http://localhost:8000/toolstore/     # Main tool management
http://localhost:8000/tool_data/     # Trial form testing
```

## Data Flow Example

### Step 1: Create Tool Data
```json
PUT /api/tools/1/other/update/
{
  "supplier": "ABC Corp",
  "purchase_date": "2026-03-05",
  "trial_by": "John Doe"
}
→ Response 200 (DRAFT mode)
```

### Step 2: Finalize Data
```json
PUT /api/tools/1/other/update/
{
  "supplier": "ABC Corp",
  "finalize": true,
  "finalized_by": "Admin"
}
→ Response 200 (Now FINALIZED)
```

### Step 3: Request Changes
```json
PUT /api/tools/1/other/update/
{
  "supplier": "XYZ Corp"
}
→ Response 201 (Trial created, needs approval)
→ Trial modal opens in UI
```

### Step 4: Submit Trial
```json
POST /api/trials/1/submit/
{
  "change_reason": "Supplier offers better quality",
  "submitted_by": "Manager",
  "proposed_changes": {"supplier": "XYZ Corp"}
}
→ Trial recorded for approval
```

## Database Fields

### ToolShape / ToolLife / ToolOtherDetails
```sql
data_status VARCHAR(20) DEFAULT 'DRAFT'  -- 'DRAFT' or 'FINALIZED'
finalized_date DATETIME NULL
finalized_by VARCHAR(255) NULL
```

## Frontend Components

### Display Functions (toolData.js)
- `displayShapeData()` - Shows shape with status badge
- `displayLifeData()` - Shows life with status badge
- `displayOtherDetails()` - Shows other details with status badge

### Trial Modal Functions
- `showTrialModal()` - Display comparison and submit form
- `handleTrialSubmit()` - Submit trial to backend
- `closeTrialModal()` - Close and reset

## Status

✅ **Production Ready**
- Backend: Cleaned & optimized (api.py: 343 lines)
- Frontend: 100% integrated
- Database: Migrated & validated
- URLs: Streamlined (47 routes, essentials only)
- APIs: Deprecated api_master.py & api_trial_master.py removed

## Cleanup Changes (Latest)
- **Removed:** 20+ old documentation files
- **Reduced:** api.py from 2,184 → 343 lines
- **Removed:** Defunct API files (api_master.py, api_trial_master.py)
- **Consolidated:** Single master README.md for documentation
- **Simplified:** urls.py removes unused endpoints (materials, suppliers, old trial system)

## Notes
- All data MUST be entered on first save (DRAFT mode)
- Once finalized, direct edits are blocked
- All changes to finalized data require trial approval
- Trial records maintain audit trail of all changes

