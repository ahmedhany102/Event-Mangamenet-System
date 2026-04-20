# Event Management System (EMS) - Simplified Academic Version

## 1. Project Title
Event Management System (EMS)

## 2. Description
This project is a simplified operational Event Management System for a university database course.

It manages:
- Events
- Employees
- Tasks
- Attendees
- Venues
- Organizations

The design is normalized up to 3NF, easy to explain, and suitable for a semester project.

## 3. Features
- Create and manage events
- Assign employees to events
- Create and track tasks for each event
- Register attendees for events
- Manage venues and organizations
- Monitor event budget and spending

## 4. System Roles (Simple)
- Admin: manages all data
- Organizer: creates events and assigns employees/tasks
- Employee: views assigned events and updates task progress
- Attendee: registers for events

## 5. Database Design Overview
This schema is intentionally simplified while keeping correct design principles:
- Clear separation of concerns
- Proper foreign keys
- One-to-Many and Many-to-Many relationships
- No over-engineered identity or permission layers

## 6. Tables Summary

### 6.1 organizations
Purpose: Stores organization information.

Columns:
- id: unique organization id
- name: organization name
- contact_person: main contact name
- email: contact email
- phone: contact phone

Primary Key:
- id

Foreign Keys:
- none

### 6.2 venues
Purpose: Stores event venue data.

Columns:
- id: unique venue id
- name: venue name
- address: venue address
- capacity: max attendee capacity

Primary Key:
- id

Foreign Keys:
- none

### 6.3 events
Purpose: Core event details.

Columns:
- id: unique event id
- organization_id: event owner organization
- venue_id: assigned venue
- name: event name
- description: event details
- start_date: event start
- end_date: event end
- budget: planned budget
- expenditure: current spending
- status: planned, active, completed, cancelled

Primary Key:
- id

Foreign Keys:
- organization_id -> organizations(id)
- venue_id -> venues(id)

### 6.4 employees
Purpose: Employee profile data only.

Columns:
- id: unique employee id
- organization_id: employee organization
- full_name: employee name
- email: employee email
- job_title: employee role

Primary Key:
- id

Foreign Keys:
- organization_id -> organizations(id)

### 6.5 event_employees
Purpose: Junction table for Event and Employee assignment.

Columns:
- event_id: linked event
- employee_id: linked employee
- assigned_role: role in this event

Primary Key:
- (event_id, employee_id)

Foreign Keys:
- event_id -> events(id)
- employee_id -> employees(id)

### 6.6 tasks
Purpose: Work items for events, optionally assigned to employees.

Columns:
- id: unique task id
- event_id: parent event
- employee_id: assigned employee
- title: task title
- description: task details
- start_date: task start
- deadline: task due date
- status: todo, in_progress, done

Note:
- Tasks can be unassigned initially.

Primary Key:
- id

Foreign Keys:
- event_id -> events(id)
- employee_id -> employees(id)

### 6.7 attendees
Purpose: Attendee basic profile.

Columns:
- id: unique attendee id
- full_name: attendee name
- email: attendee email
- phone: attendee phone

Primary Key:
- id

Foreign Keys:
- none

### 6.8 event_attendees
Purpose: Junction table for event registrations.

Columns:
- event_id: linked event
- attendee_id: linked attendee
- ticket_type: regular, vip, student
- registration_date: date registered
- attendance_status: registered, attended, cancelled

Primary Key:
- (event_id, attendee_id)

Foreign Keys:
- event_id -> events(id)
- attendee_id -> attendees(id)

## 7. Relationships

### One-to-Many
- organizations -> events
- organizations -> employees
- venues -> events
- events -> tasks
- employees -> tasks

### Many-to-Many (via Junction Tables)
- events <-> employees via event_employees
- events <-> attendees via event_attendees

## 8. Sample Workflows

### Event Planning Workflow
1. Create organization and venue
2. Create event with budget and dates
3. Assign employees to event
4. Create tasks and assign to employees

### Attendee Workflow
1. Add attendee profile
2. Register attendee to event
3. Set ticket type
4. Update attendance status on event day

### Task Workflow
1. Organizer creates task for event
2. Assign task to employee
3. Employee updates task status
4. Organizer monitors completion

