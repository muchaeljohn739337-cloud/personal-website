using AdvanciaApp.Models;

namespace AdvanciaApp.Services;

/// <summary>
/// Authentication service interface using ASP.NET Core Identity
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Generate JWT token for authenticated user
    /// </summary>
    Task<string> GenerateJwtToken(string userId, string email, string role);

    /// <summary>
    /// Validate user password using Identity
    /// </summary>
    Task<bool> ValidatePassword(ApplicationUser user, string password);

    /// <summary>
    /// Hash password using Identity's password hasher
    /// </summary>
    string HashPassword(ApplicationUser user, string password);

    /// <summary>
    /// Authenticate user with email and password
    /// </summary>
    Task<(bool Success, ApplicationUser? User, string? ErrorMessage)> AuthenticateAsync(string email, string password);

    /// <summary>
    /// Register new user with Identity
    /// </summary>
    Task<(bool Success, ApplicationUser? User, IEnumerable<string> Errors)> RegisterAsync(
        string email, 
        string password, 
        string firstName, 
        string lastName,
        string? phoneNumber = null);
}
