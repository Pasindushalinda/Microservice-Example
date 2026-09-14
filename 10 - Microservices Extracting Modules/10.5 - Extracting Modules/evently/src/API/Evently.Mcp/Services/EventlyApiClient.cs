using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Evently.Mcp.Services;

internal sealed class EventlyApiClient(HttpClient httpClient, IHttpContextAccessor httpContextAccessor)
{
    private void Authorize()
    {
        string? header = httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();

        if (string.IsNullOrWhiteSpace(header))
        {
            throw new InvalidOperationException("No bearer token was present on the incoming MCP request.");
        }

        httpClient.DefaultRequestHeaders.Authorization = AuthenticationHeaderValue.Parse(header);
    }

    public async Task<SearchEventsResponse> SearchEventsAsync(
        Guid? categoryId,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken)
    {
        Authorize();

        var query = new List<string>();
        if (categoryId is not null)
        {
            query.Add($"categoryId={categoryId}");
        }

        if (startDate is not null)
        {
            query.Add($"startDate={startDate.Value.ToString("O", CultureInfo.InvariantCulture)}");
        }

        if (endDate is not null)
        {
            query.Add($"endDate={endDate.Value.ToString("O", CultureInfo.InvariantCulture)}");
        }

        string requestUri = query.Count > 0 ? $"events/search?{string.Join('&', query)}" : "events/search";

        using HttpResponseMessage response = await httpClient.GetAsync(requestUri, cancellationToken)
            .ConfigureAwait(false);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<SearchEventsResponse>(cancellationToken)
            .ConfigureAwait(false) ?? new SearchEventsResponse(0, 0, 0, []);
    }

    public async Task<IReadOnlyList<CategoryResponse>> GetCategoriesAsync(CancellationToken cancellationToken)
    {
        Authorize();

        using HttpResponseMessage response = await httpClient.GetAsync("categories", cancellationToken)
            .ConfigureAwait(false);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<List<CategoryResponse>>(cancellationToken)
            .ConfigureAwait(false) ?? [];
    }

    public async Task<IReadOnlyList<TicketTypeResponse>> GetTicketTypesAsync(
        Guid eventId,
        CancellationToken cancellationToken)
    {
        Authorize();

        using HttpResponseMessage response = await httpClient
            .GetAsync($"ticket-types?eventId={eventId}", cancellationToken)
            .ConfigureAwait(false);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<List<TicketTypeResponse>>(cancellationToken)
            .ConfigureAwait(false) ?? [];
    }

    public async Task<IReadOnlyList<OrderResponse>> GetOrdersAsync(CancellationToken cancellationToken)
    {
        Authorize();

        // No customerId parameter: the ticketing module resolves it from the caller's
        // forwarded bearer token via ICustomerContext, so tool callers can't read other
        // customers' orders by passing a different id.
        using HttpResponseMessage response = await httpClient.GetAsync("orders", cancellationToken)
            .ConfigureAwait(false);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<List<OrderResponse>>(cancellationToken)
            .ConfigureAwait(false) ?? [];
    }

    public async Task<CartResponse> GetCartAsync(CancellationToken cancellationToken)
    {
        Authorize();

        using HttpResponseMessage response = await httpClient.GetAsync("carts", cancellationToken)
            .ConfigureAwait(false);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<CartResponse>(cancellationToken)
            .ConfigureAwait(false) ?? new CartResponse(Guid.Empty, []);
    }
}
