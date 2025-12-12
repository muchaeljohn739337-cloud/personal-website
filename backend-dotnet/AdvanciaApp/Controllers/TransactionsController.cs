using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AdvanciaApp.Services;
using System.Security.Claims;

namespace AdvanciaApp.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _transactionService;
    private readonly ILogger<TransactionsController> _logger;

    public TransactionsController(
        ITransactionService transactionService,
        ILogger<TransactionsController> logger)
    {
        _transactionService = transactionService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetUserTransactions([FromQuery] int limit = 50)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var transactions = await _transactionService.GetUserTransactions(userId, limit);
            return Ok(transactions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user transactions");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTransaction(int id)
    {
        try
        {
            var transaction = await _transactionService.GetTransactionById(id);
            if (transaction == null)
                return NotFound(new { message = "Transaction not found" });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            // Verify transaction belongs to user or user is admin
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (transaction.UserId != userId && role != "admin")
                return Forbid();

            return Ok(transaction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting transaction {TransactionId}", id);
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var transaction = new Models.Transaction
            {
                UserId = userId,
                Type = request.Type,
                Amount = request.Amount,
                Description = request.Description,
                Reference = request.Reference
            };

            transaction = await _transactionService.CreateTransaction(transaction);
            return CreatedAtAction(nameof(GetTransaction), new { id = transaction.Id }, transaction);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating transaction");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }

    [Authorize(Roles = "admin")]
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateTransactionStatus(int id, [FromBody] UpdateStatusRequest request)
    {
        try
        {
            var transaction = await _transactionService.UpdateTransactionStatus(id, request.Status);
            return Ok(transaction);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Transaction not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating transaction status");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}

public record CreateTransactionRequest(string Type, decimal Amount, string? Description, string? Reference);
public record UpdateStatusRequest(string Status);
