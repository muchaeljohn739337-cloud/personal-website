namespace AdvanciaApp.Services;

public interface IAuthService
{
    Task<string> GenerateJwtToken(int userId, string email, string role);
    Task<bool> ValidatePassword(string password, string hash);
    string HashPassword(string password);
}

public interface IUserService
{
    Task<Models.User?> GetUserByEmail(string email);
    Task<Models.User?> GetUserById(int id);
    Task<Models.User> CreateUser(Models.User user);
    Task<Models.User> UpdateUser(Models.User user);
}

public interface ITransactionService
{
    Task<Models.Transaction> CreateTransaction(Models.Transaction transaction);
    Task<IEnumerable<Models.Transaction>> GetUserTransactions(int userId, int limit = 50);
    Task<Models.Transaction?> GetTransactionById(int id);
    Task<Models.Transaction> UpdateTransactionStatus(int id, string status);
}

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
    Task<bool> ExistsAsync(string key);
}
