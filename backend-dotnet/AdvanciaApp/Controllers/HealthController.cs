using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AdvanciaApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;

    public HealthController(ILogger<HealthController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    [AllowAnonymous]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "healthy",
            timestamp = DateTime.UtcNow,
            version = "1.0.0",
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
        });
    }

    [HttpGet("ready")]
    [AllowAnonymous]
    public IActionResult GetReady()
    {
        return Ok(new { status = "ready" });
    }

    [HttpGet("live")]
    [AllowAnonymous]
    public IActionResult GetLive()
    {
        return Ok(new { status = "live" });
    }
}
