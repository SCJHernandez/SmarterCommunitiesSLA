using Microsoft.Extensions.Caching.Memory;
using Microsoft.PowerPlatform.Dataverse.Client;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using SlaDashboard.Api.Models;

namespace SlaDashboard.Api.Services;

public class SlaDataverseService : ISlaService
{
    private readonly ServiceClient _serviceClient;
    private readonly ILogger<SlaDataverseService> _logger;
    private readonly IMemoryCache _cache;

    public SlaDataverseService(ServiceClient serviceClient, ILogger<SlaDataverseService> logger, IMemoryCache cache)
    {
        _serviceClient = serviceClient;
        _logger = logger;
        _cache = cache;
    }

    public async Task<List<SlaKpiInstance>> GetSlaKpisAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        string cacheKey = $"SlaKpis_{startDate?.ToString("yyyyMMdd")}_{endDate?.ToString("yyyyMMdd")}";

        if (_cache.TryGetValue(cacheKey, out List<SlaKpiInstance>? cachedKpis) && cachedKpis != null)
        {
            return cachedKpis;
        }

        var kpis = new List<SlaKpiInstance>();

        try
        {
            var query = new QueryExpression("slakpiinstance")
            {
                ColumnSet = new ColumnSet(
                    "slakpiinstanceid",
                    "name",
                    "msdyn_slaitemid",
                    "regarding",
                    "status",
                    "failuretime",
                    "warningtime",
                    "succeededon",
                    "createdon",
                    "modifiedon",
                    "pausedon",
                    "ownerid",
                    "owningteam"
                ),
                PageInfo = new PagingInfo
                {
                    Count = 5000,
                    PageNumber = 1,
                    ReturnTotalRecordCount = false
                }
            };

            // Order by most recent created cases first
            query.AddOrder("createdon", OrderType.Descending);

            if (startDate.HasValue || endDate.HasValue)
            {
                var filter = new FilterExpression(LogicalOperator.And);
                if (startDate.HasValue)
                    filter.AddCondition("createdon", ConditionOperator.GreaterEqual, startDate.Value.ToUniversalTime());
                if (endDate.HasValue)
                    filter.AddCondition("createdon", ConditionOperator.LessEqual, endDate.Value.ToUniversalTime());
                
                query.Criteria.AddFilter(filter);
            }

            // Link to Incident to fetch actual priority and case fields
            var incidentLink = query.AddLink("incident", "regarding", "incidentid", JoinOperator.LeftOuter);
            incidentLink.EntityAlias = "case";
            incidentLink.Columns = new ColumnSet("ticketnumber", "title", "prioritycode", "ownerid", "statecode");

            // Link from Incident to SystemUser to get the Case Owner's full name
            var caseOwnerLink = incidentLink.AddLink("systemuser", "ownerid", "systemuserid", JoinOperator.LeftOuter);
            caseOwnerLink.EntityAlias = "caseowner";
            caseOwnerLink.Columns = new ColumnSet("fullname");

            // Link to SLA Item to fetch true KPI ID
            var slaItemLink = query.AddLink("slaitem", "msdyn_slaitemid", "slaitemid", JoinOperator.LeftOuter);
            slaItemLink.EntityAlias = "slaitem";
            slaItemLink.Columns = new ColumnSet("msdyn_slakpiid", "name");

            while (true)
            {
                var response = await _serviceClient.RetrieveMultipleAsync(query);

                foreach (var entity in response.Entities)
                {
                    kpis.Add(MapToDto(entity));
                }

                if (response.MoreRecords)
                {
                    query.PageInfo.PageNumber++;
                    query.PageInfo.PagingCookie = response.PagingCookie;
                }
                else
                {
                    break;
                }
            }

            // Cache for 3 minutes to avoid hammering Dataverse on every page reload
            _cache.Set(cacheKey, kpis, TimeSpan.FromMinutes(3));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve and map SLA KPI instances from Dataverse.");
            throw;
        }

