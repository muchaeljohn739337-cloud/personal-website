using StackExchange.Redis;
using System.Text.Json;

namespace AdvanciaApp.Services;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IConfiguration configuration, ILogger<RedisCacheService> logger)
    {
        _logger = logger;
        var connectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        _redis = ConnectionMultiplexer.Connect(connectionString);
        _db = _redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var value = await _db.StringGetAsync(key);
            if (!value.HasValue)
                return default;

            return JsonSerializer.Deserialize<T>(value.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cache key {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        try
        {
            var serialized = JsonSerializer.Serialize(value);
            await _db.StringSetAsync(key, serialized, expiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cache key {Key}", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            await _db.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache key {Key}", key);
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        try
        {
            return await _db.KeyExistsAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking cache key {Key}", key);
            return false;
        }
    }
}
