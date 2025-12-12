/**
 * ═══════════════════════════════════════════════════════════════
 * HTML VALIDATOR / WEB LOGIC VALIDATOR
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Ensure frontend is logical, complete, and error-free online
 * Features:
 * - Detect broken links
 * - Proper form validation
 * - Correct HTML structure
 * - Auto-correct minor errors via AI suggestions
 * ═══════════════════════════════════════════════════════════════
 */

import { JSDOM } from "jsdom";

export interface HTMLIssue {
  type: "error" | "warning" | "info";
  category:
    | "structure"
    | "link"
    | "form"
    | "accessibility"
    | "security"
    | "performance";
  message: string;
  line?: number;
  element?: string;
  suggestion?: string;
}

export class HTMLValidator {
  /**
   * Detect issues in HTML content
   */
  async detectIssues(htmlContent: string): Promise<HTMLIssue[]> {
    const issues: HTMLIssue[] = [];

    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;

      // Check HTML structure
      issues.push(...this.checkStructure(document));

      // Check links
      issues.push(...this.checkLinks(document));

      // Check forms
      issues.push(...this.checkForms(document));

      // Check accessibility
      issues.push(...this.checkAccessibility(document));

      // Check security
      issues.push(...this.checkSecurity(document));

      // Check performance
      issues.push(...this.checkPerformance(document));
    } catch (error) {
      issues.push({
        type: "error",
        category: "structure",
        message: `Failed to parse HTML: ${error}`,
      });
    }

