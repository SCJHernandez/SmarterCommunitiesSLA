using SlaDashboard.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure CORS for React development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173") // Vite default ports
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure Dataverse ServiceClient singleton
builder.Services.AddSingleton(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var envUrl = configuration["Dataverse:EnvironmentUrl"];
    var clientId = configuration["Dataverse:ClientId"];
    var clientSecret = configuration["Dataverse:ClientSecret"];

    // In a real scenario you may want to return a dummy client or throw securely if config is missing
    if (string.IsNullOrEmpty(envUrl)) 
    {
        // Safe fallback for compilation/development without breaking immediately on boot
        return new Microsoft.PowerPlatform.Dataverse.Client.ServiceClient("AuthType=ClientSecret;Url=https://dummy.crm.dynamics.com;ClientId=dummy;ClientSecret=dummy;RequireNewInstance=true;");
    }

    var connectionString = $"AuthType=ClientSecret;Url={envUrl};ClientId={clientId};ClientSecret={clientSecret};RequireNewInstance=true;";
    return new Microsoft.PowerPlatform.Dataverse.Client.ServiceClient(connectionString);
});

// Register Memory Cache and Response Compression
builder.Services.AddMemoryCache();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});

// Register the SLA service
builder.Services.AddScoped<SlaDashboard.Api.Services.ISlaService, SlaDashboard.Api.Services.SlaDataverseService>();

var app = builder.Build();

app.UseResponseCompression();
app.UseCors("AllowReactApp");
app.UseHttpsRedirection();

// Map Endpoints
app.MapSlaEndpoints();

app.Run();
