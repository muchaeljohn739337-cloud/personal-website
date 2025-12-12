import { NextRequest, NextResponse } from "next/server";

// Resend API integration for sending finance reports
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "finance@advanciapayledger.com";

interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  pendingTransactions: number;
  monthlyGrowth: number;
  projectedRevenue: number;
}

interface CashFlowEntry {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

interface ReportData {
  summary: FinanceSummary;
  cashFlowData: CashFlowEntry[];
}

function generateFinanceReportHTML(data: ReportData): string {
  const { summary, cashFlowData } = data;
  const recentTransactions = cashFlowData.slice(0, 5);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Advancia Finance Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #111827; color: #f9fafb; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center; }
    .header h1 { font-size: 28px; font-weight: 700; color: white; margin-bottom: 8px; }
    .header p { color: rgba(255,255,255,0.9); font-size: 14px; }
    .content { background-color: #1f2937; padding: 30px; border-radius: 0 0 16px 16px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; }
    .summary-card { background-color: #374151; padding: 20px; border-radius: 12px; border-left: 4px solid #10b981; }
    .summary-card.expense { border-left-color: #ef4444; }
    .summary-card.net { border-left-color: #3b82f6; }
    .summary-card.projected { border-left-color: #8b5cf6; }
    .summary-label { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .summary-value { font-size: 24px; font-weight: 700; color: #f9fafb; }
    .summary-value.income { color: #10b981; }
    .summary-value.expense { color: #ef4444; }
    .summary-value.net { color: #3b82f6; }
    .summary-value.projected { color: #8b5cf6; }
    .section-title { font-size: 18px; font-weight: 600; color: #f9fafb; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #374151; }
    .transaction-list { list-style: none; }
    .transaction-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #374151; }
    .transaction-item:last-child { border-bottom: none; }
    .transaction-info { flex: 1; }
    .transaction-desc { font-weight: 500; color: #f9fafb; font-size: 14px; }
    .transaction-category { font-size: 12px; color: #9ca3af; }
    .transaction-amount { font-weight: 600; font-size: 14px; }
    .transaction-amount.income { color: #10b981; }
    .transaction-amount.expense { color: #ef4444; }
    .growth-badge { display: inline-block; padding: 4px 10px; background-color: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 12px; font-weight: 600; border-radius: 20px; margin-top: 4px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .footer a { color: #10b981; text-decoration: none; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .social-links { margin-top: 20px; padding-top: 20px; border-top: 1px solid #374151; }
    .social-links p { color: #9ca3af; font-size: 12px; margin-bottom: 12px; }
    .social-icons { display: flex; justify-content: center; gap: 12px; }
    .social-icon { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background-color: #374151; border-radius: 8px; color: #9ca3af; text-decoration: none; font-size: 14px; }
    .social-icon:hover { background-color: #4b5563; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Finance Report</h1>
      <p>Advancia PayLedger • ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
    
    <div class="content">
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-label">Total Income</div>
          <div class="summary-value income">$${summary.totalIncome.toLocaleString()}</div>
          <span class="growth-badge">↑ ${summary.monthlyGrowth}% growth</span>
        </div>
        <div class="summary-card expense">
          <div class="summary-label">Total Expenses</div>
          <div class="summary-value expense">$${summary.totalExpenses.toLocaleString()}</div>
        </div>
        <div class="summary-card net">
          <div class="summary-label">Net Cash Flow</div>
          <div class="summary-value net">$${summary.netCashFlow.toLocaleString()}</div>
        </div>
        <div class="summary-card projected">
          <div class="summary-label">Projected Revenue</div>
          <div class="summary-value projected">$${summary.projectedRevenue.toLocaleString()}</div>
        </div>
      </div>
      
      <h3 class="section-title">📊 Recent Transactions</h3>
      <ul class="transaction-list">
        ${recentTransactions
          .map(
            (t) => `
          <li class="transaction-item">
            <div class="transaction-info">
              <div class="transaction-desc">${t.description}</div>
              <div class="transaction-category">${t.category} • ${t.date}</div>
            </div>
            <div class="transaction-amount ${t.type}">${t.type === "income" ? "+" : "-"}$${t.amount.toLocaleString()}</div>
          </li>
        `,
          )
          .join("")}
      </ul>
      
      <div style="text-align: center;">
        <a href="https://advanciapayledger.com/finance" class="cta-button">View Full Dashboard →</a>
      </div>
      
      <div class="social-links">
        <p>Share your success on social media</p>
        <div class="social-icons">
          <a href="https://twitter.com" class="social-icon" title="Twitter">𝕏</a>
          <a href="https://facebook.com" class="social-icon" title="Facebook">f</a>
          <a href="https://linkedin.com" class="social-icon" title="LinkedIn">in</a>
          <a href="https://discord.com" class="social-icon" title="Discord">⬡</a>
          <a href="https://t.me" class="social-icon" title="Telegram">✈</a>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Advancia PayLedger. All rights reserved.</p>
      <p style="margin-top: 8px;">
        <a href="https://advanciapayledger.com/unsubscribe">Unsubscribe</a> • 
        <a href="https://advanciapayledger.com/privacy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, reportType, data } = body;

    if (!to || !reportType) {
      return NextResponse.json(
        { error: "Missing required fields: to, reportType" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Check if Resend API key is configured
    if (!RESEND_API_KEY) {
      // In development, simulate success
      console.log(`[DEV] Would send ${reportType} report to ${to}`);
      console.log(`[DEV] Report data:`, JSON.stringify(data, null, 2));

      return NextResponse.json({
        success: true,
        message: "Email sent successfully (dev mode)",
        id: `dev_${Date.now()}`,
      });
    }

    // Generate email content based on report type
    let htmlContent: string;
    let subject: string;

    switch (reportType) {
      case "finance":
        htmlContent = generateFinanceReportHTML(data);
        subject = `📊 Your Finance Report - ${new Date().toLocaleDateString()}`;
        break;
      default:
        htmlContent = `<p>Report type: ${reportType}</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
        subject = `Report from Advancia - ${reportType}`;
    }

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: subject,
        html: htmlContent,
        tags: [
          { name: "report_type", value: reportType },
          { name: "source", value: "advancia-dashboard" },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      return NextResponse.json(
        { error: "Failed to send email", details: errorData },
        { status: response.status },
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      id: result.id,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Advancia Email Service",
    provider: "Resend",
    status: "active",
    endpoints: {
      sendReport: "POST /api/email/send-report",
    },
    supportedReportTypes: ["finance", "sales", "transactions"],
  });
}
