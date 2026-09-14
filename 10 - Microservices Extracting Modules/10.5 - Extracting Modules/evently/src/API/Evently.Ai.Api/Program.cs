using System.ClientModel;
using Azure.AI.OpenAI;
using Evently.Ai.Api.Authentication;
using Evently.Ai.Api.OpenTelemetry;
using Evently.Ai.Api.Services;
using Microsoft.Extensions.AI;
using ModelContextProtocol.Client;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using OpenAIChatClient = OpenAI.Chat.ChatClient;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, loggerConfig) => loggerConfig.ReadFrom.Configuration(context.Configuration));

builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<EventlyMcpClientFactory>();

string azureOpenAiEndpoint = builder.Configuration["AzureOpenAI:Endpoint"]
    ?? throw new InvalidOperationException("AzureOpenAI:Endpoint is not configured.");
string azureOpenAiApiKey = builder.Configuration["AzureOpenAI:ApiKey"]
    ?? throw new InvalidOperationException("AzureOpenAI:ApiKey is not configured.");
string azureOpenAiChatDeployment = builder.Configuration["AzureOpenAI:ChatDeployment"]
    ?? throw new InvalidOperationException("AzureOpenAI:ChatDeployment is not configured.");

builder.Services.AddChatClient(sp =>
{
    var azureClient = new AzureOpenAIClient(new Uri(azureOpenAiEndpoint), new ApiKeyCredential(azureOpenAiApiKey));
    OpenAIChatClient client = azureClient.GetChatClient(azureOpenAiChatDeployment);
    return client.AsIChatClient();
})
.UseFunctionInvocation(configure: c => c.MaximumIterationsPerRequest = 8)
.UseLogging();

builder.Services.AddAuthentication().AddJwtBearer();
builder.Services.ConfigureOptions<JwtBearerConfigureOptions>();
builder.Services.AddAuthorization();

builder.Services
    .AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService(DiagnosticsConfig.ServiceName))
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation();

        tracing.AddOtlpExporter();
    });

WebApplication app = builder.Build();

string systemPrompt = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "SystemPrompt.txt"));

app.UseSerilogRequestLogging();

app.UseAuthentication();

app.UseAuthorization();

app.MapPost("ai/chat", async (
    List<ChatMessage> messages,
    IChatClient chatClient,
    EventlyMcpClientFactory mcpClientFactory,
    CancellationToken cancellationToken) =>
{
    await using McpClient mcpClient = await mcpClientFactory.CreateAsync(cancellationToken).ConfigureAwait(false);
    IList<McpClientTool> tools = await mcpClient.ListToolsAsync(cancellationToken: cancellationToken)
        .ConfigureAwait(false);

    // No Temperature: gpt-5-nano is a reasoning-tier model and Azure OpenAI rejects
    // a non-default temperature for that model family.
    var chatOptions = new ChatOptions
    {
        Tools = [.. tools],
        MaxOutputTokens = 4000
    };

    var withSystemPrompt = new List<ChatMessage> { new(ChatRole.System, systemPrompt) };
    withSystemPrompt.AddRange(messages);

    ChatResponse response = await chatClient.GetResponseAsync(withSystemPrompt, chatOptions, cancellationToken)
        .ConfigureAwait(false);

    return Results.Ok(response.Messages);
})
.RequireAuthorization();

app.Run();
