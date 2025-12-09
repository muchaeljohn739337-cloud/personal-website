# MCP Supabase Configuration Instructions

## Quick Setup

The MCP (Model Context Protocol) Supabase server configuration has been set up for AI-assisted development in Cursor IDE.

---

## Configuration File

**Location:** `.cursor/mcp.json`

**Content:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=xesecqcqzykvmrtxrzqi"
    }
  }
}
```

---

## Manual Setup (If File Not Created)

If the `.cursor/mcp.json` file doesn't exist, create it manually:

1. **Create Directory:**

   ```bash
   mkdir -p .cursor
   ```

2. **Create Configuration File:**

   ```bash
   # On Windows (PowerShell)
   New-Item -ItemType File -Path .cursor/mcp.json -Force

   # On Mac/Linux
   touch .cursor/mcp.json
   ```

3. **Add Configuration:**
   Copy the JSON configuration above into `.cursor/mcp.json`

---

## Cursor IDE Setup

### Enable MCP in Cursor

1. Open Cursor Settings
2. Navigate to **Features** → **MCP** (or **AI** → **MCP**)
3. Ensure MCP is enabled
4. Cursor should automatically detect `.cursor/mcp.json`

### Verify Connection

1. Check Cursor's status bar for MCP connection status
2. Look for any connection errors in Cursor's output/logs
3. Try asking AI about your Supabase database schema

---

## What This Enables

### AI-Assisted Development

- **Database Schema Queries:** Ask AI about your Supabase tables, columns, and relationships
- **Query Generation:** Generate Supabase queries from natural language
- **Migration Help:** Get assistance with database migrations
- **Code Generation:** Generate Supabase client code with context

### Enhanced Features

- **Context-Aware Assistance:** AI understands your Supabase project structure
- **Best Practices:** Get recommendations specific to your setup
- **Error Resolution:** AI can help debug Supabase-related issues
- **Documentation:** AI can reference your actual database schema

---

## Project Reference

**Your Supabase Project Reference:** `xesecqcqzykvmrtxrzqi`

This corresponds to:

- **Project URL:** `https://xesecqcqzykvmrtxrzqi.supabase.co`
- **MCP Endpoint:** `https://mcp.supabase.com/mcp?project_ref=xesecqcqzykvmrtxrzqi`

---

## Security Note

The project reference (`xesecqcqzykvmrtxrzqi`) is **public information** and safe to commit to git. It's part of your Supabase project URL and doesn't grant access without proper authentication.

**Safe to commit:** ✅ Yes (project reference is public)

---

## Troubleshooting

### MCP Not Connecting

1. **Verify File Exists:**

   ```bash
   cat .cursor/mcp.json  # Mac/Linux
   type .cursor\mcp.json  # Windows
   ```

2. **Check JSON Validity:**
   - Ensure JSON is properly formatted
   - No trailing commas
   - Proper quotes

3. **Cursor Settings:**
   - MCP feature must be enabled
   - Check Cursor version (may need latest version)

4. **Restart Cursor:**
   - Close and reopen Cursor IDE
   - MCP connections initialize on startup

### Connection Errors

1. **Network Issues:**
   - Check internet connection
   - Verify MCP endpoint is accessible
   - Check firewall/proxy settings

2. **Project Reference:**
   - Verify `xesecqcqzykvmrtxrzqi` is correct
   - Check Supabase dashboard for project reference

3. **Cursor Version:**
   - Update to latest Cursor version
   - MCP support may require recent version

---

## Alternative Configuration Methods

### Method 1: Cursor Settings UI

Some Cursor versions allow MCP configuration through the UI:

1. Settings → Features → MCP
2. Add new MCP server
3. Enter URL: `https://mcp.supabase.com/mcp?project_ref=xesecqcqzykvmrtxrzqi`

### Method 2: Global Configuration

MCP can also be configured globally in Cursor's settings:

- Check Cursor's global settings/preferences
- Look for MCP or Model Context Protocol section

---

## Testing MCP Connection

Once configured, test by asking Cursor AI:

1. **Schema Query:**

   ```
   "What tables exist in my Supabase database?"
   ```

2. **Table Structure:**

   ```
   "Show me the structure of the todos table"
   ```

3. **Query Generation:**
   ```
   "Generate a Supabase query to fetch all users"
   ```

If MCP is working, AI should have context about your Supabase project.

---

## Additional Resources

- **Supabase MCP:** https://supabase.com/docs
- **Model Context Protocol:** https://modelcontextprotocol.io
- **Cursor Documentation:** https://cursor.sh/docs

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")  
**Status:** Ready for Use
