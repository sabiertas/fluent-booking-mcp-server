#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const FLUENT_BOOKING_API_URL = process.env.FLUENT_BOOKING_API_URL || 'https://your-domain.com/wp-json/fluent-booking/v2';
const FLUENT_BOOKING_API_USERNAME = process.env.FLUENT_BOOKING_API_USERNAME || '';
const FLUENT_BOOKING_API_PASSWORD = process.env.FLUENT_BOOKING_API_PASSWORD || '';

/**
 * Fluent Booking API Client
 * Based on: https://developers.fluentbooking.com
 */
class FluentBookingClient {
  private apiClient: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string, username: string, password: string) {
    this.baseURL = baseURL;

    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    this.apiClient = axios.create({
      baseURL,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    // Error interceptor
    this.apiClient.interceptors.response.use(
      response => response,
      error => {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Fluent Booking API Error: ${message}`);
      }
    );
  }

  // ===== CALENDARS =====

  async listCalendars(params: any = {}) {
    const response = await this.apiClient.get('/calendars', { params });
    return response.data;
  }

  async getCalendar(calendarId: number) {
    const response = await this.apiClient.get(`/calendars/${calendarId}`);
    return response.data;
  }

  async createCalendar(data: {
    title: string;
    description?: string;
    type?: string;
  }) {
    const response = await this.apiClient.post('/calendars', data);
    return response.data;
  }

  async updateCalendar(calendarId: number, data: any) {
    const response = await this.apiClient.put(`/calendars/${calendarId}`, data);
    return response.data;
  }

  async deleteCalendar(calendarId: number) {
    const response = await this.apiClient.delete(`/calendars/${calendarId}`);
    return response.data;
  }

  // ===== EVENTS =====

  async listEvents(calendarId: number, params: any = {}) {
    const response = await this.apiClient.get(`/calendars/${calendarId}/events`, { params });
    return response.data;
  }

  async getEvent(eventId: number) {
    const response = await this.apiClient.get(`/events/${eventId}`);
    return response.data;
  }

  async createEvent(calendarId: number, data: {
    title: string;
    duration?: number;
    type?: string;
    description?: string;
    [key: string]: any;
  }) {
    const response = await this.apiClient.post(`/calendars/${calendarId}/events`, data);
    return response.data;
  }

  async updateEvent(eventId: number, data: any) {
    const response = await this.apiClient.put(`/events/${eventId}`, data);
    return response.data;
  }

  async deleteEvent(eventId: number) {
    const response = await this.apiClient.delete(`/events/${eventId}`);
    return response.data;
  }

  // ===== BOOKINGS =====

  async listBookings(params: any = {}) {
    const response = await this.apiClient.get('/bookings', { params });
    return response.data;
  }

  async getBooking(bookingId: number) {
    const response = await this.apiClient.get(`/bookings/${bookingId}`);
    return response.data;
  }

  async createBooking(eventId: number, data: {
    date: string;
    time: string;
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
    [key: string]: any;
  }) {
    const response = await this.apiClient.post(`/bookings/create/${eventId}`, data);
    return response.data;
  }

  async cancelBooking(bookingId: number, data: any = {}) {
    const response = await this.apiClient.patch(`/bookings/${bookingId}/cancel`, data);
    return response.data;
  }

  async rescheduleBooking(bookingId: number, data: {
    date: string;
    time: string;
    [key: string]: any;
  }) {
    const response = await this.apiClient.patch(`/bookings/${bookingId}/reschedule`, data);
    return response.data;
  }

  // ===== SLOTS / AVAILABILITY =====

  async getAvailableSlots(eventId: number, params: {
    date?: string;
    timezone?: string;
    start_date?: string;
    end_date?: string;
    [key: string]: any;
  } = {}) {
    const response = await this.apiClient.get(`/bookings/slots/${eventId}`, { params });
    return response.data;
  }

  // ===== HOSTS =====

  async listHosts(params: any = {}) {
    const response = await this.apiClient.get('/admin/hosts', { params });
    return response.data;
  }

  // ===== REPORTS =====

  async getReports(params: any = {}) {
    const response = await this.apiClient.get('/admin/reports', { params });
    return response.data;
  }
}

// ===== MCP SERVER SETUP =====

const server = new Server(
  {
    name: 'fluent-booking-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const client = new FluentBookingClient(
  FLUENT_BOOKING_API_URL,
  FLUENT_BOOKING_API_USERNAME,
  FLUENT_BOOKING_API_PASSWORD
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ===== CALENDARS =====
      {
        name: 'fluent_booking_list_calendars',
        description: 'List all calendars with pagination',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number (default: 1)' },
            per_page: { type: 'number', description: 'Records per page (default: 10)' },
            search: { type: 'string', description: 'Search by calendar title' },
          },
        },
      },
      {
        name: 'fluent_booking_get_calendar',
        description: 'Get calendar details by ID',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'number', description: 'Calendar ID' },
          },
          required: ['calendarId'],
        },
      },
      {
        name: 'fluent_booking_create_calendar',
        description: 'Create a new calendar',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Calendar title' },
            description: { type: 'string', description: 'Calendar description' },
            type: { type: 'string', description: 'Calendar type' },
          },
          required: ['title'],
        },
      },
      {
        name: 'fluent_booking_update_calendar',
        description: 'Update calendar details',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'number', description: 'Calendar ID' },
            title: { type: 'string', description: 'Calendar title' },
            description: { type: 'string', description: 'Calendar description' },
            type: { type: 'string', description: 'Calendar type' },
          },
          required: ['calendarId'],
        },
      },
      {
        name: 'fluent_booking_delete_calendar',
        description: 'Delete a calendar',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'number', description: 'Calendar ID to delete' },
          },
          required: ['calendarId'],
        },
      },

      // ===== EVENTS =====
      {
        name: 'fluent_booking_list_events',
        description: 'List events for a calendar',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'number', description: 'Calendar ID' },
            page: { type: 'number', description: 'Page number' },
            per_page: { type: 'number', description: 'Records per page' },
          },
          required: ['calendarId'],
        },
      },
      {
        name: 'fluent_booking_get_event',
        description: 'Get event details by ID',
        inputSchema: {
          type: 'object',
          properties: {
            eventId: { type: 'number', description: 'Event ID' },
          },
          required: ['eventId'],
        },
      },
      {
        name: 'fluent_booking_create_event',
        description: 'Create an event in a calendar (one-on-one, group, or round-robin)',
        inputSchema: {
          type: 'object',
          properties: {
            calendarId: { type: 'number', description: 'Calendar ID to create the event in' },
            title: { type: 'string', description: 'Event title' },
            duration: { type: 'number', description: 'Event duration in minutes' },
            type: { type: 'string', description: 'Event type: one-on-one, group, round-robin' },
            description: { type: 'string', description: 'Event description' },
            color: { type: 'string', description: 'Event color hex code' },
            location_type: { type: 'string', description: 'Location type (e.g., online, in-person)' },
            location: { type: 'string', description: 'Location details or meeting URL' },
          },
          required: ['calendarId', 'title'],
        },
      },
      {
        name: 'fluent_booking_update_event',
        description: 'Update event details',
        inputSchema: {
          type: 'object',
          properties: {
            eventId: { type: 'number', description: 'Event ID' },
            title: { type: 'string', description: 'Event title' },
            duration: { type: 'number', description: 'Event duration in minutes' },
            type: { type: 'string', description: 'Event type' },
            description: { type: 'string', description: 'Event description' },
            color: { type: 'string', description: 'Event color hex code' },
            location_type: { type: 'string', description: 'Location type' },
            location: { type: 'string', description: 'Location details or meeting URL' },
          },
          required: ['eventId'],
        },
      },
      {
        name: 'fluent_booking_delete_event',
        description: 'Delete an event',
        inputSchema: {
          type: 'object',
          properties: {
            eventId: { type: 'number', description: 'Event ID to delete' },
          },
          required: ['eventId'],
        },
      },

      // ===== BOOKINGS =====
      {
        name: 'fluent_booking_list_bookings',
        description: 'List all bookings with filters (status, event_id, date range, search)',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number (default: 1)' },
            per_page: { type: 'number', description: 'Records per page (default: 10)' },
            status: { type: 'string', description: 'Filter by status (e.g., scheduled, completed, cancelled)' },
            event_id: { type: 'number', description: 'Filter by event ID' },
            search: { type: 'string', description: 'Search by guest name or email' },
            start_date: { type: 'string', description: 'Filter start date (YYYY-MM-DD)' },
            end_date: { type: 'string', description: 'Filter end date (YYYY-MM-DD)' },
          },
        },
      },
      {
        name: 'fluent_booking_get_booking',
        description: 'Get booking details by ID',
        inputSchema: {
          type: 'object',
          properties: {
            bookingId: { type: 'number', description: 'Booking ID' },
          },
          required: ['bookingId'],
        },
      },
      {
        name: 'fluent_booking_create_booking',
        description: 'Create a booking for an event with guest information',
        inputSchema: {
          type: 'object',
          properties: {
            event_id: { type: 'number', description: 'Event ID to book' },
            date: { type: 'string', description: 'Booking date (YYYY-MM-DD)' },
            time: { type: 'string', description: 'Booking time (HH:MM)' },
            guest_name: { type: 'string', description: 'Guest full name' },
            guest_email: { type: 'string', description: 'Guest email address' },
            guest_phone: { type: 'string', description: 'Guest phone number' },
            notes: { type: 'string', description: 'Additional notes for the booking' },
          },
          required: ['event_id', 'date', 'time'],
        },
      },
      {
        name: 'fluent_booking_cancel_booking',
        description: 'Cancel a booking',
        inputSchema: {
          type: 'object',
          properties: {
            bookingId: { type: 'number', description: 'Booking ID to cancel' },
            reason: { type: 'string', description: 'Cancellation reason' },
          },
          required: ['bookingId'],
        },
      },
      {
        name: 'fluent_booking_reschedule_booking',
        description: 'Reschedule a booking to a new date and time',
        inputSchema: {
          type: 'object',
          properties: {
            bookingId: { type: 'number', description: 'Booking ID to reschedule' },
            date: { type: 'string', description: 'New date (YYYY-MM-DD)' },
            time: { type: 'string', description: 'New time (HH:MM)' },
            reason: { type: 'string', description: 'Reschedule reason' },
          },
          required: ['bookingId', 'date', 'time'],
        },
      },

      // ===== SLOTS / AVAILABILITY =====
      {
        name: 'fluent_booking_get_available_slots',
        description: 'Get available time slots for an event on a date range',
        inputSchema: {
          type: 'object',
          properties: {
            eventId: { type: 'number', description: 'Event ID' },
            date: { type: 'string', description: 'Date to check (YYYY-MM-DD)' },
            start_date: { type: 'string', description: 'Range start date (YYYY-MM-DD)' },
            end_date: { type: 'string', description: 'Range end date (YYYY-MM-DD)' },
            timezone: { type: 'string', description: 'Timezone (e.g., America/New_York, Europe/Madrid)' },
          },
          required: ['eventId'],
        },
      },

      // ===== HOSTS =====
      {
        name: 'fluent_booking_list_hosts',
        description: 'List all hosts/team members',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'number', description: 'Page number' },
            per_page: { type: 'number', description: 'Records per page' },
            search: { type: 'string', description: 'Search by host name' },
          },
        },
      },

      // ===== REPORTS =====
      {
        name: 'fluent_booking_get_reports',
        description: 'Get booking reports and analytics',
        inputSchema: {
          type: 'object',
          properties: {
            start_date: { type: 'string', description: 'Report start date (YYYY-MM-DD)' },
            end_date: { type: 'string', description: 'Report end date (YYYY-MM-DD)' },
            calendar_id: { type: 'number', description: 'Filter by calendar ID' },
            event_id: { type: 'number', description: 'Filter by event ID' },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ===== CALENDARS =====
      case 'fluent_booking_list_calendars':
        return { content: [{ type: 'text', text: JSON.stringify(await client.listCalendars(args || {}), null, 2) }] };
      case 'fluent_booking_get_calendar':
        return { content: [{ type: 'text', text: JSON.stringify(await client.getCalendar((args as any)?.calendarId), null, 2) }] };
      case 'fluent_booking_create_calendar':
        return { content: [{ type: 'text', text: JSON.stringify(await client.createCalendar(args as any), null, 2) }] };
      case 'fluent_booking_update_calendar': {
        const { calendarId, ...updateData } = args as any;
        return { content: [{ type: 'text', text: JSON.stringify(await client.updateCalendar(calendarId, updateData), null, 2) }] };
      }
      case 'fluent_booking_delete_calendar':
        return { content: [{ type: 'text', text: JSON.stringify(await client.deleteCalendar((args as any)?.calendarId), null, 2) }] };

      // ===== EVENTS =====
      case 'fluent_booking_list_events': {
        const { calendarId, ...eventParams } = args as any;
        return { content: [{ type: 'text', text: JSON.stringify(await client.listEvents(calendarId, eventParams), null, 2) }] };
      }
      case 'fluent_booking_get_event':
        return { content: [{ type: 'text', text: JSON.stringify(await client.getEvent((args as any)?.eventId), null, 2) }] };
      case 'fluent_booking_create_event': {
        const { calendarId, ...eventData } = args as any;
        return { content: [{ type: 'text', text: JSON.stringify(await client.createEvent(calendarId, eventData), null, 2) }] };
      }
      case 'fluent_booking_update_event': {
        const { eventId, ...eventUpdateData } = args as any;
        return { content: [{ type: 'text', text: JSON.stringify(await client.updateEvent(eventId, eventUpdateData), null, 2) }] };
      }
      case 'fluent_booking_delete_event':
        return { content: [{ type: 'text', text: JSON.stringify(await client.deleteEvent((args as any)?.eventId), null, 2) }] };

      // ===== BOOKINGS =====
      case 'fluent_booking_list_bookings':
        return { content: [{ type: 'text', text: JSON.stringify(await client.listBookings(args || {}), null, 2) }] };
      case 'fluent_booking_get_booking':
        return { content: [{ type: 'text', text: JSON.stringify(await client.getBooking((args as any)?.bookingId), null, 2) }] };
      case 'fluent_booking_create_booking': {
        const { event_id, ...bookingData } = args as any;
        return { content: [{ type: 'text', text: JSON.stringify(await client.createBooking(event_id, bookingData), null, 2) }] };
      }
      case 'fluent_booking_cancel_booking': {
        const { bookingId, ...cancelData } = args as any;
        return { content: [{ type: 'text', text: JSON.stringify(await client.cancelBooking(bookingId, cancelData), null, 2) }] };
      }
      case 'fluent_booking_reschedule_booking': {
        const { bookingId, ...rescheduleData } = args as any;
        return { content: [{ type: 'text', text: JSON.stringify(await client.rescheduleBooking(bookingId, rescheduleData), null, 2) }] };
      }

      // ===== SLOTS / AVAILABILITY =====
      case 'fluent_booking_get_available_slots': {
        const { eventId, ...slotParams } = args as any;
        return { content: [{ type: 'text', text: JSON.stringify(await client.getAvailableSlots(eventId, slotParams), null, 2) }] };
      }

      // ===== HOSTS =====
      case 'fluent_booking_list_hosts':
        return { content: [{ type: 'text', text: JSON.stringify(await client.listHosts(args || {}), null, 2) }] };

      // ===== REPORTS =====
      case 'fluent_booking_get_reports':
        return { content: [{ type: 'text', text: JSON.stringify(await client.getReports(args || {}), null, 2) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Fluent Booking MCP Server running on stdio');
  console.error(`API URL: ${FLUENT_BOOKING_API_URL}`);
  console.error(`Username: ${FLUENT_BOOKING_API_USERNAME}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
