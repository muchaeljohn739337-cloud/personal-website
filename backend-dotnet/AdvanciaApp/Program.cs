using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;
using AdvanciaApp.Data;
using AdvanciaApp.Models;
using AdvanciaApp.Services;
using AdvanciaApp.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/advancia-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Advancia API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Description = "JWT Authorization header using Bearer scheme. Enter 'Bearer' [space] and then your token.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new()
    {
        {
            new()
            {
                Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Database context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AdvanciaDbContext>(options =>
    options.UseNpgsql(connectionString));

// ASP.NET Core Identity configuration
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;
    options.Password.RequiredUniqueChars = 1;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = true;
    options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";

    // SignIn settings
    options.SignIn.RequireConfirmedEmail = false; // Set to true in production
    options.SignIn.RequireConfirmedPhoneNumber = false;
})
.AddEntityFrameworkStores<AdvanciaDbContext>()
.AddDefaultTokenProviders();

// JWT Authentication (for API token-based auth)
var jwtSecret = builder.Configuration["JWT_SECRET"] ?? throw new InvalidOperationException("JWT_SECRET not configured");
var key = Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = builder.Environment.IsProduction();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// CORS configuration - match Node.js backend
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? new[]
{
    "http://localhost:3000",
    "http://localhost:3001",
    "https://advanciapayledger.com",
    "https://www.advanciapayledger.com"
};

builder.Services.AddCors(options =>
{
    options.AddPolicy("AdvanciaPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Application services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITransactionService, TransactionService>();
builder.Services.AddSingleton<ICacheService, RedisCacheService>();

// Azure services
if (builder.Environment.IsProduction())
{
    builder.Services.AddApplicationInsightsTelemetry();
}

// Health checks
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString!)
    .AddRedis(builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379");

var app = builder.Build();

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Advancia API v1"));
}

app.UseHttpsRedirection();
app.UseSerilogRequestLogging();

app.UseCors("AdvanciaPolicy");

app.UseAuthentication();
app.UseAuthorization();

// Custom middleware
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();

app.MapControllers();
app.MapHealthChecks("/health");

// Database migration on startup
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AdvanciaDbContext>();
    if (app.Environment.IsDevelopment())
    {
        await context.Database.MigrateAsync();
    }
}

Log.Information("🚀 Advancia .NET API starting on {Environment}", app.Environment.EnvironmentName);

app.Run();