    return issues;
  }

  /**
   * Auto-fix detected issues
   */
  async autoFix(htmlContent: string, issues: HTMLIssue[]): Promise<string> {
    let fixed = htmlContent;

    try {
      const dom = new JSDOM(fixed);
      const document = dom.window.document;

      for (const issue of issues) {
        if (issue.suggestion) {
          fixed = this.applyFix(dom, issue);
        }
      }

      return dom.serialize();
    } catch (error) {
      console.error("Failed to auto-fix HTML:", error);
      return htmlContent; // Return original if fix fails
    }
  }

  /**
   * Check HTML structure
   */
  private checkStructure(document: Document): HTMLIssue[] {
    const issues: HTMLIssue[] = [];

    // Check for DOCTYPE
    if (!document.doctype) {
      issues.push({
        type: "error",
        category: "structure",
        message: "Missing DOCTYPE declaration",
        suggestion: "Add <!DOCTYPE html> at the beginning of the document",
      });
    }

    // Check for html tag
    if (!document.querySelector("html")) {
      issues.push({
        type: "error",
        category: "structure",
        message: "Missing <html> tag",
        suggestion: "Wrap content in <html> tag",
      });
    }

    // Check for head tag
    if (!document.querySelector("head")) {
      issues.push({
        type: "error",
        category: "structure",
        message: "Missing <head> tag",
        suggestion: "Add <head> section with meta tags and title",
      });
    }

    // Check for title
    if (!document.querySelector("title")) {
      issues.push({
        type: "warning",
        category: "structure",
        message: "Missing <title> tag",
        suggestion: "Add <title> tag in <head> section",
      });
    }

    // Check for proper heading hierarchy
    const headings = Array.from(
      document.querySelectorAll("h1, h2, h3, h4, h5, h6")
    );
    if (headings.length > 0) {
      const h1Count = document.querySelectorAll("h1").length;
      if (h1Count === 0) {
        issues.push({
          type: "warning",
          category: "structure",
          message: "Missing <h1> heading (main page title)",
          suggestion: "Add a single <h1> tag for the main page heading",
        });
      } else if (h1Count > 1) {
        issues.push({
          type: "warning",
          category: "structure",
          message: `Multiple <h1> headings found (${h1Count})`,
          suggestion: "Use only one <h1> tag per page",
        });
      }
    }

    // Check for unclosed tags (basic check)
    const allTags = document.querySelectorAll("*");
    allTags.forEach((element) => {
      if (element.innerHTML.includes("<") && !element.innerHTML.includes(">")) {
        issues.push({
          type: "error",
          category: "structure",
          message: `Possibly unclosed tag in ${element.tagName}`,
          element: element.tagName,
        });
      }
    });

    return issues;
  }

  /**
   * Check links
   */
  private checkLinks(document: Document): HTMLIssue[] {
    const issues: HTMLIssue[] = [];
    const links = document.querySelectorAll("a[href]");

    links.forEach((link) => {
      const href = link.getAttribute("href");

      if (!href || href === "#" || href === "") {
        issues.push({
          type: "warning",
          category: "link",
          message: "Empty or placeholder link found",
          element: `<a> with text: ${link.textContent?.slice(0, 50)}`,
          suggestion: "Add proper href attribute or remove link",
        });
      }

      // Check for broken external links (basic validation)
      if (href && href.startsWith("http")) {
        try {
          new URL(href);
        } catch {
          issues.push({
            type: "error",
            category: "link",
            message: "Invalid URL format",
            element: `<a href="${href}">`,
            suggestion: "Fix URL format",
          });
        }
      }

      // Check for missing target on external links
      if (href && href.startsWith("http") && !link.getAttribute("target")) {
        issues.push({
          type: "info",
          category: "link",
          message: "External link without target attribute",
          element: `<a href="${href}">`,
          suggestion:
            "Add target='_blank' and rel='noopener noreferrer' for security",
        });
      }
    });

    return issues;
  }

  /**
   * Check forms
   */
  private checkForms(document: Document): HTMLIssue[] {
    const issues: HTMLIssue[] = [];
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      // Check for action attribute
      if (!form.getAttribute("action") && !form.getAttribute("onsubmit")) {
        issues.push({
          type: "warning",
          category: "form",
          message: "Form without action or onsubmit handler",
          element: `<form>`,
          suggestion: "Add action attribute or onsubmit handler",
        });
      }

      // Check inputs for labels
      const inputs = form.querySelectorAll("input:not([type='hidden'])");
      inputs.forEach((input) => {
        const id = input.getAttribute("id");
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);

        if (!hasLabel && input.getAttribute("type") !== "submit") {
          issues.push({
            type: "warning",
            category: "form",
            message: "Input without associated label",
            element: `<input type="${input.getAttribute("type")}">`,
            suggestion: "Add label with for attribute matching input id",
          });
        }
      });

      // Check for required fields without validation
      const requiredInputs = form.querySelectorAll("[required]");
      requiredInputs.forEach((input) => {
        if (!input.getAttribute("pattern") && !input.getAttribute("type")) {
          issues.push({
            type: "info",
            category: "form",
            message: "Required field without validation",
            element: `<input required>`,
            suggestion: "Add pattern or type attribute for validation",
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check accessibility
   */
  private checkAccessibility(document: Document): HTMLIssue[] {
    const issues: HTMLIssue[] = [];

    // Check images for alt text
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.getAttribute("alt")) {
        issues.push({
          type: "warning",
          category: "accessibility",
          message: "Image without alt attribute",
          element: `<img src="${img.getAttribute("src")}">`,
          suggestion: "Add alt attribute describing the image",
        });
      }
    });

    // Check for proper ARIA labels
    const buttons = document.querySelectorAll("button, input[type='button']");
    buttons.forEach((button) => {
      if (
        !button.textContent?.trim() &&
        !button.getAttribute("aria-label") &&
        !button.getAttribute("title")
      ) {
        issues.push({
          type: "warning",
          category: "accessibility",
          message: "Button without text or ARIA label",
          element: `<button>`,
          suggestion: "Add text content, aria-label, or title attribute",
        });
      }
    });

    // Check language attribute
    const html = document.querySelector("html");
    if (html && !html.getAttribute("lang")) {
      issues.push({
        type: "warning",
        category: "accessibility",
        message: "Missing lang attribute on <html>",
        suggestion: "Add lang='en' (or appropriate language code)",
      });
    }

    return issues;
  }

  /**
   * Check security
   */
  private checkSecurity(document: Document): HTMLIssue[] {
    const issues: HTMLIssue[] = [];

    // Check for inline scripts (potential XSS)
    const inlineScripts = document.querySelectorAll("script:not([src])");
    if (inlineScripts.length > 0) {
      issues.push({
        type: "warning",
        category: "security",
        message: `Found ${inlineScripts.length} inline script(s)`,
        suggestion: "Move scripts to external files for better CSP compliance",
      });
    }

    // Check for unsafe links
    const externalLinks = document.querySelectorAll("a[href^='http']");
    externalLinks.forEach((link) => {
      const rel = link.getAttribute("rel");
      if (!rel || !rel.includes("noopener")) {
        issues.push({
          type: "info",
          category: "security",
          message: "External link without noopener",
          element: `<a href="${link.getAttribute("href")}">`,
          suggestion: "Add rel='noopener noreferrer' for security",
        });
      }
    });

    return issues;
  }

  /**
   * Check performance
   */
  private checkPerformance(document: Document): HTMLIssue[] {
    const issues: HTMLIssue[] = [];

    // Check for large images without lazy loading
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      if (!img.getAttribute("loading")) {
        issues.push({
          type: "info",
          category: "performance",
          message: "Image without lazy loading",
          element: `<img src="${img.getAttribute("src")}">`,
          suggestion: "Add loading='lazy' for better performance",
        });
      }
    });

    // Check for missing async/defer on scripts
    const scripts = document.querySelectorAll("script[src]");
    scripts.forEach((script) => {
      if (!script.getAttribute("async") && !script.getAttribute("defer")) {
        issues.push({
          type: "info",
          category: "performance",
          message: "Script without async or defer",
          element: `<script src="${script.getAttribute("src")}">`,
          suggestion: "Add async or defer attribute for better loading",
        });
      }
    });

    return issues;
  }

  /**
   * Apply a fix to the DOM
   */
  private applyFix(dom: JSDOM, issue: HTMLIssue): string {
    // This is a simplified implementation
    // In a real system, you'd have more sophisticated fix logic
    return dom.serialize();
  }
}

export const htmlValidator = new HTMLValidator();
