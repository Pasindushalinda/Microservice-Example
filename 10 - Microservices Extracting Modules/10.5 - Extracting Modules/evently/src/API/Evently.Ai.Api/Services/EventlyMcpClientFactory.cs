using ModelContextProtocol.Client;

namespace Evently.Ai.Api.Services;

/// <summary>
/// Creates a short-lived MCP client per chat request, carrying the caller's own bearer
/// token so tool calls resolve to that customer downstream (gateway -> ticketing module's
/// ICustomerContext). Registered scoped, not singleton, because the token is per-user.
/// </summary>
internal sealed class EventlyMcpClientFactory(IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
{
    public async Task<McpClient> CreateAsync(CancellationToken cancellationToken)
    {
        string? authorizationHeader = httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();

        if (string.IsNullOrWhiteSpace(authorizationHeader))
        {
            throw new InvalidOperationException("No bearer token was present on the incoming chat request.");
        }

#pragma warning disable CA2000 // ownership transfers to the McpClient, which disposes it on DisposeAsync
        var transport = new HttpClientTransport(new HttpClientTransportOptions
        {
            Endpoint = new Uri(configuration["Evently:McpUrl"]!),
            TransportMode = HttpTransportMode.AutoDetect,
            AdditionalHeaders = new Dictionary<string, string>
            {
                ["Authorization"] = authorizationHeader
            }
        });
#pragma warning restore CA2000

        return await McpClient.CreateAsync(transport, cancellationToken: cancellationToken).ConfigureAwait(false);
    }
}
