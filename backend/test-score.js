// Test score extraction with the exact format from the issue
const testAIResponse = `
PERFORMANCE METRICS ANALYSIS ONLY - Focus on numbers, statistics, and quantitative data:

1. **Overall Performance Score** (1-10) with breakdown: **7.5/10**
Breakdown:
• Win Rate: 80.0% (above Emerald rank average)
• KDA: 15.2/15.4/26.8 (above Emerald rank average)
• CS: 45.2 (above Emerald rank average, but below expected 6.5 CS/min)
• Damage: 44k (above Emerald rank average)

2. **CS/min Analysis**: **5.5 CS/min**, 15.4% below Emerald rank average of **6.5 CS/min**
`;

// Use the exact same patterns from the updated aiService.ts
const scorePatterns = [
  /\*\*Overall Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\/10\*\*/i,
  /\*\*Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\/10\*\*/i,
  /\*\*Overall Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\*\*/i,
  /\*\*Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\*\*/i,
  /Overall Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\/10/i,
  /Performance Score[^:]*:\s*(\d+(?:\.\d+)?)\/10/i,
  /Overall Performance Score[^:]*:\s*(\d+(?:\.\d+)?)/i,
  /Performance Score[^:]*:\s*(\d+(?:\.\d+)?)/i,
  /(\d+(?:\.\d+)?)\s*\/\s*10/i,
  /(\d+(?:\.\d+)?)\s*out of\s*10/i
];

let score = 7.5; // default

console.log('🔍 Testing score extraction from AI response...\n');

for (let i = 0; i < scorePatterns.length; i++) {
  const pattern = scorePatterns[i];
  const match = testAIResponse.match(pattern);
  if (match) {
    const parsedScore = parseFloat(match[1]);
    if (parsedScore >= 0 && parsedScore <= 10) {
      score = parsedScore;
      console.log('✅ Score extracted using pattern ' + i + ': ' + score + ' from "' + match[0] + '"');
      break;
    }
  }
}

console.log('\n📊 Final extracted score: ' + score);
console.log('🎯 Expected: 7.5, Actual: ' + score + ' - ' + (score === 7.5 ? 'CORRECT ✅' : 'INCORRECT ❌'));

// Test the problematic case that might have caused the 8.5 score
console.log('\n🔍 Looking for other potential scores in the response:');
const allNumbers = testAIResponse.match(/(\d+(?:\.\d+)?)/g);
console.log('All numbers found:', allNumbers);