## 9. Design Decisions
- Tasks are separated from employees to maintain normalization.
- Junction tables are used for many-to-many relationships.
- Attendee registration supports multiple events.
- Derived values (like attendee count) are not stored.
- Budget and expenditure are simplified for academic use.
- Emails are treated as unique identifiers.

## 10. Technologies Used
- Database: MySQL or PostgreSQL
- SQL: DDL, constraints, foreign keys
- Optional frontend: React
- Optional backend: Node.js / Express

## 11. How to Run (Basic)
1. Create a new database in MySQL or PostgreSQL.
2. Run the SQL schema below to create tables.
3. Insert sample data for organizations, venues, events, employees, and attendees.
4. Test queries for assignments, registrations, and task tracking.

---

# Final Simplified Schema (SQL)

CREATE TABLE organizations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL UNIQUE,
  contact_person VARCHAR(120),
  email VARCHAR(150),
  phone VARCHAR(30)
);

CREATE TABLE venues (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0)
);

CREATE TABLE events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  venue_id INT NOT NULL,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(12,2) NOT NULL CHECK (budget >= 0),
  expenditure DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (expenditure >= 0),
  status VARCHAR(20) NOT NULL,
  CONSTRAINT chk_event_dates CHECK (end_date > start_date),
  CONSTRAINT chk_event_status CHECK (status IN ('planned','active','completed','cancelled')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);

CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  organization_id INT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  job_title VARCHAR(100),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE event_employees (
  event_id INT NOT NULL,
  employee_id INT NOT NULL,
  assigned_role VARCHAR(100),
  PRIMARY KEY (event_id, employee_id),
  CONSTRAINT chk_assigned_role CHECK (assigned_role IN ('manager','coordinator','staff')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT NOT NULL,
  employee_id INT,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  start_date DATE,
  deadline DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'todo',
  CONSTRAINT chk_task_status CHECK (status IN ('todo','in_progress','done')),
  CONSTRAINT chk_task_dates CHECK (deadline IS NULL OR start_date IS NULL OR deadline >= start_date),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE attendees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30)
);

