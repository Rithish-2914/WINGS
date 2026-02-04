# Features List

## Sales Executive Features
- **Authentication**: Login with ID (e.g., 1001) and password (123abc).
- **Dashboard**: 
  - View current date automatically.
  - Count of visits completed today (e.g., 3/6).
  - List of today's submitted visits.
  - Quick action button to add a "New Visit".
- **Visit Reporting**:
  - **Type Selection**: Choose between "First Visit" (New School) or "Re-Visit" (Follow-up).
  - **School Details**: Capture school name, type (Pre-school, Kindergarten, Primary), and address.
  - **Location & Verification**: 
    - Auto-capture GPS coordinates.
    - Mandatory GPS-enabled photo upload for physical proof.
  - **Contact Information**: Record school phone, contact person, and mobile number.
  - **Meeting Minutes**:
    - Record whether a demo was given.
    - Write Minutes of Meeting (MOM) with a minimum word count.
    - Add school remarks.
  - **Sample Management**:
    - Track if samples were submitted.
    - Multi-select list of predefined book products.
    - Upload acknowledgement forms.

## Admin Features
- **Centralized Dashboard**: View all visits from all executives.
- **Reporting & Filtering**:
  - Filter by date, executive, city, and school.
  - Track metrics like visits per executive, demo conversions, and sample submissions.
- **Exporting**: Download data as Excel or PDF (standard report formats).

## Technical Features
- **Role-Based Access**: Secure separation between field staff and management.
- **Validation**: Strict enforcement of mandatory fields (mobile numbers, GPS photos, etc.).
- **Photo Storage**: Centralized storage for visit proof photos.
- **Persistence**: PostgreSQL database for all visit history and user accounts.
