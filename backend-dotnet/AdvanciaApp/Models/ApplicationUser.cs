using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations.Schema;

namespace AdvanciaApp.Models;

/// <summary>
/// Custom ApplicationUser extending IdentityUser with Advancia-specific properties
/// </summary>
public class ApplicationUser : IdentityUser
{
    // Custom properties from original User model
    [PersonalData]
    public string FirstName { get; set; } = string.Empty;

    [PersonalData]
    public string LastName { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Balance { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? LastLogin { get; set; }

    // Navigation properties for related entities
    public virtual ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public virtual ICollection<TokenWallet> TokenWallets { get; set; } = new List<TokenWallet>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    /// <summary>
    /// Full name computed property
    /// </summary>
    [NotMapped]
    public string FullName => $"{FirstName} {LastName}".Trim();
}
