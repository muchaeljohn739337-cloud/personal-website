# MCP Supabase Integration

## Overview

Model Context Protocol (MCP) integration with Supabase allows for enhanced AI-assisted development and database management through Cursor IDE.

---

## Configuration

### MCP Server Configuration

The MCP Supabase server is configured in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=xesecqcqzykvmrtxrzqi"
    }
  }
}
```

**Project Reference:** `xesecqcqzykvmrtxrzqi`

---

## Setup Instructions

### 1. Configure MCP in Cursor

1. Open Cursor Settings
2. Navigate to **Features** → **MCP**
3. Ensure the configuration file is recognized:
   - Path: `.cursor/mcp.json`
   - Or configure directly in Cursor settings

### 2. Verify Connection

The MCP server should automatically connect when:
- Cursor IDE is opened
- MCP feature is enabled
- Configuration file is valid

### 3. Using MCP with Supabase

Once configured, you can:
- Query database schema through AI
- Generate database migrations
- Create tables and relationships
- Manage Supabase resources
- Get AI assistance with Supabase operations

---

## MCP Server URL

**Endpoint:**
```
https://mcp.supabase.com/mcp?project_ref=xesecqcqzykvmrtxrzqi
```

**Project Reference:** `xesecqcqzykvmrtxrzqi`

This corresponds to your Supabase project:
- **Project URL:** `https://xesecqcqzykvmrtxrzqi.supabase.co`
- **Project Reference:** `xesecqcqzykvmrtxrzqi`

---

## Integration with Existing Supabase Setup

This MCP configuration works alongside your existing Supabase integration:

### Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xesecqcqzykvmrtxrzqi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_dj1xLuksqBUvn9O6AWU3Fg_bRYa6ohq
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres.xesecqcqzykvmrtxrzqi:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres
```

### Client Utilities

- `utils/supabase/server.ts` - Server Components
- `utils/supabase/client.ts` - Client Components
- `utils/supabase/middleware.ts` - Middleware

---

## Benefits

### AI-Assisted Development

- **Schema Queries:** Ask AI about your database structure
- **Migration Generation:** Generate migrations from natural language
- **Query Optimization:** Get AI suggestions for database queries
- **Error Resolution:** AI can help debug Supabase-related issues

### Enhanced Productivity

- **Context-Aware Assistance:** AI understands your Supabase setup
- **Code Generation:** Generate Supabase client code
- **Best Practices:** Get recommendations for Supabase usage
- **Documentation:** AI can reference your Supabase configuration

---

## Troubleshooting

### MCP Not Connecting

1. **Verify Configuration:**
   - Check `.cursor/mcp.json` exists
   - Verify project reference is correct
   - Ensure JSON is valid

2. **Check Cursor Settings:**
   - MCP feature is enabled
   - No connection errors in Cursor logs

3. **Verify Project Reference:**
   - Should match your Supabase project reference
   - Check in Supabase Dashboard → Settings → General

### Connection Errors

1. **Network Issues:**
   - Check internet connection
   - Verify MCP endpoint is accessible
   - Check firewall settings

2. **Project Reference:**
   - Ensure `xesecqcqzykvmrtxrzqi` is correct
   - Verify project exists in Supabase

3. **Authentication:**
   - MCP may require Supabase authentication
   - Check if API keys are needed

---

## Additional Resources

- [Supabase MCP Documentation](https://supabase.com/docs)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Cursor MCP Integration](https://cursor.sh/docs)

---

## Configuration File Location

**Path:** `.cursor/mcp.json`

**Note:** This file should be in your project root, not committed to git if it contains sensitive information. However, since it only contains the project reference (which is public), it's safe to commit.

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd")  
**Status:** Configured

