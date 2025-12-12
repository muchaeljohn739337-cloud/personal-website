using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using AdvanciaApp.Models;

namespace AdvanciaApp.Services;

/// <summary>
/// Authentication service using ASP.NET Core Identity
/// Handles JWT token generation and password operations via Identity framework
/// </summary>
public class AuthService : IAuthService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;

    public AuthService(
        IConfiguration configuration, 
        ILogger<AuthService> logger,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        _configuration = configuration;
        _logger = logger;
        _userManager = userManager;
        _signInManager = signInManager;
    }

    /// <summary>
    /// Generate JWT token with user claims from Identity
    /// </summary>
    public async Task<string> GenerateJwtToken(string userId, string email, string role)
    {
        var jwtSecret = _configuration["JWT_SECRET"] ?? throw new InvalidOperationException("JWT_SECRET not configured");
        var key = Encoding.ASCII.GetBytes(jwtSecret);

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException($"User {userId} not found");
        }

        // Get user roles and claims from Identity
        var roles = await _userManager.GetRolesAsync(user);
        var userClaims = await _userManager.GetClaimsAsync(user);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim("FirstName", user.FirstName),
            new Claim("LastName", user.LastName),
        };

        // Add all roles as claims
        foreach (var userRole in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, userRole));
        }

        // Add custom claims from Identity
        claims.AddRange(userClaims);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(24),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        _logger.LogInformation("Generated JWT token for user {UserId} with {RoleCount} roles", userId, roles.Count);
        return tokenString;
    }

    /// <summary>
    /// Validate password using Identity's password hasher
    /// </summary>
    public async Task<bool> ValidatePassword(ApplicationUser user, string password)
    {
        var result = await _signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        return result.Succeeded;
    }

    /// <summary>
    /// Hash password using Identity's password hasher
    /// </summary>
    public string HashPassword(ApplicationUser user, string password)
    {
        return _userManager.PasswordHasher.HashPassword(user, password);
    }

    /// <summary>
    /// Authenticate user with email and password
    /// </summary>
    public async Task<(bool Success, ApplicationUser? User, string? ErrorMessage)> AuthenticateAsync(string email, string password)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            _logger.LogWarning("Login attempt for non-existent email: {Email}", email);
            return (false, null, "Invalid email or password");
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Login attempt for inactive user: {Email}", email);
            return (false, null, "Account is inactive");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        
        if (result.Succeeded)
        {
            user.LastLogin = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            _logger.LogInformation("Successful login for user: {Email}", email);
            return (true, user, null);
        }

        if (result.IsLockedOut)
        {
            _logger.LogWarning("Account locked out: {Email}", email);
            return (false, null, "Account is locked due to multiple failed login attempts");
        }

        if (result.RequiresTwoFactor)
        {
            return (false, null, "Two-factor authentication required");
        }

        _logger.LogWarning("Failed login attempt for user: {Email}", email);
        return (false, null, "Invalid email or password");
    }

    /// <summary>
    /// Register new user with Identity
    /// </summary>
    public async Task<(bool Success, ApplicationUser? User, IEnumerable<string> Errors)> RegisterAsync(
        string email, 
        string password, 
        string firstName, 
        string lastName,
        string? phoneNumber = null)
    {
        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            PhoneNumber = phoneNumber,
            EmailConfirmed = true, // Set to false and send confirmation email in production
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, password);

        if (result.Succeeded)
        {
            // Assign default role
            await _userManager.AddToRoleAsync(user, "User");
            _logger.LogInformation("User created successfully: {Email}", email);
            return (true, user, Enumerable.Empty<string>());
        }

        var errors = result.Errors.Select(e => e.Description);
        _logger.LogWarning("User creation failed for {Email}: {Errors}", email, string.Join(", ", errors));
        return (false, null, errors);
    }
}

