using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using AdvanciaApp.Models;

namespace AdvanciaApp.Data;

/// <summary>
/// Database context for Advancia application using ASP.NET Core Identity
/// Inherits from IdentityDbContext to get AspNetUsers, AspNetRoles, etc.
/// </summary>
public class AdvanciaDbContext : IdentityDbContext<ApplicationUser>
{
    public AdvanciaDbContext(DbContextOptions<AdvanciaDbContext> options) : base(options) { }

    // Core entities matching Prisma schema
    // Note: Users are now managed by Identity (AspNetUsers table)
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<TokenWallet> TokenWallets { get; set; }
    public DbSet<TokenTransaction> TokenTransactions { get; set; }
    public DbSet<Reward> Rewards { get; set; }
    public DbSet<UserTier> UserTiers { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // IMPORTANT: Call base first to configure Identity tables
        base.OnModelCreating(modelBuilder);

        // Customize Identity table names (optional - keeps compatibility)
        // Uncomment if you want to keep "User" table name instead of "AspNetUsers"
        // modelBuilder.Entity<ApplicationUser>().ToTable("User");
        // modelBuilder.Entity<IdentityRole>().ToTable("Role");
        // modelBuilder.Entity<IdentityUserRole<string>>().ToTable("UserRole");
        // modelBuilder.Entity<IdentityUserClaim<string>>().ToTable("UserClaim");
        // modelBuilder.Entity<IdentityUserLogin<string>>().ToTable("UserLogin");
        // modelBuilder.Entity<IdentityUserToken<string>>().ToTable("UserToken");
        // modelBuilder.Entity<IdentityRoleClaim<string>>().ToTable("RoleClaim");

        // ApplicationUser additional configuration
        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(e => e.Balance).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        // Transaction configuration
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.ToTable("Transaction");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).HasDefaultValue("pending");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // UserId now references ApplicationUser (Identity user)
            entity.Property(e => e.UserId).IsRequired();
            entity.HasOne<ApplicationUser>()
                .WithMany(u => u.Transactions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TokenWallet configuration
        modelBuilder.Entity<TokenWallet>(entity =>
        {
            entity.ToTable("TokenWallet");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Balance).HasColumnType("decimal(18,8)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // UserId now references ApplicationUser (Identity user)
            entity.Property(e => e.UserId).IsRequired();
            entity.HasOne<ApplicationUser>()
                .WithMany(u => u.TokenWallets)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TokenTransaction configuration
        modelBuilder.Entity<TokenTransaction>(entity =>
        {
            entity.ToTable("TokenTransaction");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasColumnType("decimal(18,8)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.HasOne<TokenWallet>()
                .WithMany()
                .HasForeignKey(e => e.WalletId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Reward configuration
        modelBuilder.Entity<Reward>(entity =>
        {
            entity.ToTable("Reward");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // UserId now references ApplicationUser (Identity user)
            entity.Property(e => e.UserId).IsRequired();
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AuditLog configuration
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("AuditLog");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Action);
            
            // UserId now references ApplicationUser (Identity user)
            entity.HasOne<ApplicationUser>()
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notification");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.IsRead).HasDefaultValue(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // UserId now references ApplicationUser (Identity user)
            entity.Property(e => e.UserId).IsRequired();
            entity.HasOne<ApplicationUser>()
                .WithMany(u => u.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
