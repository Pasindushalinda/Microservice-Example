using System.ComponentModel;
using Evently.Mcp.Services;
using ModelContextProtocol.Server;

namespace Evently.Mcp;

[McpServerToolType]
internal static class EventlyTools
{
    [McpServerTool, Description("Searches published events, optionally filtered by category and date range.")]
    public static Task<SearchEventsResponse> SearchEvents(
        EventlyApiClient client,
        [Description("Optional category id to filter by")] Guid? categoryId = null,
        [Description("Earliest event start date (UTC)")] DateTime? startDate = null,
        [Description("Latest event start date (UTC)")] DateTime? endDate = null,
        CancellationToken cancellationToken = default)
        => client.SearchEventsAsync(categoryId, startDate, endDate, cancellationToken);

    [McpServerTool, Description("Retrieves all event categories.")]
    public static Task<IReadOnlyList<CategoryResponse>> GetCategories(
        EventlyApiClient client,
        CancellationToken cancellationToken = default)
        => client.GetCategoriesAsync(cancellationToken);

    [McpServerTool, Description("Retrieves the ticket types and prices available for an event.")]
    public static Task<IReadOnlyList<TicketTypeResponse>> GetTicketTypes(
        EventlyApiClient client,
        [Description("The event id")] Guid eventId,
        CancellationToken cancellationToken = default)
        => client.GetTicketTypesAsync(eventId, cancellationToken);

    [McpServerTool, Description("Retrieves the orders belonging to the current authenticated customer. Never accepts a customer id — it is always the caller.")]
    public static Task<IReadOnlyList<OrderResponse>> GetMyOrders(
        EventlyApiClient client,
        CancellationToken cancellationToken = default)
        => client.GetOrdersAsync(cancellationToken);

    [McpServerTool, Description("Retrieves the current authenticated customer's shopping cart. Never accepts a customer id — it is always the caller.")]
    public static Task<CartResponse> GetMyCart(EventlyApiClient client, CancellationToken cancellationToken = default)
        => client.GetCartAsync(cancellationToken);
}
