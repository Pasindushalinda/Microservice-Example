namespace Evently.Mcp;

internal sealed record EventResponse(
    Guid Id,
    Guid CategoryId,
    string Title,
    string Description,
    string Location,
    DateTime StartsAtUtc,
    DateTime? EndsAtUtc);

internal sealed record SearchEventsResponse(
    int Page,
    int PageSize,
    int TotalCount,
    IReadOnlyCollection<EventResponse> Events);

internal sealed record CategoryResponse(Guid Id, string Name, bool IsArchived);

internal sealed record TicketTypeResponse(
    Guid Id,
    Guid EventId,
    string Name,
    decimal Price,
    string Currency,
    decimal Quantity);

internal enum OrderStatus
{
    Pending = 0,
    Paid = 1,
    Refunded = 2,
    Canceled = 3
}

internal sealed record OrderResponse(
    Guid Id,
    Guid CustomerId,
    OrderStatus Status,
    decimal TotalPrice,
    DateTime CreatedAtUtc);

internal sealed record CartItemResponse(Guid TicketTypeId, decimal Quantity, decimal Price, string Currency);

internal sealed record CartResponse(Guid CustomerId, IReadOnlyList<CartItemResponse> Items);
