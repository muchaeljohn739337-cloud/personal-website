# Cline Extension Setup Guide

This guide will help you install and configure the Cline extension in Cursor IDE for AI-assisted development.

---

## 📦 Installation

### Step 1: Install Cline Extension

1. **Open Cursor IDE**
2. **Open Extensions View:**
   - Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS)
   - Or click the Extensions icon in the Activity Bar (left sidebar)
3. **Search for Cline:**
   - Type "Cline" in the search box
   - Look for the extension by the publisher (usually "Cline" or similar)
4. **Install:**
   - Click the "Install" button
   - Wait for installation to complete

### Step 2: Access Cline

After installation:

- Look for the **Cline icon** in the Activity Bar (left sidebar)
- If you don't see it, **restart Cursor IDE**
- Click the Cline icon to open the Cline interface

### Step 3: Sign In to Cline

1. Click the **"Sign Up"** or **"Sign In"** button in the Cline interface
2. You'll be redirected to the Cline authentication page
3. Sign in with your account (or create one if needed)
4. After signing in, you'll automatically return to Cursor IDE

---

## ⚙️ Configuration

### Basic Configuration

Cline can be configured through:

1. **Extension Settings UI:**
   - Open Cursor Settings (`Ctrl+,` or `Cmd+,`)
   - Search for "Cline"
   - Configure settings as needed

2. **Workspace Settings** (`.vscode/settings.json`):
   - See the configuration section below

### API Provider Configuration

If you want to use a custom API provider (like Humiris AI):

1. **Open Cline Settings:**
   - Click the Settings (⚙️) button in Cline interface
   - Or use Command Palette: `Ctrl+Shift+P` → "Cline: Open Settings"

2. **Configure API Provider:**
   - Under "API Provider," select "OpenAI Compatible" or your preferred provider
   - Enter the following details:
     - **Base URL:** Your API endpoint (e.g., `https://api.humiris.ai/api/openai/v1`)
     - **API Key:** Your API key
     - **Model ID:** Choose your model (e.g., `codiris-v1-preview`)

3. **Save Settings**

### MCP Server Configuration

Cline supports MCP (Model Context Protocol) servers for enhanced functionality.

**Current MCP Configuration:**

- Location: `.cursor/mcp.json`
- Already configured with Supabase MCP server

**To add more MCP servers:**

1. **Via Command Palette:**
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
   - Type "Cline: Open MCP Settings"
   - Add your MCP server configuration

2. **Via Configuration File:**
   - Edit `.cursor/mcp.json` (if Cline uses this file)
   - Or configure in Cline's MCP settings UI

**Example MCP Configuration:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=xesecqcqzykvmrtxrzqi"
    },
    "cline-community": {
      "autoApprove": ["preview_cline_issue"],
      "timeout": 10,
      "command": "node",
      "args": ["/path/to/cline-community/build/index.js"],
      "transportType": "stdio"
    }
  }
}
```

---

## 🎯 Workspace Settings

The following settings have been added to `.vscode/settings.json` for Cline compatibility:

```json
{
  // Cline Extension Settings
  "cline.enabled": true,
  "cline.autoApprove": false,
  "cline.showNotifications": true
}
```

**Note:** These settings may vary based on Cline's current configuration options. Check Cline's documentation for the latest available settings.

---

## 🚀 Usage

### Using Cline in Your Workflow

1. **Open Cline Panel:**
   - Click the Cline icon in the Activity Bar
   - Or use Command Palette: `Ctrl+Shift+P` → "Cline: Open"

2. **Start a Conversation:**
   - Type your question or request in the Cline chat interface
   - Cline will use AI to assist with your code

3. **Code Actions:**
   - Cline can help with:
     - Code generation
     - Code review
     - Debugging
     - Refactoring
     - Documentation

### Keyboard Shortcuts

- **Open Cline:** `Ctrl+Shift+P` → "Cline: Open"
- **Toggle Cline Panel:** Check Cline's keyboard shortcuts in Settings

---

## 🔧 Troubleshooting

### Cline Icon Not Visible

1. **Restart Cursor IDE**
2. **Check Extension Status:**
   - Go to Extensions view
   - Verify Cline is installed and enabled
3. **Check Activity Bar:**
   - Right-click the Activity Bar
   - Ensure Cline is enabled in the view menu

### Authentication Issues

1. **Sign Out and Sign Back In:**
   - Open Cline settings
   - Sign out
   - Sign back in with your credentials

2. **Check Internet Connection:**
   - Ensure you have an active internet connection
   - Check if Cline's servers are accessible

### MCP Server Issues

1. **Verify MCP Configuration:**
   - Check `.cursor/mcp.json` for correct configuration
   - Ensure MCP server URLs are correct

2. **Check MCP Server Status:**
   - Verify your MCP servers are running
   - Check server logs for errors

---

## 📚 Additional Resources

- **Cline Dashboard:** https://app.cline.bot/dashboard - Manage API keys, settings, and analytics
- **Cline Documentation:** https://docs.cline.bot/
- **MCP Documentation:** https://modelcontextprotocol.io/
- **Cursor IDE Documentation:** https://cursor.sh/docs

### Cline Dashboard Features

The Cline Dashboard (https://app.cline.bot/dashboard) provides:

- **API Key Management** - Generate and manage API keys for integrations
- **Bot Configuration** - Customize Cline's behavior and settings
- **Analytics** - View usage statistics and performance metrics
- **User Management** - Manage team access and permissions
- **Notifications** - Configure alerts and notifications

---

## ✅ Verification

After installation and configuration:

1. ✅ Cline extension is installed
2. ✅ Cline icon appears in Activity Bar
3. ✅ You can sign in to Cline
4. ✅ MCP servers are configured (if applicable)
5. ✅ Workspace settings are applied

**Test Cline:**

- Open Cline panel
- Ask a simple question like "What is this project about?"
- Verify you receive a response

---

## 🔐 Security Notes

- **API Keys:** Never commit API keys to version control
- **Environment Variables:** Use `.env` files for sensitive configuration
- **MCP Servers:** Only use trusted MCP server configurations

---

**Last Updated:** December 2025
