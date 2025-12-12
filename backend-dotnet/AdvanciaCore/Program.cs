var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() 
    { 
        Title = "AdvanciaPayLedger API", 
        Version = "v1",
        Description = "Advancia Pay Ledger Core API - .NET 9"
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

// Root endpoint
app.MapGet("/", () => "AdvanciaPayLedger API is online ✅")
    .WithName("GetRoot")
    .WithOpenApi();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new 
{ 
    status = "healthy", 
    timestamp = DateTime.UtcNow,
    service = "AdvanciaCore",
    version = "1.0.0"
}))
    .WithName("HealthCheck")
    .WithOpenApi();

app.MapControllers();

app.Run();
