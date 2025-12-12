using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using AdvanciaApp.Services;
using AdvanciaApp.Models;
using System.Security.Claims;

namespace AdvanciaApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IUserService _userService;
    private readonly ILogger<AuthController> _logger;
    private readonly UserManager<ApplicationUser> _userManager;

    public AuthController(
        IAuthService authService,
        IUserService userService,
        ILogger<AuthController> logger,
        UserManager<ApplicationUser> userManager)
    {
        _authService = authService;
        _userService = userService;
        _logger = logger;
        _userManager = userManager;
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var (success, user, errorMessage) = await _authService.AuthenticateAsync(request.Email, request.Password);
            
            if (!success || user == null)
            {
                return Unauthorized(new { message = errorMessage ?? "Invalid credentials" });
            }

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);
            var primaryRole = roles.FirstOrDefault() ?? "User";

            var token = await _authService.GenerateJwtToken(user.Id, user.Email!, primaryRole);

            _logger.LogInformation("User {Email} logged in successfully", user.Email);

            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    fullName = user.FullName,
                    role = primaryRole,
                    roles = roles,
                    balance = user.Balance,
                    isActive = user.IsActive,
                    phoneNumber = user.PhoneNumber,
                    emailConfirmed = user.EmailConfirmed,
                    twoFactorEnabled = user.TwoFactorEnabled
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {Email}", request.Email);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Register new user
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var (success, user, errors) = await _authService.RegisterAsync(
                request.Email, 
                request.Password, 
                request.FirstName, 
                request.LastName,
                request.Phone);

            if (!success || user == null)
            {
                return BadRequest(new { message = "Registration failed", errors });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var primaryRole = roles.FirstOrDefault() ?? "User";

            var token = await _authService.GenerateJwtToken(user.Id, user.Email!, primaryRole);

            _logger.LogInformation("New user registered: {Email}", user.Email);

            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    fullName = user.FullName,
                    role = primaryRole,
                    roles = roles,
                    balance = user.Balance
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for {Email}", request.Email);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    /// <summary>
    /// Get current authenticated user profile
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var user = await _userService.GetUserById(userId);
            if (user == null)
                return NotFound(new { message = "User not found" });

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                id = user.Id,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                fullName = user.FullName,
                roles = roles,
                balance = user.Balance,
                phoneNumber = user.PhoneNumber,
                twoFactorEnabled = user.TwoFactorEnabled,
                emailConfirmed = user.EmailConfirmed,
                isActive = user.IsActive,
                createdAt = user.CreatedAt,
                lastLogin = user.LastLogin
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

// DTOs
public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Phone { get; set; }
}
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Email, string Password, string FirstName, string LastName, string? Phone);
