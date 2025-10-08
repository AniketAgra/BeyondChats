/**
 * Test file for AI Buddy Predefined Response Triggers
 * 
 * Run with: node Backend/test-ai-buddy-triggers.js
 */

import { checkPredefinedResponse, getAllTriggers, getResponseById } from './src/config/aiBuddyResponses.js'

console.log('🧪 Testing AI Buddy Predefined Response Triggers\n')

// Test cases
const testCases = [
  // DETAILED_QUERY tests
  { query: "Explain Newton's 3rd law in detail", expectedId: "DETAILED_QUERY" },
  { query: "Can you elaborate on photosynthesis?", expectedId: "DETAILED_QUERY" },
  { query: "Tell me more about quantum mechanics", expectedId: "DETAILED_QUERY" },
  { query: "I need a thorough explanation of this topic", expectedId: "DETAILED_QUERY" },
  
  // LONG_SUMMARY tests
  { query: "Give me a full summary of this chapter", expectedId: "LONG_SUMMARY" },
  { query: "Summarize fully the entire chapter", expectedId: "LONG_SUMMARY" },
  { query: "I want a complete summary", expectedId: "LONG_SUMMARY" },
  
  // COMPLEX_TOPIC tests
  { query: "Show me the step by step derivation", expectedId: "COMPLEX_TOPIC" },
  { query: "Explain the calculation in detail", expectedId: "COMPLEX_TOPIC" },
  { query: "Prove the theorem", expectedId: "COMPLEX_TOPIC" },
  { query: "Show me how to solve this problem", expectedId: "COMPLEX_TOPIC" },
  
  // PERSONAL_GUIDANCE tests
  { query: "How can I improve my performance?", expectedId: "PERSONAL_GUIDANCE" },
  { query: "What should I focus on for the exam?", expectedId: "PERSONAL_GUIDANCE" },
  { query: "How to study better?", expectedId: "PERSONAL_GUIDANCE" },
  
  // TEACHING_REQUEST tests
  { query: "Teach me about calculus", expectedId: "TEACHING_REQUEST" },
  { query: "I want to learn about this topic", expectedId: "TEACHING_REQUEST" },
  { query: "Help me understand this fully", expectedId: "TEACHING_REQUEST" },
  
  // COMPARISON_ANALYSIS tests
  { query: "Compare mitosis and meiosis", expectedId: "COMPARISON_ANALYSIS" },
  { query: "What's the difference between these two concepts?", expectedId: "COMPARISON_ANALYSIS" },
  
  // EXAMPLES_REQUEST tests
  { query: "Give me examples of this concept", expectedId: "EXAMPLES_REQUEST" },
  { query: "Can you provide some real world examples?", expectedId: "EXAMPLES_REQUEST" },
  
  // No trigger cases
  { query: "What is photosynthesis?", expectedId: null },
  { query: "Define newton's laws", expectedId: null },
  { query: "Hi there!", expectedId: null }
]

console.log('📊 Running Test Cases:\n')

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const result = checkPredefinedResponse(testCase.query)
  const actualId = result ? result.id : null
  const isPass = actualId === testCase.expectedId
  
  if (isPass) {
    passed++
    console.log(`✅ Test ${index + 1}: PASS`)
  } else {
    failed++
    console.log(`❌ Test ${index + 1}: FAIL`)
    console.log(`   Query: "${testCase.query}"`)
    console.log(`   Expected: ${testCase.expectedId}`)
    console.log(`   Got: ${actualId}`)
  }
})

console.log('\n' + '='.repeat(50))
console.log(`\n📈 Test Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`)
console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`)

// Display all available triggers
console.log('📋 All Available Triggers:')
const allTriggers = getAllTriggers()
console.log(`   Total trigger phrases: ${allTriggers.length}\n`)

// Display each category with sample triggers
console.log('📂 Trigger Categories:\n')
import { aiBuddyResponses } from './src/config/aiBuddyResponses.js'

aiBuddyResponses.forEach((category, index) => {
  console.log(`${index + 1}. ${category.id}`)
  console.log(`   Triggers: ${category.triggers.length}`)
  console.log(`   Sample: "${category.triggers[0]}", "${category.triggers[1]}"`)
  console.log()
})

// Test specific response retrieval
console.log('🔍 Testing Response Retrieval:\n')
const detailedResponse = getResponseById('DETAILED_QUERY')
if (detailedResponse) {
  console.log('✅ Successfully retrieved DETAILED_QUERY response')
  console.log(`   Response length: ${detailedResponse.response.length} characters`)
} else {
  console.log('❌ Failed to retrieve DETAILED_QUERY response')
}

console.log('\n✨ Testing Complete!\n')
