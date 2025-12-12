// Fix field name casing in ai_suggestions model
const fs = require("fs");
const path = require("path");

function fixAiSuggestionsFields(content) {
  let fixed = content;

  // ai_suggestions model field mappings
  const fieldMappings = {
    // In where/select/include clauses
    "suggestionType:": "suggestion_type:",
    "userId:": "user_id:",
    "createdAt:": "created_at:",

    // Be careful not to replace JavaScript property access on results
  };

  // Fix field names in query contexts
  for (const [wrong, correct] of Object.entries(fieldMappings)) {
    fixed = fixed.split(wrong).join(correct);
  }

  return fixed;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const before = content;
    const fixed = fixAiSuggestionsFields(content);

    if (fixed !== before) {
      fs.writeFileSync(filePath, fixed, "utf8");
      console.log(`✓ Fixed ${filePath}`);
      return 1;
    }
    return 0;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function main() {
  console.log("🔧 Fixing ai_suggestions field names...\n");

  const file = path.join(
    __dirname,
    "..",
    "src",
    "ai-core",
    "handlers",
    "report-handler.ts"
  );

  processFile(file);

  console.log(`\n✅ Complete!`);
}

main();
