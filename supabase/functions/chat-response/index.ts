import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { chatHistoryId, currentMessage, participantName } = await req.json()
    console.log('Received request:', { chatHistoryId, currentMessage, participantName })

    const openAIKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIKey) {
      throw new Error('OpenAI API key is not configured')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get ALL messages from the chat history
    const { data: messages, error: messagesError } = await supabaseClient
      .from('chat_messages')
      .select('sender_name, content, timestamp')
      .eq('chat_history_id', chatHistoryId)
      .order('timestamp', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      throw new Error('Failed to fetch chat history')
    }

    console.log(`Retrieved ${messages?.length} total messages from chat history`)

    // Get ALL messages from the participant to analyze their style
    const participantMessages = messages
      ?.filter(msg => msg.sender_name === participantName)
      .map(msg => msg.content) || []

    console.log(`Found ${participantMessages.length} messages from ${participantName} for style analysis`)

    // Create recent chat context with the last 20 messages for immediate context
    const recentChatHistory = messages
      ?.slice(-20)
      .map(msg => `${msg.sender_name}: ${msg.content}`)
      .join('\n') || ''

    // Enhanced message pattern analysis
    const messagePatterns = analyzeMessagePatterns(participantMessages)
    const personalityTraits = analyzePersonalityTraits(participantMessages)
    console.log('Analyzed patterns:', messagePatterns)
    console.log('Personality traits:', personalityTraits)

    const prompt = `You are ${participantName}. Based on this comprehensive analysis of your communication style from ${participantMessages.length} messages:

Style Analysis:
- Message length: You typically write ${messagePatterns.avgLength} words per message
- Punctuation style: ${messagePatterns.punctuation}
- Favorite expressions: ${messagePatterns.commonPhrases.join(', ')}
- Emoji usage: ${messagePatterns.emojiUsage}
- Writing style: ${messagePatterns.formalityLevel}

Personality Traits:
- Emotional tone: ${personalityTraits.emotionalTone}
- Conversation style: ${personalityTraits.conversationStyle}
- Response patterns: ${personalityTraits.responsePatterns}
- Typical reactions: ${personalityTraits.typicalReactions}
- Unique quirks: ${personalityTraits.uniqueQuirks}

Here are examples of how you naturally communicate:
${participantMessages.slice(-50).join('\n')}

Recent conversation context:
${recentChatHistory}

Respond to "${currentMessage}" as ${participantName}, maintaining:
1. Your natural speaking rhythm and flow
2. Your unique expressions and vocabulary
3. Your characteristic punctuation style
4. Your emoji habits
5. Your typical emotional responses
6. Your conversation quirks and patterns

Important:
- Match your exact communication style
- Keep your personality consistent
- Use your common phrases naturally
- Maintain your usual emotional tone
- Stay in character completely
- Don't explain or break character
- Don't start with your name`

    console.log('Sending enhanced prompt to OpenAI')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an AI trained to precisely mimic a specific person\'s communication style, personality, and emotional patterns. Focus on maintaining their exact message length, punctuation patterns, expressions, and personality traits. Never break character or explain your responses.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(errorData.error?.message || 'Unknown error')
    }

    const data = await response.json()
    console.log('Received response from OpenAI')

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI')
    }

    const aiResponse = data.choices[0].message.content

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Enhanced message pattern analysis
function analyzeMessagePatterns(messages: string[]) {
  const wordCounts = messages.map(msg => msg.split(' ').length)
  const avgLength = Math.round(wordCounts.reduce((a, b) => a + b, 0) / messages.length)

  const punctuationCount = messages.reduce((acc, msg) => {
    const exclamations = (msg.match(/!/g) || []).length
    const questions = (msg.match(/\?/g) || []).length
    const ellipsis = (msg.match(/\.\.\./g) || []).length
    return { exclamations, questions, ellipsis }
  }, { exclamations: 0, questions: 0, ellipsis: 0 })

  const commonPhrases = findCommonPhrases(messages)

  const emojiCount = messages.reduce((count, msg) => {
    return count + (msg.match(/[\p{Emoji}]/gu) || []).length
  }, 0)
  const emojiUsage = emojiCount / messages.length > 0.5 ? 'frequent' : 
                     emojiCount / messages.length > 0.2 ? 'moderate' : 'rare'

  const formalityLevel = analyzeFormalityLevel(messages)

  return {
    avgLength,
    punctuation: `${punctuationCount.exclamations > messages.length / 2 ? 'loves' : 'occasionally uses'} exclamation marks, ` +
                 `${punctuationCount.questions > messages.length / 3 ? 'often asks' : 'sometimes asks'} questions, ` +
                 `${punctuationCount.ellipsis > messages.length / 4 ? 'frequently uses' : 'rarely uses'} ellipsis`,
    commonPhrases: commonPhrases.slice(0, 5),
    emojiUsage,
    formalityLevel
  }
}

