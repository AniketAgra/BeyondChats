/**
 * AI Buddy Predefined Response Configuration
 * 
 * This file contains predefined responses that are triggered by specific keywords
 * to redirect users to AI Mentor for detailed explanations instead of 
 * generating long AI responses in the chat panel.
 */

export const aiBuddyResponses = [
  {
    id: "DETAILED_QUERY",
    triggers: [
      "explain in detail",
      "in detail",
      "elaborate",
      "explain more",
      "tell me more",
      "go deeper",
      "in depth",
      "detailed summary",
      "full explanation",
      "teach me fully",
      "explain step by step",
      "summary in detail",
      "expand on this",
      "what does it mean completely",
      "more about this",
      "comprehensive",
      "thorough explanation",
      "walk me through",
      "complete explanation",
      "break down",
      "deep dive",
      "analyze in detail",
      "more information",
      "detailed explanation"
    ],
    response: `I'm your AI Buddy 🤖 — here to give you quick, focused explanations based on your study materials.

It seems you're looking for a **more detailed answer** or **Mentor-level guidance**.

For in-depth explanations, concept breakdowns, and performance-based learning advice, please visit your **AI Mentor** 🧑‍🏫 by clicking the bot icon at the bottom-right corner.

The AI Mentor has access to all your materials and can provide comprehensive, step-by-step guidance tailored to your learning needs!`
  },
  {
    id: "LONG_SUMMARY",
    triggers: [
      "full summary",
      "long summary",
      "complete summary",
      "summarize fully",
      "whole chapter summary",
      "entire chapter",
      "summarize everything",
      "summarize all",
      "complete overview",
      "comprehensive summary",
      "detailed summary of"
    ],
    response: `I can provide short summaries here ✨

For **complete or chapter-wide summaries**, your **AI Mentor** can walk you through the detailed notes and examples.

Click the **bot icon** at the bottom-right to open the full AI Mentor interface and get comprehensive summaries with all the important details!

Need a quick summary? Ask me for specific sections or topics! 😊`
  },
  {
    id: "COMPLEX_TOPIC",
    triggers: [
      "solve step by step",
      "step by step",
      "show derivation",
      "derivation",
      "explain calculation",
      "explain the calculation",
      "mathematical proof",
      "theorem explanation",
      "code implementation",
      "prove that",
      "prove the",
      "derive the formula",
      "show working",
      "show steps",
      "how to solve",
      "solution steps",
      "work through",
      "demonstrate how",
      "show me how to"
    ],
    response: `That's a complex concept 🧩

I can briefly explain the idea here, but to learn it **step-by-step with examples and detailed working**, your **AI Mentor** is the right guide.

Click the **AI Mentor icon** at the bottom-right to:
✨ Get step-by-step solutions
✨ See detailed derivations and proofs
✨ Practice with examples
✨ Understand the concept deeply

For quick clarifications, I'm here to help! 🤝`
  },
  {
    id: "PERSONAL_GUIDANCE",
    triggers: [
      "how can I improve",
      "how to study better",
      "what should I focus on",
      "how to score more",
      "how to prepare for exam",
      "study tips",
      "learning strategy",
      "improve my performance",
      "weak topics",
      "need guidance",
      "help me improve",
      "what to study",
      "how to prepare",
      "exam preparation",
      "study plan"
    ],
    response: `I'm your quick AI Buddy 🤝 — I can share facts and summaries.

But for **personal improvement suggestions**, your **AI Mentor** uses your quiz data and progress to give **custom guidance**.

Click the **AI Mentor icon** at the bottom-right to open your personalized tutor!

Your AI Mentor will:
✨ Analyze your performance data
✨ Identify weak topics
✨ Suggest personalized study plans
✨ Track your progress over time
✨ Give tailored exam preparation tips`
  },
  {
    id: "TEACHING_REQUEST",
    triggers: [
      "teach me",
      "learn about",
      "understand fully",
      "understand this fully",
      "help me understand",
      "master this topic",
      "lesson on",
      "tutorial on",
      "guide me through",
      "help me learn",
      "want to learn",
      "need to understand"
    ],
    response: `I'd love to help you learn! 📚

For **comprehensive teaching and guided learning**, your **AI Mentor** is specifically designed for that purpose.

Click the **AI Mentor icon** at the bottom-right to start your personalized learning session!

The AI Mentor can:
✨ Teach topics from scratch
✨ Adapt to your learning pace
✨ Provide practice exercises
✨ Answer follow-up questions in depth
✨ Track your understanding

I'm here for quick queries and clarifications! 😊`
  },
  {
    id: "COMPARISON_ANALYSIS",
    triggers: [
      "compare",
      "difference between",
      "distinguish between",
      "contrast",
      "similarities and differences",
      "how are they different",
      "compare and contrast",
      "what's the difference"
    ],
    response: `Comparisons can get detailed! 🔍

I can give you a quick overview, but for **detailed comparisons with examples and implications**, visit your **AI Mentor**.

Click the **AI Mentor icon** at the bottom-right for:
✨ Comprehensive comparison tables
✨ Detailed analysis of differences
✨ Real-world examples
✨ Use cases and applications

Want a quick comparison? I can give you the key differences in a sentence or two! 😊`
  },
  {
    id: "EXAMPLES_REQUEST",
    triggers: [
      "give me examples",
      "show examples",
      "provide examples",
      "example of",
      "can you give me an example",
      "illustrate with examples",
      "demonstrate with example",
      "real world examples",
      "practical examples"
    ],
    response: `Examples make learning easier! 💡

I can share one quick example here, but for **multiple examples with detailed explanations**, your **AI Mentor** is perfect!

Click the **AI Mentor icon** at the bottom-right to get:
✨ Multiple detailed examples
✨ Real-world applications
✨ Step-by-step demonstrations
✨ Practice problems

Need just one quick example? Ask me and I'll provide a brief one! 😊`
  }
];

/**
 * Check if user prompt matches any predefined response triggers
 * @param {string} userPrompt - The user's input message
 * @returns {object|null} - Matched response object or null
 */
export function checkPredefinedResponse(userPrompt) {
  const lowerPrompt = userPrompt.toLowerCase().trim();

  // Check each response category
  for (const entry of aiBuddyResponses) {
    // Check if any trigger phrase is present in the prompt
    if (entry.triggers.some(trigger => lowerPrompt.includes(trigger.toLowerCase()))) {
      return {
        id: entry.id,
        response: entry.response,
        isRedirect: true
      };
    }
  }

  return null; // No predefined response matched
}

/**
 * Get all trigger keywords for debugging/testing
 * @returns {Array} - Array of all trigger phrases
 */
export function getAllTriggers() {
  return aiBuddyResponses.flatMap(entry => entry.triggers);
}

/**
 * Get response by ID
 * @param {string} id - Response ID
 * @returns {object|null} - Response object or null
 */
export function getResponseById(id) {
  return aiBuddyResponses.find(entry => entry.id === id) || null;
}

export default {
  aiBuddyResponses,
  checkPredefinedResponse,
  getAllTriggers,
  getResponseById
};
