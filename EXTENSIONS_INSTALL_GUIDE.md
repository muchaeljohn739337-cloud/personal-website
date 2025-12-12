# 🚀 Advancia Pay Ledger - VS Code Extensions Setup

## 📦 Quick Install

### Option 1: Automatic Installation (Recommended)

VS Code will automatically prompt you to install recommended extensions when you open this workspace.

1. Open this folder in VS Code
2. Click **"Install All"** when prompted
3. Reload VS Code when installation completes

### Option 2: Manual Installation via Command Palette

Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac), then type:

```
Extensions: Show Recommended Extensions
```

Click **"Install Workspace Recommended Extensions"**

### Option 3: Command Line Installation (PowerShell)

Run this script from the project root:

```powershell
# Core Coding
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension christian-kohler.path-intellisense
code --install-extension wix.vscode-import-cost

# AI Agent & Copilot
code --install-extension github.copilot
code --install-extension github.copilot-chat
code --install-extension humao.rest-client
code --install-extension rangav.vscode-thunder-client

# SaaS Backend & Database
code --install-extension prisma.prisma
code --install-extension ms-azuretools.vscode-cosmosdb

# Security & Error Detection
code --install-extension github.vscode-codeql
code --install-extension usernamehw.errorlens
code --install-extension snyk-security.snyk-vulnerability-scanner

# Documentation & AI Training
code --install-extension davidanson.vscode-markdownlint
code --install-extension yzhang.markdown-all-in-one
code --install-extension shd101wyy.markdown-preview-enhanced

# Cloud Deployment
code --install-extension vercel.vercel-vscode
code --install-extension cloudflare.cloudflare
code --install-extension ms-azuretools.vscode-azurefunctions

# Web3 & Blockchain
code --install-extension juanblanco.solidity

# DevOps & Containers
code --install-extension ms-vscode-remote.remote-containers
code --install-extension ms-azuretools.vscode-docker

# Productivity Boosters
code --install-extension eamodio.gitlens
code --install-extension mhutchie.git-graph
code --install-extension gruntfuggly.todo-tree
```

---

## 📊 Extension Categories

### 🎯 Core Coding (7 extensions)

Essential tools for JavaScript/TypeScript development

| Extension              | Purpose                   | Priority |
| ---------------------- | ------------------------- | -------- |
| **ES7 Snippets**       | React/JS/TS code snippets | ⭐⭐⭐   |
| **Prettier**           | Code formatting           | ⭐⭐⭐   |
| **ESLint**             | Code linting              | ⭐⭐⭐   |
| **Path Intellisense**  | Auto-complete file paths  | ⭐⭐     |
| **Import Cost**        | Show package size         | ⭐⭐     |
| **Auto Rename Tag**    | Sync HTML tag renaming    | ⭐⭐     |
| **Code Spell Checker** | Catch typos               | ⭐       |

### 🤖 AI Agent & Copilot (6 extensions)

AI-powered coding assistance and API testing

| Extension          | Purpose                   | Priority |
| ------------------ | ------------------------- | -------- |
| **GitHub Copilot** | AI code completion        | ⭐⭐⭐   |
| **Copilot Chat**   | Conversational AI         | ⭐⭐⭐   |
| **REST Client**    | HTTP request testing      | ⭐⭐⭐   |
| **Thunder Client** | API testing GUI           | ⭐⭐     |
| **Continue**       | Local AI assistant        | ⭐       |
| **TabNine**        | Alternative AI completion | ⭐       |

### 🏢 SaaS Backend & Database (5 extensions)

Database management and backend tools

| Extension             | Purpose                 | Priority |
| --------------------- | ----------------------- | -------- |
| **Prisma**            | ORM & schema management | ⭐⭐⭐   |
| **MongoDB**           | MongoDB client          | ⭐⭐     |
| **PostgreSQL Client** | PostgreSQL management   | ⭐⭐     |
| **Azure Cosmos DB**   | Cosmos DB integration   | ⭐       |
| **Redis**             | Redis database client   | ⭐       |

### 🔐 Security & Error Detection (5 extensions)

Security scanning and error highlighting

| Extension      | Purpose                | Priority |
| -------------- | ---------------------- | -------- |
| **CodeQL**     | Security analysis      | ⭐⭐⭐   |
| **Error Lens** | Inline error display   | ⭐⭐⭐   |
| **OpenAPI**    | API spec validation    | ⭐⭐     |
| **Snyk**       | Vulnerability scanning | ⭐⭐     |
| **YAML**       | YAML validation        | ⭐       |

### 📚 Documentation & AI Training (5 extensions)

Markdown editing and documentation

| Extension                     | Purpose            | Priority |
| ----------------------------- | ------------------ | -------- |
| **Markdownlint**              | Markdown linting   | ⭐⭐⭐   |
| **Markdown All In One**       | Markdown utilities | ⭐⭐⭐   |
| **Markdown Preview Enhanced** | Rich preview       | ⭐⭐     |
| **Markdown Mermaid**          | Diagram support    | ⭐       |
| **Markdown PDF**              | Export to PDF      | ⭐       |

### ☁️ Cloud Deployment (5 extensions)

Cloud platform integrations

