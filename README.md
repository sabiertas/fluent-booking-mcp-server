# Fluent Booking MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with full access to the [Fluent Booking](https://fluentbooking.com) scheduling API, enabling calendar management, event configuration, booking operations, and availability checks through natural language.

## Features

- Calendar CRUD operations (create, read, update, delete)
- Event management with support for one-on-one, group, and round-robin types
- Booking lifecycle (create, cancel, reschedule)
- Real-time availability slot checking
- Host/team member listing
- Booking reports and analytics

## Available Tools

| Tool | Description |
|------|-------------|
| `fluent_booking_list_calendars` | List all calendars with pagination |
| `fluent_booking_get_calendar` | Get calendar details by ID |
| `fluent_booking_create_calendar` | Create a new calendar |
| `fluent_booking_update_calendar` | Update calendar details |
| `fluent_booking_delete_calendar` | Delete a calendar |
| `fluent_booking_list_events` | List events for a calendar |
| `fluent_booking_get_event` | Get event details by ID |
| `fluent_booking_create_event` | Create an event in a calendar (one-on-one, group, or round-robin) |
| `fluent_booking_update_event` | Update event details |
| `fluent_booking_delete_event` | Delete an event |
| `fluent_booking_list_bookings` | List all bookings with filters (status, event, date range, search) |
| `fluent_booking_get_booking` | Get booking details by ID |
| `fluent_booking_create_booking` | Create a booking for an event with guest information |
| `fluent_booking_cancel_booking` | Cancel a booking |
| `fluent_booking_reschedule_booking` | Reschedule a booking to a new date and time |
| `fluent_booking_get_available_slots` | Get available time slots for an event on a date range |
| `fluent_booking_list_hosts` | List all hosts/team members |
| `fluent_booking_get_reports` | Get booking reports and analytics |

## Requirements

- Node.js 18+
- WordPress site with [Fluent Booking](https://fluentbooking.com) installed and activated
- WordPress Application Password

## Quick Setup

### 1. Clone and build

```bash
git clone https://github.com/sabiertas/fluent-booking-mcp-server.git
cd fluent-booking-mcp-server
npm install
npm run build
```

### 2. Configure in Claude Code

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "fluent-booking": {
      "command": "node",
      "args": ["/path/to/fluent-booking-mcp-server/dist/fluent-booking-mcp-server.js"],
      "env": {
        "FLUENT_BOOKING_API_URL": "https://your-domain.com/wp-json/fluent-booking/v2",
        "FLUENT_BOOKING_API_USERNAME": "your-wp-username",
        "FLUENT_BOOKING_API_PASSWORD": "your-application-password"
      }
    }
  }
}
```

### 3. Configure in Cursor / other MCP clients

Same config pattern -- see your client's MCP documentation.

## Authentication

Uses WordPress Application Passwords (Basic Auth). Create one at:
`WordPress Admin > Users > Profile > Application Passwords`

## Contributing

PRs welcome. Please open an issue first to discuss changes.

## License

MIT
