# Sales Field Reporting Application - Features

## 1. Authentication & Role-Based Access
- **Secure Login:** Role-based login for Sales Executives and Admins.
- **Admin Dashboard:** Centralized view for managing users, targets, and reports.
- **Executive Dashboard:** Personalized view for tracking visits and targets.

## 2. Sales Executive Features
- **Daily Visit Logging:**
  - School name, type, and address.
  - Automatic GPS location capture (Latitude/Longitude).
  - Photo upload for visit verification.
  - Contact person and mobile details.
  - Meeting details: Demo given, Minutes of Meeting (MOM), and remarks.
  - Sample tracking: Book samples and product selections.
- **Personalized Greeting:** "Good Morning, {Name}" greeting based on time of day.
- **Usage Guide:** Integrated manual on how to use the app effectively.
- **Visit History:** View and track past visits.
- **Target Tracking:** View assigned monthly/daily visit targets.

## 3. Admin Features
- **User Management:** Create and manage Sales Executive accounts.
- **Target Setting:** Assign visit targets to specific executives.
- **Visit Monitoring:** 
  - Real-time feed of school visits.
  - View visit details including location, photos, and meeting notes.
- **Follow-up Communication:**
  - Review visits and provide direct feedback.
  - "Follow-up" button to send remarks back to the executive for specific visits.
- **Analytics & Reporting:**
  - Charts showing visit trends and target achievement.
  - Filterable reports by date range and executive.

## 4. Technical Features
- **Offline Support (Future):** Architecture ready for local caching.
- **Responsive Design:** Mobile-first UI for field use.
- **Secure Data Storage:** PostgreSQL with Drizzle ORM.
- **Automatic Metadata:** Timestamps and location data for every visit.