| Extension             | Purpose              | Priority |
| --------------------- | -------------------- | -------- |
| **Vercel**            | Vercel deployment    | ⭐⭐⭐   |
| **Cloudflare**        | Cloudflare Workers   | ⭐⭐     |
| **Azure Functions**   | Azure deployment     | ⭐⭐     |
| **Docker**            | Container management | ⭐⭐     |
| **Remote Containers** | Dev containers       | ⭐       |

### 🔗 Web3 & Blockchain (3 extensions)

Smart contract development

| Extension    | Purpose             | Priority |
| ------------ | ------------------- | -------- |
| **Solidity** | Solidity syntax     | ⭐⭐⭐   |
| **Hardhat**  | Hardhat integration | ⭐⭐     |
| **Truffle**  | Truffle framework   | ⭐       |

### 🐳 DevOps & Containers (3 extensions)

Container and remote development

| Extension           | Purpose             | Priority |
| ------------------- | ------------------- | -------- |
| **Remote SSH**      | SSH development     | ⭐⭐     |
| **Remote Explorer** | Remote file browser | ⭐⭐     |
| **Kubernetes**      | K8s management      | ⭐       |

### ⚡ Productivity Boosters (9 extensions)

Enhance your coding workflow

| Extension             | Purpose                  | Priority |
| --------------------- | ------------------------ | -------- |
| **GitLens**           | Enhanced Git integration | ⭐⭐⭐   |
| **Git Graph**         | Visualize Git history    | ⭐⭐⭐   |
| **Git History**       | File history viewer      | ⭐⭐     |
| **TODO Tree**         | Track TODOs              | ⭐⭐     |
| **TODO Highlight**    | Highlight comments       | ⭐⭐     |
| **Better Comments**   | Colored comments         | ⭐⭐     |
| **Bookmarks**         | Code bookmarks           | ⭐       |
| **Turbo Console Log** | Quick console.log        | ⭐       |

---

## 🎨 Recommended Themes

```powershell
code --install-extension pkief.material-icon-theme
code --install-extension zhuangtongfa.material-theme
code --install-extension akamud.vscode-theme-onedark
```

---

## 🔧 Post-Installation Setup

### 1. Configure GitHub Copilot

```
1. Press Ctrl+Shift+P
2. Type "Copilot: Sign In"
3. Follow authentication prompts
```

### 2. Set Up Prisma

```
1. Open backend/prisma/schema.prisma
2. Prisma extension will auto-activate
3. Use Ctrl+Space for autocomplete
```

### 3. Configure REST Client

```
1. Create .http files in /tests folder
2. Use ### to separate requests
3. Click "Send Request" above each request
```

### 4. Enable Error Lens

```
1. Errors will display inline automatically
2. Customize colors in settings if needed
```

---

## 🚨 Troubleshooting

### Extensions Not Installing?

```powershell
# Update VS Code
code --version

# Clear extension cache
Remove-Item -Path "$env:USERPROFILE\.vscode\extensions" -Recurse -Force

# Reinstall
code --list-extensions
```

### Copilot Not Working?

1. Check internet connection
2. Verify subscription: https://github.com/settings/copilot
3. Restart VS Code
4. Sign out and sign in again

### Prisma Extension Issues?

```powershell
cd backend
npx prisma generate
npx prisma format
```

---

## 📝 Custom Extension Settings

All extension settings are pre-configured in `.vscode/settings.json`. Key highlights:

- ✅ **Auto-format on save** (Prettier)
- ✅ **Auto-fix ESLint errors** on save
- ✅ **Copilot enabled** for all languages
- ✅ **Error Lens** inline error display
- ✅ **TODO Tree** tracks AI tasks
- ✅ **GitLens** enhanced Git UI
- ✅ **Path aliases** configured (@, ~)

---

## 🎯 Priority Installation Order

**Essential (Install First):**

1. Prettier + ESLint
2. GitHub Copilot
3. Prisma
4. Error Lens

**Recommended (Install Second):** 5. REST Client 6. GitLens 7. Markdown All In One 8. Docker

**Optional (Install As Needed):** 9. Solidity (Web3 development) 10. Kubernetes (K8s deployment) 11. Continue (Local AI alternative)

---

## 🤖 AI Agent Configuration

Your workspace is pre-wired with AI workers:

### Active AI Systems:

- ✅ **Guardian AI** - Security monitoring
- ✅ **Surveillance AI** - Anomaly detection
- ✅ **Prisma Solver Core** - Database optimization
- ✅ **Auto-Remember System** - Context learning
- ✅ **Multi-Brain AI Agent** - Multi-model orchestration
- ✅ **TypeScript Error Fixer** - Automatic fixes
- ✅ **Task Orchestrator AI** - Work distribution
- ✅ **Mapper AI** - Endpoint discovery
- ✅ **Copilot Service** - LLM-powered automation

### AI Worker Endpoints:

- `/api/ai-workers` - Worker registry
- `/api/copilot/chat` - AI assistant
- `/api/copilot/task` - Task generation
- `/api/copilot/statistics` - Performance metrics

---

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Email**: support@advanciapayledger.com

---

**Happy Coding! 🚀**
