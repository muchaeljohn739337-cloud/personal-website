using System.Net;
using System.Text.Json;

namespace AdvanciaApp.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var code = HttpStatusCode.InternalServerError;
        var result = string.Empty;

        switch (exception)
        {
            case KeyNotFoundException:
                code = HttpStatusCode.NotFound;
                result = JsonSerializer.Serialize(new { message = exception.Message });
                break;
            case UnauthorizedAccessException:
                code = HttpStatusCode.Unauthorized;
                result = JsonSerializer.Serialize(new { message = "Unauthorized access" });
                break;
            case ArgumentException:
                code = HttpStatusCode.BadRequest;
                result = JsonSerializer.Serialize(new { message = exception.Message });
                break;
            default:
                result = JsonSerializer.Serialize(new { message = "Internal server error" });
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)code;
        return context.Response.WriteAsync(result);
    }
}

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var startTime = DateTime.UtcNow;
        
        _logger.LogInformation("HTTP {Method} {Path} started", 
            context.Request.Method, 
            context.Request.Path);

        await _next(context);

        var duration = DateTime.UtcNow - startTime;
        
        _logger.LogInformation("HTTP {Method} {Path} completed in {Duration}ms with status {StatusCode}",
            context.Request.Method,
            context.Request.Path,
            duration.TotalMilliseconds,
            context.Response.StatusCode);
    }
}
