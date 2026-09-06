import { api } from './client';
import type {
  Cart,
  Category,
  CreateEventRequest,
  CreateTicketTypeRequest,
  EventDetail,
  EventListItem,
  EventStatistics,
  OrderDetail,
  OrderListItem,
  RegisterUserRequest,
  RescheduleEventRequest,
  SearchEventsParams,
  SearchEventsResponse,
  Ticket,
  TicketType,
  UpdateProfileRequest,
  UserProfile,
} from './types';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export const eventsApi = {
  list: () => api.get<EventListItem[]>('/events').then((r) => r.data),

  search: (params: SearchEventsParams) =>
    api
      .get<SearchEventsResponse>('/events/search', {
        params: {
          categoryId: params.categoryId || undefined,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined,
          page: params.page ?? 0,
          pageSize: params.pageSize ?? 15,
        },
      })
      .then((r) => r.data),

  get: (id: string) => api.get<EventDetail>(`/events/${id}`).then((r) => r.data),

  create: (body: CreateEventRequest) =>
    api.post<string>('/events', body).then((r) => r.data),

  publish: (id: string) => api.put(`/events/${id}/publish`).then(() => undefined),

  reschedule: (id: string, body: RescheduleEventRequest) =>
    api.put(`/events/${id}/reschedule`, body).then(() => undefined),

  cancel: (id: string) => api.delete(`/events/${id}/cancel`).then(() => undefined),
};

// ---------------------------------------------------------------------------
// Ticket types
// ---------------------------------------------------------------------------

export const ticketTypesApi = {
  listForEvent: (eventId: string) =>
    api.get<TicketType[]>('/ticket-types', { params: { eventId } }).then((r) => r.data),

  get: (id: string) => api.get<TicketType>(`/ticket-types/${id}`).then((r) => r.data),

  create: (body: CreateTicketTypeRequest) =>
    api.post<string>('/ticket-types', body).then((r) => r.data),

  changePrice: (id: string, price: number) =>
    api.put(`/ticket-types/${id}/price`, { price }).then(() => undefined),
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories').then((r) => r.data),

  get: (id: string) => api.get<Category>(`/categories/${id}`).then((r) => r.data),

  create: (name: string) => api.post<string>('/categories', { name }).then((r) => r.data),

  rename: (id: string, name: string) =>
    api.put(`/categories/${id}`, { name }).then(() => undefined),

  archive: (id: string) => api.put(`/categories/${id}/archive`).then(() => undefined),
};

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export const cartApi = {
  get: () => api.get<Cart>('/carts').then((r) => r.data),

  add: (ticketTypeId: string, quantity: number) =>
    api.put('/carts/add', { ticketTypeId, quantity }).then(() => undefined),

  remove: (ticketTypeId: string) =>
    api.put('/carts/remove', { ticketTypeId }).then(() => undefined),

  clear: () => api.delete('/carts').then(() => undefined),
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const ordersApi = {
  list: () => api.get<OrderListItem[]>('/orders').then((r) => r.data),

  get: (id: string) => api.get<OrderDetail>(`/orders/${id}`).then((r) => r.data),

  /** POST orders — turns the current cart into an order. Returns nothing today. */
  create: () => api.post('/orders').then(() => undefined),
};

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------

export const ticketsApi = {
  get: (id: string) => api.get<Ticket>(`/tickets/${id}`).then((r) => r.data),

  forOrder: (orderId: string) =>
    api.get<Ticket[]>(`/tickets/order/${orderId}`).then((r) => r.data),

  byCode: (code: string) => api.get<Ticket>(`/tickets/code/${code}`).then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export const attendanceApi = {
  checkIn: (ticketId: string) =>
    api.put('/attendees/check-in', { ticketId }).then(() => undefined),

  eventStatistics: (eventId: string) =>
    api.get<EventStatistics>(`/event-statistics/${eventId}`).then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const usersApi = {
  register: (body: RegisterUserRequest) =>
    api.post<string>('/users/register', body).then((r) => r.data),

  profile: () => api.get<UserProfile>('/users/profile').then((r) => r.data),

  /** Permission codes for the caller, resolved server-side from the Users module. */
  permissions: () => api.get<string[]>('/users/permissions').then((r) => r.data),

  updateProfile: (body: UpdateProfileRequest) =>
    api.put('/users/profile', body).then(() => undefined),
};