CREATE TABLE event_attendees (
  event_id INT NOT NULL,
  attendee_id INT NOT NULL,
  ticket_type VARCHAR(20) NOT NULL DEFAULT 'regular',
  registration_date DATE NOT NULL,
  attendance_status VARCHAR(20) NOT NULL DEFAULT 'registered',
  PRIMARY KEY (event_id, attendee_id),
  CONSTRAINT chk_ticket_type CHECK (ticket_type IN ('regular','vip','student')),
  CONSTRAINT chk_attendance_status CHECK (attendance_status IN ('registered','attended','cancelled')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (attendee_id) REFERENCES attendees(id) ON DELETE CASCADE
);

CREATE INDEX idx_events_organization_id ON events(organization_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_tasks_event_id ON tasks(event_id);
CREATE INDEX idx_event_employees_employee_id ON event_employees(employee_id);
CREATE INDEX idx_event_attendees_attendee_id ON event_attendees(attendee_id);

# 🎨 Frontend Design & UI/UX Plan

## 1. Design Vision
The EMS frontend should feel like a modern SaaS dashboard: clean, structured, and highly usable.

Design direction:
- Modern and professional visual language
- Clean layout with strong hierarchy
- Minimal interface with powerful actions
- Dashboard-oriented experience for daily operations
- Fast, focused workflows for event teams

## 2. Pages Structure

### Dashboard
Purpose:
- Give a quick overview of system activity and performance.

Main UI sections:
- KPI cards (total events, active events, employees assigned, attendees)
- Recent events panel
- Upcoming tasks panel
- Budget summary widget

Key actions:
- Create Event button
- View All Events
- Quick links to Tasks and Attendees

### Events Page
Purpose:
- Browse and manage all events efficiently.

Implemented: ✔

Note:
- Events are fetched from Supabase and displayed using EventCard component.

Main UI sections:
- Search and filter bar (status, date, organization)
- Event list or card grid
- Pagination controls

Key actions:
- Create Event
- Edit Event
- Open Event Details
- Filter and sort events

### Event Details Page
Purpose:
- Show complete information and operations for one event.

Implemented: ✔

Main UI sections:
- Event header (name, status, dates, venue)
- Budget and expenditure summary
- Assigned employees list
- Tasks list
- Registered attendees list

Key actions:
- Edit Event
- Assign Employee
- Add Task
- Register Attendee

### Create/Edit Event Page
Purpose:
- Create new events and update existing ones.

Implemented: ✔

Note:
- ✔ Edit implemented

Main UI sections:
- Event form (name, dates, venue, organization, budget, status)
- Validation hints and helper text
- Save/cancel actions

Key actions:
- Save Draft
- Publish/Update Event
- Cancel

### Employees Page
Purpose:
- Manage employee records and event assignments.

Implemented: ✔

Main UI sections:
- Employee table
- Search by name/email
- Assignment overview

Key actions:
- Add Employee
- Assign to Event
- View employee workload

### Tasks Page
Purpose:
- Track task progress across events.

Implemented: ✔

Main UI sections:
- Task table with status and deadline
- Filters by event, employee, status
- Progress indicators

Key actions:
- Create Task
- Assign/Reassign Task
- Update Task Status

### Attendees Page
Purpose:
- Manage attendee registration and attendance states.

Implemented: ✔

Main UI sections:
- Attendee table
- Registration status filters
- Event-based attendee view

Key actions:
- Add Attendee
- Register for Event
- Update Attendance Status

## 3. UI Components
Reusable components:
- Navbar: top navigation, search, profile menu
- Sidebar: dashboard sections and quick navigation
- Event Card: compact event overview with actions
- Data Table: sortable tabular data for employees, tasks, attendees
- Form Inputs: consistent text, select, date, and textarea fields
- Modal: confirmations and quick-create dialogs
- Buttons: primary, secondary, ghost, danger variants
- Status Badge: planned, active, completed, cancelled, todo, in_progress, done
- Toast Notifications: success, warning, and error feedback

## 4. UX Behavior
- Loading states: use skeleton loaders for pages and spinners for button actions.
- Empty states: show clear empty messages with a primary call-to-action (for example, Create Event).
- Error handling: display friendly inline messages and retry options for failed actions.
- Form validation feedback: validate required fields, date rules, and numeric inputs with clear helper text.

## 5. Visual Style
- Color palette:
  - Primary: blue for key actions and links
  - Secondary: teal or slate for supporting UI
  - Background: light neutral gray for app surface
  - Semantic: green (success), amber (warning), red (error), gray (inactive)
- Typography:
  - Clean sans-serif font such as Inter or Plus Jakarta Sans
  - Strong heading hierarchy and readable body text
- Spacing and layout:
  - 8px spacing system
  - Card-based sections with balanced whitespace
  - Responsive grid layout for dashboard widgets and tables
- Icons:
  - Use Heroicons or Lucide for consistent, modern iconography

## 6. Advanced UI Touches (Important)
- Smooth animations:
  - Subtle hover effects on cards and buttons
  - Short transitions for menus, modals, and page state changes
- Interactive tables:
  - Client-side sorting and filtering for fast exploration
  - Sticky headers for long datasets
- Dashboard charts:
  - Basic analytics widgets (events by status, attendance trend, budget usage)
- Status indicators:
  - Color-coded badges for event and task lifecycle states
- Responsive design:
  - Mobile-first layout behavior
  - Collapsible sidebar and stacked cards on smaller screens

## 7. Technologies
- React for component-based frontend development
- Tailwind CSS for fast, consistent styling
- Optional UI libraries:
  - Shadcn UI for modern composable components
  - Material UI for ready-to-use enterprise-grade components

### Ticket System
Implemented: ✔

Description:
- Each registration generates a unique ticket
- Ticket is linked to event and attendee
- Ticket code used for check-in

### QR Code
Implemented: ✔

Description:
- Each ticket generates a QR code
- QR code represents ticket_code
- Can be used for event check-in

### Check-in System
Implemented: ✔

Description:
- Tickets can be scanned or entered
- System validates ticket
- Marks attendee as checked-in

### Organization Management
Implemented: ✔

Description:
- Organizations can be created from UI
- Used as parent entity for events and employees
- All references use dropdown instead of manual IDs
#   E v e n t - M a n g a m e n e t - S y s t e m  
 