        return kpis;
    }

    private SlaKpiInstance MapToDto(Entity entity)
    {
        // Null-safe extraction helpers
        var regardingRef = entity.Contains("regarding") ? entity.GetAttributeValue<EntityReference>("regarding") : null;
        var slaOwnerRef = entity.Contains("ownerid") ? entity.GetAttributeValue<EntityReference>("ownerid") : null;
        
        // Extract AliasedValues from the linked incident
        var ticketNumber = GetAliasedValue<string>(entity, "case.ticketnumber");
        var caseTitle = GetAliasedValue<string>(entity, "case.title");
        var priorityOption = GetAliasedValue<OptionSetValue>(entity, "case.prioritycode");
        
        // Extract Case Owner full name from the nested LinkEntity (incident → systemuser)
        var caseOwnerFullName = GetAliasedValue<string>(entity, "caseowner.fullname");
        
        // Extract Case statecode
        var caseStateOption = GetAliasedValue<OptionSetValue>(entity, "case.statecode");
        // StateCode 1 = Resolved, 2 = Canceled (either means it's closed/resolved)
        bool isCaseResolved = caseStateOption != null && (caseStateOption.Value == 1 || caseStateOption.Value == 2);

        // Extract AliasedValues from the linked slaitem
        var trueKpiRef = GetAliasedValue<EntityReference>(entity, "slaitem.msdyn_slakpiid");
        var slaItemAliasedName = GetAliasedValue<string>(entity, "slaitem.name");
        
        // SLA Item name from the lookup reference itself
        var slaItemRef = entity.Contains("msdyn_slaitemid") ? entity.GetAttributeValue<EntityReference>("msdyn_slaitemid") : null;
        var slaItemName = slaItemRef?.Name ?? slaItemAliasedName;
        
        return new SlaKpiInstance
        {
            Id = entity.Id.ToString(),
            Name = entity.GetAttributeValue<string>("name") ?? "Unknown KPI",
            IsCaseResolved = isCaseResolved,
            
            // Map true KPI ID and Name
            KpiId = trueKpiRef?.Id.ToString() ?? string.Empty,
            KpiName = !string.IsNullOrEmpty(slaItemName) ? slaItemName : (entity.GetAttributeValue<string>("name") ?? "Unknown KPI"),
            
            // Regarding Mapping
            RegardingId = regardingRef?.Id.ToString() ?? string.Empty,
            RegardingType = regardingRef?.LogicalName ?? string.Empty,
            
            // Use linked incident fields, fallback to generic Name if not an incident
            RegardingNumber = ticketNumber ?? (regardingRef?.Name ?? "Unknown"), 
            RegardingSubject = caseTitle ?? (regardingRef?.Name ?? "Unknown Subject"),
            
            // Status mapping
            Status = MapStatus(entity.Contains("status") ? entity.GetAttributeValue<OptionSetValue>("status") : null),
            
            // Priority: use clean mapped strings (High/Normal/Low)
            Priority = MapPriority(priorityOption),
            
            // Date mapping (Null-safe)
            FailureTime = entity.GetAttributeValue<DateTime?>("failuretime")?.ToString("o"),
            WarningTime = entity.GetAttributeValue<DateTime?>("warningtime")?.ToString("o"),
            SucceededOn = entity.GetAttributeValue<DateTime?>("succeededon")?.ToString("o"),
            PausedOn = entity.GetAttributeValue<DateTime?>("pausedon")?.ToString("o"),
            CreatedOn = entity.GetAttributeValue<DateTime?>("createdon")?.ToString("o") ?? DateTime.UtcNow.ToString("o"),
            ModifiedOn = entity.GetAttributeValue<DateTime?>("modifiedon")?.ToString("o") ?? DateTime.UtcNow.ToString("o"),
            
            // Owner: prefer Case Owner fullname from systemuser join, fallback to SLA owner
            Owner = caseOwnerFullName ?? (slaOwnerRef?.Name ?? "Unassigned"),
            Team = string.Empty, // Team filter removed; field kept for DTO compatibility
            
            // Category no longer used as a filter; kept empty for DTO compatibility
            Category = string.Empty
        };
    }

    private T? GetAliasedValue<T>(Entity entity, string attributeName) where T : class
    {
        if (entity.Contains(attributeName) && entity[attributeName] is AliasedValue aliasedValue)
        {
            return aliasedValue.Value as T;
        }
        return null;
    }

    private string MapStatus(OptionSetValue? statusCode)
    {
        if (statusCode == null) return "In Progress";
        
        return statusCode.Value switch
        {
            0 => "In Progress",
            1 => "Noncompliant",
            2 => "Nearing Noncompliance",
            3 => "Paused",
            4 => "Succeeded",
            5 => "Canceled",
            _ => "In Progress"
        };
    }

    private string MapPriority(OptionSetValue? priorityCode)
    {
        if (priorityCode == null) return "4 - Normal";

        return priorityCode.Value switch
        {
            921910001 => "1 - Emergency",
            921910000 => "2 - Urgent",
            1 => "3 - High",
            2 => "4 - Normal",
            3 => "5 - Low",
            _ => "4 - Normal"
        };
    }
}
