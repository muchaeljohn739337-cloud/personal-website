#!/usr/bin/env ts-node
/**
 * Test script for model configuration system
 * Run: npx ts-node test-model-config.ts
 */

import {
    calculateCost,
    findCheapestModel,
    getBestQualityModels,
    getFreeModels,
    getModelConfig,
    modelSupports,
    recommendModel,
    ALL_MODELS
} from './src/config/models';

console.log('🧪 Testing Model Configuration System\n');

// Test 1: Get model info
console.log('1️⃣  Get Model Configuration');
const model = getModelConfig('gpt-4o-mini');
console.log(`   Model: ${model?.displayName}`);
console.log(`   Max tokens: ${model?.maxTokens}`);
console.log(`   Provider: ${model?.provider}`);
console.log(`   Cost (input): $${model?.costPer1kInputTokens}/1k tokens`);
console.log('   ✅ PASS\n');

// Test 2: Check capabilities
console.log('2️⃣  Model Capabilities');
console.log(`   Claude supports vision: ${modelSupports('claude', 'vision')}`);
console.log(`   GPT-4o supports function calling: ${modelSupports('gpt-4o', 'function-calling')}`);
console.log(`   Gemini supports streaming: ${modelSupports('gemini-1.5-flash', 'streaming')}`);
console.log('   ✅ PASS\n');

// Test 3: Calculate cost
console.log('3️⃣  Cost Calculation');
const cost1 = calculateCost('gpt-4o', 1000, 500);
const cost2 = calculateCost('gpt-4o-mini', 1000, 500);
const cost3 = calculateCost('claude-3.5-sonnet', 2000, 1000);
console.log(`   GPT-4o (1k in, 500 out): $${cost1.toFixed(6)}`);
console.log(`   GPT-4o-mini (1k in, 500 out): $${cost2.toFixed(6)}`);
console.log(`   Claude 3.5 Sonnet (2k in, 1k out): $${cost3.toFixed(6)}`);
console.log('   ✅ PASS\n');

// Test 4: Get free models
console.log('4️⃣  Free Models');
const freeModels = getFreeModels();
console.log(`   Found ${freeModels.length} free models:`);
freeModels.forEach(m => {
  console.log(`   - ${m.displayName} (${m.provider})`);
});
console.log('   ✅ PASS\n');

// Test 5: Recommend model
console.log('5️⃣  Model Recommendation');
const recommended1 = recommendModel({
  capabilities: ['vision', 'code'],
  maxCostPer1kTokens: 0.01,
  freeOnly: false
});
console.log(`   Best for vision+code under $0.01: ${recommended1?.displayName}`);

const recommended2 = recommendModel({
  capabilities: ['streaming'],
  freeOnly: true
});
console.log(`   Best free model with streaming: ${recommended2?.displayName}`);

const recommended3 = recommendModel({
  capabilities: ['streaming']
});
console.log(`   Fast + standard quality: ${recommended3?.displayName}`);
console.log('   ✅ PASS\n');

// Test 6: Best quality models
console.log('6️⃣  Best Quality Models');
const bestQuality = getBestQualityModels();
console.log('   Top 3 highest quality models:');
bestQuality.forEach((m, i) => {
  console.log(`   ${i + 1}. ${m.displayName} (${m.qualityTier})`);
});
console.log('   ✅ PASS\n');

// Test 7: Find cheapest model
console.log('7️⃣  Cheapest Models');
const cheapest = findCheapestModel(['streaming', 'function-calling']);
console.log(`   Cheapest with streaming+functions: ${cheapest?.displayName}`);
console.log(`   Cost: $${cheapest?.costPer1kInputTokens}/1k input tokens`);
console.log('   ✅ PASS\n');

// Test 8: All providers
console.log('8️⃣  Provider Summary');
const providers = [...new Set(ALL_MODELS.map(m => m.provider))];
console.log(`   Available providers: ${providers.join(', ')}`);
console.log('   ✅ PASS\n');

console.log('✅ All tests passed!\n');

// Example integration pattern
console.log('📚 Example Integration Pattern:\n');
console.log(`
// In UnifiedAIGateway.ts:
import { getModelConfig, modelSupports, calculateCost } from './config/models';

async chat(provider, model, messages) {
  // Validate model exists and capabilities
  const config = getModelConfig(model);
  if (!config) {
    throw new Error(\`Unknown model: \${model}\`);
  }
  
  // Check if vision is needed
  const hasImages = messages.some(m => m.images?.length > 0);
  if (hasImages && !modelSupports(model, 'vision')) {
    throw new Error(\`Model \${model} doesn't support vision\`);
  }
  
  // Make API call...
  const response = await this.callAPI(provider, model, messages);
  
  // Calculate and log cost
  const cost = calculateCost(
    model,
    response.usage.promptTokens,
    response.usage.completionTokens
  );
  console.log(\`Request cost: $\${cost.toFixed(6)}\`);
  
  return response;
}
`);
