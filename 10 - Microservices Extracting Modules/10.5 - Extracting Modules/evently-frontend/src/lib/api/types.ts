/**
 * Hand-written mirrors of the gateway response/request DTOs.
 *
 * When the two Swagger specs are available, replace these with generated types:
 *   npm run gen:api   (see package.json + openapi/ folder)
 * and re-export the relevant `components['schemas'][...]` from here so the rest
 * of the app keeps importing from one place.
 */

// ---------------------------------------------------------------------------
// Events module
// ---------------------------------------------------------------------------

export interface EventListItem {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  location: string;
  startsAtUtc: string;
  endsAtUtc: string | null;
}

export interface EventDetail extends EventListItem {
  ticketTypes: EventTicketType[];
}

/** Ticket type as embedded in an event detail response. */
export interface EventTicketType {
  ticketTypeId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

/** Ticket type as returned by GET ticket-types?eventId= and GET ticket-types/{id}. */
export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  isArchived: boolean;
}

export interface SearchEventsResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  events: EventListItem[];
}

export interface CreateEventRequest {
  categoryId: string;
  title: string;
  description: string;
  location: string;
  startsAtUtc: string;
  endsAtUtc?: string | null;
}

export interface RescheduleEventRequest {
  startsAtUtc: string;
  endsAtUtc?: string | null;
}

export interface CreateTicketTypeRequest {
  eventId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}

export interface SearchEventsParams {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Ticketing module
// ---------------------------------------------------------------------------

export interface CartItem {
  ticketTypeId: string;
  quantity: number;
  price: number;
  currency: string;
}

export interface Cart {
  customerId: string;
  items: CartItem[];
}

/** OrderStatus enum — serialized as its integer value by the API. */
export enum OrderStatus {
  Pending = 0,
  Paid = 1,
  Refunded = 2,
  Canceled = 3,
}

export interface OrderListItem {
  id: string;
  customerId: string;
  status: OrderStatus;
  totalPrice: number;
  createdAtUtc: string;
}

export interface OrderItem {
  orderItemId: string;
  orderId: string;
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
  price: number;
  currency: string;
}

export interface OrderDetail extends OrderListItem {
  orderItems: OrderItem[];
}

export interface Ticket {
  id: string;
  customerId: string;
  orderId: string;
  eventId: string;
  ticketTypeId: string;
  code: string;
  createdAtUtc: string;
}

// ---------------------------------------------------------------------------
// Attendance module
// ---------------------------------------------------------------------------

export interface EventStatistics {
  eventId: string;
  title: string;
  description: string;
  location: string;
  startsAtUtc: string;
  endsAtUtc: string | null;
  ticketsSold: number;
  attendeesCheckedIn: number;
  duplicateCheckInTickets: string[];
  invalidCheckInTickets: string[];
}

// ---------------------------------------------------------------------------
// Users module
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
}

// ---------------------------------------------------------------------------
// Problem Details (RFC 7807) — what the gateway returns on failure
// ---------------------------------------------------------------------------

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: { code: string; description: string }[] | Record<string, string[]>;
}
