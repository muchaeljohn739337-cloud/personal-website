using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AdvanciaApp.Models;

// NOTE: User entity has been replaced by ApplicationUser (inherits from IdentityUser)
// See Models/ApplicationUser.cs for the new user model

public class Transaction
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty; // Changed from int to string to match Identity

    [Required]
    public string Type { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    public string Status { get; set; } = "pending";

    public string? Description { get; set; }

    public string? Reference { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}

public class TokenWallet
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty; // Changed from int to string to match Identity

    [Required]
    public string TokenSymbol { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,8)")]
    public decimal Balance { get; set; } = 0;

    public string? WalletAddress { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}

public class TokenTransaction
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int WalletId { get; set; }

    [Required]
    public string Type { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,8)")]
    public decimal Amount { get; set; }

    public string? TransactionHash { get; set; }

    public string? Status { get; set; } = "pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Reward
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty; // Changed from int to string to match Identity

    [Required]
    public string Type { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class UserTier
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MinBalance { get; set; } = 0;

    public string? Benefits { get; set; }
}

public class AuditLog
{
    [Key]
    public int Id { get; set; }

    public string? UserId { get; set; } // Changed from int? to string? to match Identity

    [Required]
    public string Action { get; set; } = string.Empty;

    public string? Details { get; set; }

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Notification
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty; // Changed from int to string to match Identity

    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    [Required]
    public string Type { get; set; } = "info";

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ReadAt { get; set; }
}