// New function to analyze personality traits
function analyzePersonalityTraits(messages: string[]) {
  const emotionalWords = {
    positive: ['love', 'happy', 'great', 'awesome', 'excited', 'thanks', 'good'],
    negative: ['sad', 'angry', 'upset', 'sorry', 'worried', 'bad'],
    neutral: ['okay', 'fine', 'alright', 'maybe', 'perhaps']
  }

  const emotionalTone = analyzeEmotionalTone(messages, emotionalWords)
  const conversationStyle = analyzeConversationStyle(messages)
  const responsePatterns = analyzeResponsePatterns(messages)
  const typicalReactions = findTypicalReactions(messages)
  const uniqueQuirks = findUniqueQuirks(messages)

  return {
    emotionalTone,
    conversationStyle,
    responsePatterns,
    typicalReactions,
    uniqueQuirks
  }
}

function analyzeEmotionalTone(messages: string[], emotionalWords: Record<string, string[]>) {
  let positive = 0, negative = 0, neutral = 0

  messages.forEach(msg => {
    const lowerMsg = msg.toLowerCase()
    if (emotionalWords.positive.some(word => lowerMsg.includes(word))) positive++
    if (emotionalWords.negative.some(word => lowerMsg.includes(word))) negative++
    if (emotionalWords.neutral.some(word => lowerMsg.includes(word))) neutral++
  })

  if (positive > negative && positive > neutral) return 'generally positive and upbeat'
  if (negative > positive && negative > neutral) return 'tends to be more serious or concerned'
  if (neutral > positive && neutral > negative) return 'usually neutral and balanced'
  return 'varies between positive and neutral'
}

function analyzeConversationStyle(messages: string[]) {
  const avgLength = messages.reduce((sum, msg) => sum + msg.length, 0) / messages.length
  const questionFreq = messages.filter(msg => msg.includes('?')).length / messages.length
  const exclamationFreq = messages.filter(msg => msg.includes('!')).length / messages.length

  if (avgLength > 100) return 'detailed and thorough in responses'
  if (questionFreq > 0.3) return 'very engaging and inquisitive'
  if (exclamationFreq > 0.3) return 'enthusiastic and expressive'
  return 'concise and straightforward'
}

function analyzeResponsePatterns(messages: string[]) {
  const patterns = []
  if (messages.some(msg => msg.toLowerCase().startsWith('hmm'))) patterns.push('often starts with thoughtful consideration')
  if (messages.some(msg => msg.toLowerCase().includes('but'))) patterns.push('likes to present alternative viewpoints')
  if (messages.some(msg => msg.toLowerCase().includes('actually'))) patterns.push('tends to clarify or correct information')
  return patterns.join(', ') || 'direct and to-the-point'
}

function findTypicalReactions(messages: string[]) {
  const reactions = []
  if (messages.some(msg => msg.match(/haha|lol|😄/i))) reactions.push('responds with humor')
  if (messages.some(msg => msg.match(/wow|oh|ah/i))) reactions.push('shows surprise or interest')
  if (messages.some(msg => msg.match(/thanks|thank you/i))) reactions.push('frequently expresses gratitude')
  return reactions.join(', ') || 'varies based on context'
}

function findUniqueQuirks(messages: string[]) {
  const quirks = []
  if (messages.some(msg => msg.includes('...'))) quirks.push('uses ellipsis for emphasis')
  if (messages.some(msg => msg.match(/!{2,}/))) quirks.push('emphasizes with multiple exclamation marks')
  if (messages.some(msg => msg.match(/\?{2,}/))) quirks.push('shows curiosity with multiple question marks')
  return quirks.join(', ') || 'maintains a consistent style'
}

// Helper function to find common phrases (kept from original)
function findCommonPhrases(messages: string[], minWords = 3): string[] {
  const phrases: { [key: string]: number } = {}
  
  messages.forEach(msg => {
    const words = msg.toLowerCase().split(' ')
    for (let i = 0; i <= words.length - minWords; i++) {
      const phrase = words.slice(i, i + minWords).join(' ')
      phrases[phrase] = (phrases[phrase] || 0) + 1
    }
  })

  return Object.entries(phrases)
    .filter(([_, count]) => count > 1)
    .sort(([_, a], [__, b]) => b - a)
    .map(([phrase]) => phrase)
    .slice(0, 5)
}

// Helper function to analyze formality level (kept from original)
function analyzeFormalityLevel(messages: string[]): string {
  const formalIndicators = [
    'would you', 'could you', 'please', 'thank you', 'regards',
    'sincerely', 'appreciate', 'kindly'
  ]
  const informalIndicators = [
    'hey', 'yeah', 'cool', 'gonna', 'wanna', 'dunno', 'lol', 
    'haha', 'wtf', 'omg', 'ur', 'u', 'r'
  ]

  let formalCount = 0
  let informalCount = 0

  messages.forEach(msg => {
    const lowerMsg = msg.toLowerCase()
    formalIndicators.forEach(word => {
      if (lowerMsg.includes(word)) formalCount++
    })
    informalIndicators.forEach(word => {
      if (lowerMsg.includes(word)) informalCount++
    })
  })

  if (formalCount > informalCount * 2) return 'very formal and polite'
  if (formalCount > informalCount) return 'generally formal with occasional casual moments'
  if (informalCount > formalCount * 2) return 'very casual and relaxed'
  return 'balanced between formal and casual'
}