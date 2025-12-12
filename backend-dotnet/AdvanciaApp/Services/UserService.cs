using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using AdvanciaApp.Data;
using AdvanciaApp.Models;

namespace AdvanciaApp.Services;

/// <summary>
/// User service using ASP.NET Core Identity's UserManager
/// Manages user CRUD operations through Identity framework
/// </summary>
public class UserService : IUserService
{
    private readonly AdvanciaDbContext _context;
    private readonly ILogger<UserService> _logger;
    private readonly UserManager<ApplicationUser> _userManager;

    public UserService(
        AdvanciaDbContext context, 
        ILogger<UserService> logger,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _logger = logger;
        _userManager = userManager;
    }

    public async Task<ApplicationUser?> GetUserByEmail(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        return user?.IsActive == true ? user : null;
    }

    public async Task<ApplicationUser?> GetUserById(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        return user?.IsActive == true ? user : null;
    }

    public async Task<ApplicationUser?> GetUserByIdOrEmail(string idOrEmail)
    {
        // Try as email first
        var user = await _userManager.FindByEmailAsync(idOrEmail);
        if (user != null) return user.IsActive ? user : null;

        // Try as user ID
        user = await _userManager.FindByIdAsync(idOrEmail);
        return user?.IsActive == true ? user : null;
    }

    public async Task<(bool Success, ApplicationUser? User, IEnumerable<string> Errors)> CreateUser(
        string email, 
        string password, 
        string firstName, 
        string lastName,
        string? phoneNumber = null,
        string role = "User")
    {
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = phoneNumber,
            EmailConfirmed = true, // Set to false in production
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, password);

        if (result.Succeeded)
        {
            await _userManager.AddToRoleAsync(user, role);
            _logger.LogInformation("Created new user {Email} with role {Role}", email, role);
            return (true, user, Enumerable.Empty<string>());
        }

        var errors = result.Errors.Select(e => e.Description);
        _logger.LogWarning("Failed to create user {Email}: {Errors}", email, string.Join(", ", errors));
        return (false, null, errors);
    }

    public async Task<(bool Success, ApplicationUser? User, IEnumerable<string> Errors)> UpdateUser(ApplicationUser user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        var result = await _userManager.UpdateAsync(user);

        if (result.Succeeded)
        {
            _logger.LogInformation("Updated user {UserId}", user.Id);
            return (true, user, Enumerable.Empty<string>());
        }

        var errors = result.Errors.Select(e => e.Description);
        _logger.LogWarning("Failed to update user {UserId}: {Errors}", user.Id, string.Join(", ", errors));
        return (false, null, errors);
    }

    public async Task<bool> DeleteUser(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return false;

        // Soft delete
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        var result = await _userManager.UpdateAsync(user);

        if (result.Succeeded)
        {
            _logger.LogInformation("Soft deleted user {UserId}", userId);
            return true;
        }

        return false;
    }

    public async Task<IEnumerable<ApplicationUser>> GetAllUsers(bool includeInactive = false)
    {
        var users = _userManager.Users.AsQueryable();
        
        if (!includeInactive)
        {
            users = users.Where(u => u.IsActive);
        }

        return await users.ToListAsync();
    }

    public async Task<IEnumerable<string>> GetUserRoles(ApplicationUser user)
    {
        return await _userManager.GetRolesAsync(user);
    }

    public async Task<bool> AddUserToRole(ApplicationUser user, string role)
    {
        var result = await _userManager.AddToRoleAsync(user, role);
        return result.Succeeded;
    }

    public async Task<bool> RemoveUserFromRole(ApplicationUser user, string role)
    {
        var result = await _userManager.RemoveFromRoleAsync(user, role);
        return result.Succeeded;
    }
}

