using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using SlaDashboard.Api.Models;
using SlaDashboard.Api.Services;

namespace SlaDashboard.Api.Endpoints;

public static class SlaEndpoints
{
    public static void MapSlaEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/health", () =>
        {
            return Results.Ok(new { success = true });
        })
        .WithName("HealthCheck");

        app.MapGet("/api/sla/kpis", async (ISlaService slaService, ILogger<Program> logger, DateTime? startDate, DateTime? endDate) =>
        {
            try
            {
                var kpis = await slaService.GetSlaKpisAsync(startDate, endDate);
                return Results.Ok(new { items = kpis });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to fetch SLA KPIs from Dataverse API");
                return Results.Problem("An error occurred while retrieving SLA data.");
            }
        })
        .WithName("GetSlaKpis");
    }
}
