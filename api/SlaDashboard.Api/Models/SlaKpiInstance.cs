using System.Text.Json.Serialization;

namespace SlaDashboard.Api.Models;

public class SlaKpiInstance
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("kpiId")]
    public string KpiId { get; set; } = string.Empty;

    [JsonPropertyName("kpiName")]
    public string KpiName { get; set; } = string.Empty;

    [JsonPropertyName("regardingId")]
    public string RegardingId { get; set; } = string.Empty;

    [JsonPropertyName("regardingType")]
    public string RegardingType { get; set; } = string.Empty;

    [JsonPropertyName("regardingNumber")]
    public string RegardingNumber { get; set; } = string.Empty;

    [JsonPropertyName("regardingSubject")]
    public string RegardingSubject { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("failureTime")]
    public string? FailureTime { get; set; }

    [JsonPropertyName("warningTime")]
    public string? WarningTime { get; set; }

    [JsonPropertyName("succeededOn")]
    public string? SucceededOn { get; set; }

    [JsonPropertyName("pausedOn")]
    public string? PausedOn { get; set; }

    [JsonPropertyName("createdOn")]
    public string CreatedOn { get; set; } = string.Empty;

    [JsonPropertyName("modifiedOn")]
    public string ModifiedOn { get; set; } = string.Empty;

    [JsonPropertyName("owner")]
    public string Owner { get; set; } = string.Empty;

    [JsonPropertyName("team")]
    public string Team { get; set; } = string.Empty;

    [JsonPropertyName("priority")]
    public string Priority { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("isCaseResolved")]
    public bool IsCaseResolved { get; set; }
}
