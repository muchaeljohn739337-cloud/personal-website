using Microsoft.EntityFrameworkCore;
using AdvanciaApp.Data;
using AdvanciaApp.Models;

namespace AdvanciaApp.Services;

public class TransactionService : ITransactionService
{
    private readonly AdvanciaDbContext _context;
    private readonly ILogger<TransactionService> _logger;

    public TransactionService(AdvanciaDbContext context, ILogger<TransactionService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Transaction> CreateTransaction(Transaction transaction)
    {
        transaction.CreatedAt = DateTime.UtcNow;
        transaction.Status = "pending";
        
        _context.Transactions.Add(transaction);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Created transaction {TransactionId} for user {UserId}", 
            transaction.Id, transaction.UserId);
        
        return transaction;
    }

    public async Task<IEnumerable<Transaction>> GetUserTransactions(int userId, int limit = 50)
    {
        return await _context.Transactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<Transaction?> GetTransactionById(int id)
    {
        return await _context.Transactions.FindAsync(id);
    }

    public async Task<Transaction> UpdateTransactionStatus(int id, string status)
    {
        var transaction = await _context.Transactions.FindAsync(id);
        if (transaction == null)
            throw new KeyNotFoundException($"Transaction {id} not found");

        transaction.Status = status;
        transaction.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("Updated transaction {TransactionId} status to {Status}", 
            id, status);
        
        return transaction;
    }
}
