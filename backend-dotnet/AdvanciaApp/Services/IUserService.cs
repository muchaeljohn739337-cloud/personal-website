using AdvanciaApp.Models;

namespace AdvanciaApp.Services;

/// <summary>
/// User service interface using ASP.NET Core Identity
/// </summary>
public interface IUserService
{
    Task<ApplicationUser?> GetUserByEmail(string email);
    Task<ApplicationUser?> GetUserById(string id);
    Task<ApplicationUser?> GetUserByIdOrEmail(string idOrEmail);
    
    Task<(bool Success, ApplicationUser? User, IEnumerable<string> Errors)> CreateUser(
        string email, 
        string password, 
        string firstName, 
        string lastName,
        string? phoneNumber = null,
        string role = "User");
    
    Task<(bool Success, ApplicationUser? User, IEnumerable<string> Errors)> UpdateUser(ApplicationUser user);
    Task<bool> DeleteUser(string userId);
    
    Task<IEnumerable<ApplicationUser>> GetAllUsers(bool includeInactive = false);
    Task<IEnumerable<string>> GetUserRoles(ApplicationUser user);
    Task<bool> AddUserToRole(ApplicationUser user, string role);
    Task<bool> RemoveUserFromRole(ApplicationUser user, string role);
}
