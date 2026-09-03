using SlaDashboard.Api.Models;

namespace SlaDashboard.Api.Services;

public interface ISlaService
{
    Task<List<SlaKpiInstance>> GetSlaKpisAsync(DateTime? startDate = null, DateTime? endDate = null);
}
