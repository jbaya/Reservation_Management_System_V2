# Entity-Relationship Diagram — Reservation Management System v2

Rendered with Mermaid. Paste into any Mermaid-compatible viewer (GitHub renders
this natively) to see the diagram.

```mermaid
erDiagram
    DESIGNATIONS ||--o{ USERS : "designation_id"
    USERS {
        int id PK
        string full_name
        string username
        string password_hash
        int designation_id FK
        string user_type
        string status
    }
    DESIGNATIONS {
        int id PK
        string name
    }

    FLOORS ||--o{ ROOMS : "floor_id"
    ROOM_CATEGORIES ||--o{ ROOMS : "category_id"
    ROOMS {
        int room_id PK
        string room_no
        int category_id FK
        int floor_id FK
        int capacity
        bool is_active
    }
    FLOORS {
        int id PK
        int floor_no
        string label
    }
    ROOM_CATEGORIES {
        int id PK
        string category
        string color
    }

    TRAVEL_AGENTS ||--o{ TRAVEL_AGENT_RATES : "agent_id"
    ROOM_CATEGORIES ||--o{ TRAVEL_AGENT_RATES : "category_id"
    SEASONS ||--o{ TRAVEL_AGENT_RATES : "season_id"
    TRAVEL_AGENT_RATES {
        int id PK
        int agent_id FK
        int category_id FK
        int season_id FK
        numeric room_rate
        numeric extra_person_rate
    }
    TRAVEL_AGENTS {
        int id PK
        string name
        string company
    }
    SEASONS {
        int id PK
        string name
        date from_date
        date to_date
    }
    THIRD_PARTIES {
        int id PK
        string name
        string company
    }

    ROOM_CATEGORIES ||--o{ BOOKINGS : "category_id"
    TRAVEL_AGENTS ||--o{ BOOKINGS : "agent_id"
    THIRD_PARTIES ||--o{ BOOKINGS : "third_party_id"
    BOOKINGS {
        string id PK
        string guest_name
        int category_id FK
        int agent_id FK
        int third_party_id FK
        date arrival
        date departure
        string status
        numeric total_amount
        numeric paid_amount
        numeric balance
    }

    BOOKINGS ||--o{ BOOKING_ROOMS : "booking_id"
    ROOMS ||--o{ BOOKING_ROOMS : "room_id"
    BOOKING_ROOMS {
        string booking_id PK_FK
        int room_id PK_FK
    }

    BOOKINGS ||--o{ BOOKING_TAGS : "booking_id"
    BOOKING_TAGS {
        string booking_id PK_FK
        string tag PK
    }

    BOOKINGS ||--o{ BOOKING_COMMENTS : "booking_id"
    BOOKING_COMMENTS {
        int id PK
        string booking_id FK
        string author
        string comment_text
    }

    BOOKINGS ||--o{ BOOKING_AUDIT_LOG : "booking_id"
    BOOKING_AUDIT_LOG {
        int id PK
        string booking_id FK
        string action
        string changed_by
    }

    SPECIAL_DATES {
        int id PK
        string name
        date from_date
        date to_date
    }
```

## Relationship summary

One-to-many (1:N):
- `designations` → `users` (a designation has many users; ON DELETE SET NULL)
- `floors` → `rooms`, `room_categories` → `rooms` (ON DELETE RESTRICT — can't delete a category/floor while rooms still reference it)
- `travel_agents` / `room_categories` / `seasons` → `travel_agent_rates` (ON DELETE CASCADE — a rate row is meaningless without its agent/category/season)
- `room_categories` / `travel_agents` / `third_parties` → `bookings` (ON DELETE SET NULL — preserves booking history if a lookup row is later removed)
- `bookings` → `booking_comments`, `bookings` → `booking_audit_log` (ON DELETE CASCADE)

Many-to-many (N:N), via real association tables:
- `bookings` ⇄ `rooms` through `booking_rooms` (a multi-room booking spans several rooms; a room appears on many bookings over time)
- `bookings` ⇄ tags through `booking_tags`

Standalone (no FK needed):
- `special_dates` — calendar markers independent of any other entity

`special_dates` has no relationships into the rest of the schema by design — it's a calendar annotation table consumed by the frontend calendar view directly.
