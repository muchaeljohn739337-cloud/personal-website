/**
 * ═══════════════════════════════════════════════════════════════
 * GOVERNANCE AI - MULTI-JURISDICTION PAYMENT COMPLIANCE
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Ensure payment compliance across USA, Canada, UK, EU, etc.
 * Features:
 * - Automatic jurisdiction detection
 * - Smart payment routing
 * - Real-time compliance checks
 * - Risk-based adaptive policies
 * - No user restrictions (compliant routing instead)
 */

const prisma = require("../prismaClient");
const { EventEmitter } = require("events");

class GovernanceAI extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      enableAutoRouting: config.enableAutoRouting !== false,
      enableRiskAdaptation: config.enableRiskAdaptation !== false,
      enableComplianceLogging: config.enableComplianceLogging !== false,
      defaultRiskThreshold: config.defaultRiskThreshold || 0.7,
      ...config,
    };

    this.prisma = prisma;

    // Jurisdiction rules cache
    this.jurisdictionRules = new Map();

    // Payment processor capabilities
    this.processorCapabilities = new Map();

    // Risk scoring cache
    this.riskCache = new Map();

    // Statistics
    this.stats = {
      transactionsRouted: 0,
      complianceChecks: 0,
      autoCorrections: 0,
      riskAssessments: 0,
      jurisdictionDetections: 0,
    };

    this.initializeGovernance();
  }

  /**
   * Initialize governance rules and processors
   */
  async initializeGovernance() {
    try {
      console.log("🏛️  Initializing Governance AI...\n");

      // Load jurisdiction rules
      await this.loadJurisdictionRules();

      // Initialize payment processors
      await this.initializeProcessors();

      console.log("✅ Governance AI initialized\n");
    } catch (error) {
      console.error("❌ Governance AI initialization error:", error);
      throw error;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * JURISDICTION DETECTION & ROUTING
   * ═══════════════════════════════════════════════════════════════
   */

  /**
   * Detect user's jurisdiction based on multiple signals
   */
  async detectJurisdiction(userData) {
    this.stats.jurisdictionDetections++;

    const signals = {
      ipAddress: userData.ipAddress,
      billingCountry: userData.billingCountry,
      phoneNumber: userData.phoneNumber,
      bankCountry: userData.bankCountry,
      userPreference: userData.preferredJurisdiction,
    };

    // Priority order: explicit preference > bank country > billing country > IP
    let jurisdiction = null;

    if (signals.userPreference) {
      jurisdiction = this.normalizeJurisdiction(signals.userPreference);
    } else if (signals.bankCountry) {
      jurisdiction = this.normalizeJurisdiction(signals.bankCountry);
    } else if (signals.billingCountry) {
      jurisdiction = this.normalizeJurisdiction(signals.billingCountry);
    } else if (signals.ipAddress) {
      jurisdiction = await this.getJurisdictionFromIP(signals.ipAddress);
    }

    // Get jurisdiction rules
    const rules = this.getJurisdictionRules(jurisdiction);

    return {
      jurisdiction,
      confidence: this.calculateConfidence(signals),
      rules,
      signals,
    };
  }

  /**
   * Normalize jurisdiction codes (USA, US, United States -> USA)
   */
  normalizeJurisdiction(input) {
    const jurisdictionMap = {
      US: "USA",
      USA: "USA",
      "United States": "USA",
      CA: "CAN",
      CAN: "CAN",
      Canada: "CAN",
      GB: "GBR",
      UK: "GBR",
      GBR: "GBR",
      "United Kingdom": "GBR",
      EU: "EUR",
      Europe: "EUR",
      EUR: "EUR",
      AU: "AUS",
      AUS: "AUS",
      Australia: "AUS",
      SG: "SGP",
      SGP: "SGP",
      Singapore: "SGP",
    };

    return jurisdictionMap[input?.toUpperCase()] || "GLOBAL";
  }

  /**
   * Get jurisdiction from IP address (mock - integrate with GeoIP service)
   */
  async getJurisdictionFromIP(ipAddress) {
    // In production, integrate with MaxMind GeoIP2 or similar
    // For now, simple mock based on IP ranges

    if (!ipAddress) return "GLOBAL";

    // Mock implementation
    const firstOctet = parseInt(ipAddress.split(".")[0]);

    if (firstOctet >= 3 && firstOctet <= 100) return "USA";
    if (firstOctet >= 101 && firstOctet <= 150) return "EUR";
    if (firstOctet >= 151 && firstOctet <= 180) return "GBR";
    if (firstOctet >= 181 && firstOctet <= 200) return "CAN";

    return "GLOBAL";
  }

  /**
   * Calculate confidence score for jurisdiction detection
   */
  calculateConfidence(signals) {
    let confidence = 0;
    let totalWeight = 0;

    const weights = {
      userPreference: 0.4,
      bankCountry: 0.3,
      billingCountry: 0.2,
      ipAddress: 0.1,
    };

    if (signals.userPreference) {
      confidence += weights.userPreference;
      totalWeight += weights.userPreference;
    }
    if (signals.bankCountry) {
      confidence += weights.bankCountry;
      totalWeight += weights.bankCountry;
    }
    if (signals.billingCountry) {
      confidence += weights.billingCountry;
      totalWeight += weights.billingCountry;
    }
    if (signals.ipAddress) {
      confidence += weights.ipAddress;
      totalWeight += weights.ipAddress;
    }

    return totalWeight > 0 ? confidence : 0.5;
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * COMPLIANCE RULES ENGINE
   * ═══════════════════════════════════════════════════════════════
   */

  /**
   * Load jurisdiction-specific compliance rules
   */
  async loadJurisdictionRules() {
    // USA Rules (AML, KYC, OFAC)
    this.jurisdictionRules.set("USA", {
      jurisdiction: "USA",
      regulators: ["FinCEN", "OFAC", "SEC", "State Banking Authorities"],
      requirements: {
        kyc: { required: true, level: "enhanced" },
        aml: { required: true, monitoring: "continuous" },
        transactionLimit: { daily: 10000, monthly: 50000 },
        reportingThreshold: 10000,
        sanctionsScreening: true,
        pep_screening: true,
        sourceOfFunds: { threshold: 5000 },
      },
      allowedProcessors: ["stripe", "square", "braintree", "authorize.net"],
      restrictedCountries: ["IR", "KP", "SY", "CU"], // OFAC sanctioned
      complianceLevel: "strict",
    });

    // Canada Rules (FINTRAC)
    this.jurisdictionRules.set("CAN", {
      jurisdiction: "CAN",
      regulators: ["FINTRAC", "OSFI", "Provincial Regulators"],
      requirements: {
        kyc: { required: true, level: "standard" },
        aml: { required: true, monitoring: "periodic" },
        transactionLimit: { daily: 15000, monthly: 60000 },
        reportingThreshold: 10000,
        sanctionsScreening: true,
        pep_screening: false,
        sourceOfFunds: { threshold: 10000 },
      },
      allowedProcessors: ["stripe", "square", "moneris", "bambora"],
      restrictedCountries: ["IR", "KP", "SY"],
      complianceLevel: "moderate",
    });

    // UK Rules (FCA)
    this.jurisdictionRules.set("GBR", {
      jurisdiction: "GBR",
      regulators: ["FCA", "PRA", "HMRC"],
      requirements: {
        kyc: { required: true, level: "enhanced" },
        aml: { required: true, monitoring: "continuous" },
        transactionLimit: { daily: 8000, monthly: 40000 },
        reportingThreshold: 10000,
        sanctionsScreening: true,
        pep_screening: true,
        sourceOfFunds: { threshold: 5000 },
      },
      allowedProcessors: ["stripe", "worldpay", "checkout.com", "adyen"],
      restrictedCountries: ["IR", "KP", "SY", "RU"], // UK sanctions
      complianceLevel: "strict",
    });

    // EU Rules (PSD2, MiFID II)
    this.jurisdictionRules.set("EUR", {
      jurisdiction: "EUR",
      regulators: ["EBA", "ECB", "National Regulators"],
      requirements: {
        kyc: { required: true, level: "standard" },
        aml: { required: true, monitoring: "continuous" },
        transactionLimit: { daily: 10000, monthly: 50000 },
        reportingThreshold: 15000,
        sanctionsScreening: true,
        pep_screening: true,
        sourceOfFunds: { threshold: 10000 },
        sca: { required: true }, // Strong Customer Authentication
        gdpr: { required: true },
      },
      allowedProcessors: ["stripe", "adyen", "klarna", "mollie"],
      restrictedCountries: ["IR", "KP", "SY", "RU"], // EU sanctions
      complianceLevel: "strict",
    });

    // Global fallback (most permissive)
    this.jurisdictionRules.set("GLOBAL", {
      jurisdiction: "GLOBAL",
      regulators: ["Local Authorities"],
      requirements: {
        kyc: { required: false, level: "basic" },
        aml: { required: false, monitoring: "none" },
        transactionLimit: { daily: 50000, monthly: 200000 },
        reportingThreshold: 50000,
        sanctionsScreening: false,
        pep_screening: false,
        sourceOfFunds: { threshold: 25000 },
      },
      allowedProcessors: ["stripe", "paypal", "crypto"],
      restrictedCountries: [],
      complianceLevel: "lenient",
    });

    console.log(
      `✅ Loaded ${this.jurisdictionRules.size} jurisdiction rule sets`
    );
  }

  /**
   * Get jurisdiction rules (with caching)
   */
  getJurisdictionRules(jurisdiction) {
    return (
      this.jurisdictionRules.get(jurisdiction) ||
      this.jurisdictionRules.get("GLOBAL")
    );
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * SMART PAYMENT ROUTING
   * ═══════════════════════════════════════════════════════════════
   */

  /**
   * Route payment to compliant processor
   */
  async routePayment(paymentData, userData) {
    this.stats.transactionsRouted++;

    try {
      // Detect jurisdiction
      const jurisdictionInfo = await this.detectJurisdiction(userData);
      const { jurisdiction, rules } = jurisdictionInfo;

      console.log(
        `🌍 Detected jurisdiction: ${jurisdiction} (confidence: ${jurisdictionInfo.confidence.toFixed(
          2
        )})`
      );

      // Perform compliance checks
      const complianceResult = await this.checkCompliance(
        paymentData,
        userData,
        rules
      );

      if (!complianceResult.compliant) {
        // Auto-correct if possible
        const corrected = await this.autoCorrect(
          paymentData,
          complianceResult,
          rules
        );

        if (!corrected.success) {
          // Cannot auto-correct, must reject
          return {
            success: false,
            error: "Compliance requirements not met",
            violations: complianceResult.violations,
            suggestions: corrected.suggestions,
          };
        }

        // Use corrected payment data
        paymentData = corrected.paymentData;
        this.stats.autoCorrections++;
      }

      // Select best processor
      const processor = await this.selectProcessor(paymentData, rules);

      // Log compliance event
      if (this.config.enableComplianceLogging) {
        await this.logComplianceEvent({
          jurisdiction,
          paymentData,
          complianceResult,
          processor,
          timestamp: new Date(),
        });
      }

      // Emit event
      this.emit("payment_routed", {
        jurisdiction,
        processor,
        amount: paymentData.amount,
        compliant: true,
      });

      return {
        success: true,
        jurisdiction,
        processor,
        complianceChecks: complianceResult.checks,
        routingDecision: {
          reason: "Best processor for jurisdiction",
          confidence: jurisdictionInfo.confidence,
        },
      };
    } catch (error) {
      console.error("❌ Payment routing error:", error);
      throw error;
    }
  }

  /**
   * Check compliance with jurisdiction rules
   */
  async checkCompliance(paymentData, userData, rules) {
    this.stats.complianceChecks++;

    const violations = [];
    const checks = [];

    // Check 1: Transaction limits
    if (paymentData.amount > rules.requirements.transactionLimit.daily) {
      violations.push({
        type: "TRANSACTION_LIMIT",
        severity: "HIGH",
        message: `Amount exceeds daily limit of ${rules.requirements.transactionLimit.daily}`,
        autoCorrectible: false,
      });
    }

    checks.push({
      check: "transaction_limit",
      passed: violations.length === 0,
    });

    // Check 2: KYC requirements
    if (rules.requirements.kyc.required) {
      const kycStatus = userData.kycStatus || "none";
      const requiredLevel = rules.requirements.kyc.level;

      if (!this.isKYCLevelSufficient(kycStatus, requiredLevel)) {
        violations.push({
          type: "KYC_REQUIRED",
          severity: "HIGH",
          message: `KYC level '${requiredLevel}' required, user has '${kycStatus}'`,
          autoCorrectible: false,
        });
      }
    }

    checks.push({
      check: "kyc",
      passed: violations.length === checks.length - 1,
    });

    // Check 3: Sanctions screening
    if (rules.requirements.sanctionsScreening) {
      const sanctioned = await this.checkSanctions(
        userData,
        rules.restrictedCountries
      );

      if (sanctioned) {
        violations.push({
          type: "SANCTIONS",
          severity: "CRITICAL",
          message: "User or destination is on sanctions list",
          autoCorrectible: false,
        });
      }
    }

    checks.push({
      check: "sanctions",
      passed: violations.length === checks.length - 1,
    });

    // Check 4: Source of funds
    const sofThreshold = rules.requirements.sourceOfFunds?.threshold || 999999;
    if (paymentData.amount >= sofThreshold && !userData.sourceOfFundsVerified) {
      violations.push({
        type: "SOURCE_OF_FUNDS",
        severity: "MEDIUM",
        message: `Source of funds verification required for amounts >= ${sofThreshold}`,
        autoCorrectible: false,
      });
    }

    checks.push({
      check: "source_of_funds",
      passed: violations.length === checks.length - 1,
    });

    // Check 5: PEP screening (if required)
    if (rules.requirements.pep_screening && userData.isPEP) {
      // Enhanced due diligence required for PEPs
      if (!userData.enhancedDueDiligence) {
        violations.push({
          type: "PEP_EDD",
          severity: "HIGH",
          message: "Enhanced due diligence required for PEP",
          autoCorrectible: false,
        });
      }
    }

    checks.push({
      check: "pep_screening",
      passed: violations.length === checks.length - 1,
    });

    return {
      compliant: violations.length === 0,
      violations,
      checks,
      rules: rules.jurisdiction,
    };
  }

  /**
   * Check if KYC level is sufficient
   */
  isKYCLevelSufficient(userLevel, requiredLevel) {
    const levels = {
      none: 0,
      basic: 1,
      standard: 2,
      enhanced: 3,
    };

    return levels[userLevel] >= levels[requiredLevel];
  }

  /**
   * Check sanctions lists (OFAC, UN, EU)
   */
  async checkSanctions(userData, restrictedCountries) {
    // Check user's country
    if (restrictedCountries.includes(userData.country)) {
      return true;
    }

    // Check destination country (if international transfer)
    if (
      userData.destinationCountry &&
      restrictedCountries.includes(userData.destinationCountry)
    ) {
      return true;
    }

    // In production: integrate with OFAC SDN API, UN sanctions API, etc.

    return false;
  }

  /**
   * Auto-correct compliance violations if possible
   */
  async autoCorrect(paymentData, complianceResult, rules) {
    const suggestions = [];

    // Try to split large transactions
    const limitViolation = complianceResult.violations.find(
      (v) => v.type === "TRANSACTION_LIMIT"
    );
    if (limitViolation && limitViolation.autoCorrectible) {
      const maxAmount = rules.requirements.transactionLimit.daily;
      const numSplits = Math.ceil(paymentData.amount / maxAmount);

      suggestions.push({
        type: "SPLIT_TRANSACTION",
        message: `Split into ${numSplits} transactions of max ${maxAmount} each`,
      });

      // Auto-split (if enabled)
      if (this.config.enableAutoRouting) {
        return {
          success: true,
          paymentData: {
            ...paymentData,
            splitTransactions: numSplits,
            amountPerTransaction: maxAmount,
          },
          suggestions,
        };
      }
    }

    // Cannot auto-correct
    return {
      success: false,
      suggestions: [
        "Complete KYC verification",
        "Reduce transaction amount",
        "Verify source of funds",
        ...suggestions.map((s) => s.message),
      ],
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * PAYMENT PROCESSOR SELECTION
   * ═══════════════════════════════════════════════════════════════
   */

  /**
   * Initialize payment processors
   */
  async initializeProcessors() {
    // Stripe
    this.processorCapabilities.set("stripe", {
      name: "Stripe",
      jurisdictions: ["USA", "CAN", "GBR", "EUR", "GLOBAL"],
      features: ["cards", "ach", "sepa", "local_methods"],
      fees: { percentage: 2.9, fixed: 0.3 },
      settlementTime: 2, // days
      maxAmount: 999999,
      rating: 0.95,
    });

    // Square
    this.processorCapabilities.set("square", {
      name: "Square",
      jurisdictions: ["USA", "CAN", "GBR"],
      features: ["cards", "ach"],
      fees: { percentage: 2.6, fixed: 0.1 },
      settlementTime: 1,
      maxAmount: 50000,
      rating: 0.9,
    });

    // PayPal
    this.processorCapabilities.set("paypal", {
      name: "PayPal",
      jurisdictions: ["USA", "CAN", "GBR", "EUR", "GLOBAL"],
      features: ["paypal_balance", "cards", "bank"],
      fees: { percentage: 3.5, fixed: 0.49 },
      settlementTime: 3,
      maxAmount: 100000,
      rating: 0.85,
    });

    // Crypto (for unrestricted jurisdictions)
    this.processorCapabilities.set("crypto", {
      name: "Crypto (Coinbase/Ethereum)",
      jurisdictions: ["GLOBAL"],
      features: ["bitcoin", "ethereum", "usdc"],
      fees: { percentage: 1.0, fixed: 0 },
      settlementTime: 0.1, // minutes
      maxAmount: 9999999,
      rating: 0.8,
    });

    console.log(
      `✅ Initialized ${this.processorCapabilities.size} payment processors`
    );
  }

  /**
   * Select best processor for jurisdiction and payment
   */
  async selectProcessor(paymentData, rules) {
    const allowedProcessors = rules.allowedProcessors;
    const candidates = [];

    // Filter by allowed processors
    for (const [
      processorId,
      capabilities,
    ] of this.processorCapabilities.entries()) {
      if (!allowedProcessors.includes(processorId)) continue;

      // Check amount limit
      if (paymentData.amount > capabilities.maxAmount) continue;

      // Calculate score
      const score = this.calculateProcessorScore(capabilities, paymentData);

      candidates.push({
        processorId,
        capabilities,
        score,
      });
    }

    // Sort by score (descending)
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      throw new Error(
        `No suitable processor found for jurisdiction ${rules.jurisdiction}`
      );
    }

    // Return best processor
    return candidates[0].processorId;
  }

  /**
   * Calculate processor score based on multiple factors
   */
  calculateProcessorScore(capabilities, paymentData) {
    let score = capabilities.rating * 100;

    // Lower fees = higher score
    const totalFee =
      (paymentData.amount * capabilities.fees.percentage) / 100 +
      capabilities.fees.fixed;
    const feePercentage = totalFee / paymentData.amount;
    score -= feePercentage * 50;

    // Faster settlement = higher score
    score -= capabilities.settlementTime * 2;

    return score;
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * RISK-BASED ADAPTIVE POLICIES
   * ═══════════════════════════════════════════════════════════════
   */

  /**
   * Calculate risk score for transaction
   */
  async calculateRiskScore(paymentData, userData) {
    this.stats.riskAssessments++;

    let riskScore = 0;

    // Factor 1: Transaction amount
    if (paymentData.amount > 10000) riskScore += 0.2;
    if (paymentData.amount > 50000) riskScore += 0.3;

    // Factor 2: User history
    const userTransactionCount = userData.transactionCount || 0;
    if (userTransactionCount < 5) riskScore += 0.2;

    // Factor 3: Geographic risk
    const highRiskCountries = ["AF", "YE", "SO", "SD"];
    if (highRiskCountries.includes(userData.country)) riskScore += 0.4;

    // Factor 4: Velocity (transactions per day)
    const dailyTransactions = userData.dailyTransactionCount || 0;
    if (dailyTransactions > 10) riskScore += 0.3;

    // Factor 5: Payment method
    if (paymentData.method === "crypto") riskScore += 0.1;
    if (paymentData.method === "cash") riskScore += 0.2;

    // Normalize to 0-1
    riskScore = Math.min(riskScore, 1.0);

    return {
      score: riskScore,
      level: this.getRiskLevel(riskScore),
      factors: {
        amount: paymentData.amount > 10000,
        newUser: userTransactionCount < 5,
        geography: highRiskCountries.includes(userData.country),
        velocity: dailyTransactions > 10,
        method: ["crypto", "cash"].includes(paymentData.method),
      },
    };
  }

  /**
   * Get risk level from score
   */
  getRiskLevel(score) {
    if (score < 0.3) return "LOW";
    if (score < 0.6) return "MEDIUM";
    if (score < 0.8) return "HIGH";
    return "CRITICAL";
  }

  /**
   * Adapt policies based on risk
   */
  async adaptPolicies(riskScore, rules) {
    if (!this.config.enableRiskAdaptation) {
      return rules;
    }

    const adaptedRules = { ...rules };

    if (riskScore.level === "HIGH" || riskScore.level === "CRITICAL") {
      // Tighten policies for high-risk transactions
      adaptedRules.requirements.kyc.required = true;
      adaptedRules.requirements.kyc.level = "enhanced";
      adaptedRules.requirements.sourceOfFunds.threshold = 1000;
      adaptedRules.requirements.transactionLimit.daily = Math.floor(
        adaptedRules.requirements.transactionLimit.daily * 0.5
      );
    }

    return adaptedRules;
  }

  /**
   * ═══════════════════════════════════════════════════════════════
   * COMPLIANCE LOGGING & REPORTING
   * ═══════════════════════════════════════════════════════════════
   */

  /**
   * Log compliance event to database
   */
  async logComplianceEvent(eventData) {
    try {
      await this.prisma.complianceLog.create({
        data: {
          jurisdiction: eventData.jurisdiction,
          event_type: "PAYMENT_ROUTED",
          payload: eventData.paymentData,
          compliance_result: eventData.complianceResult,
          processor: eventData.processor,
          timestamp: eventData.timestamp,
        },
      });
    } catch (error) {
      console.error("Error logging compliance event:", error);
    }
  }

  /**
   * Get compliance statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      jurisdictionsSupported: this.jurisdictionRules.size,
      processorsAvailable: this.processorCapabilities.size,
      cacheSize: this.riskCache.size,
    };
  }

  /**
   * Clear caches
   */
  clearCaches() {
    this.riskCache.clear();
    console.log("✅ Governance AI caches cleared");
  }
}

module.exports = { GovernanceAI };
