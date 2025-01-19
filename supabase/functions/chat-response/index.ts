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

    // Analyze message patterns
    const messagePatterns = analyzeMessagePatterns(participantMessages)
    console.log('Analyzed message patterns:', messagePatterns)

    const prompt = `You are ${participantName}. Based on the following comprehensive analysis of your communication style from ${participantMessages.length} messages:

Style Analysis:
- Average message length: ${messagePatterns.avgLength} words
- Typical punctuation usage: ${messagePatterns.punctuation}
- Common expressions: ${messagePatterns.commonPhrases.join(', ')}
- Emoji usage: ${messagePatterns.emojiUsage}
- Formality level: ${messagePatterns.formalityLevel}

Here are examples of how you typically communicate:
${participantMessages.slice(-50).join('\n')}

Recent conversation context (last 20 messages):
${recentChatHistory}

Now respond to this message as ${participantName}, strictly maintaining:
1. Your typical message length and structure
2. Your unique expressions and vocabulary
3. Your characteristic punctuation patterns
4. Your emoji usage habits
5. Your level of formality
6. Your conversational quirks and patterns

Respond to: "${currentMessage}"

Important:
- Match your exact communication style from the examples
- Maintain consistent personality traits
- Use your common phrases naturally
- Keep the same tone and formality level
- Do not explain or break character
- Do not start with your name`

    console.log('Sending enhanced prompt to OpenAI with comprehensive style analysis')

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
            content: 'You are an AI trained to precisely mimic a specific person\'s communication style based on their chat history. Focus on maintaining exact message length, punctuation patterns, expressions, and personality traits. Never break character or explain your responses.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      
      if (errorData.error?.message?.includes('exceeded your current quota')) {
        throw new Error('OpenAI API quota exceeded. Please check your billing details.')
      } else if (errorData.error?.message?.includes('invalid_api_key')) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.')
      } else {
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
      }
    }

    const data = await response.json()
    console.log('Received response from OpenAI')

    if (!data.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI response format:', data)
      throw new Error('Invalid response format from OpenAI')
    }

    const aiResponse = data.choices[0].message.content

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in chat-response function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to analyze message patterns
function analyzeMessagePatterns(messages: string[]) {
  const wordCounts = messages.map(msg => msg.split(' ').length)
  const avgLength = Math.round(wordCounts.reduce((a, b) => a + b, 0) / messages.length)

  // Analyze punctuation patterns
  const punctuationCount = messages.reduce((acc, msg) => {
    const exclamations = (msg.match(/!/g) || []).length
    const questions = (msg.match(/\?/g) || []).length
    const ellipsis = (msg.match(/\.\.\./g) || []).length
    return { exclamations, questions, ellipsis }
  }, { exclamations: 0, questions: 0, ellipsis: 0 })

  // Find common phrases (3+ words)
  const commonPhrases = findCommonPhrases(messages)

  // Analyze emoji usage
  const emojiCount = messages.reduce((count, msg) => {
    return count + (msg.match(/[\p{Emoji}]/gu) || []).length
  }, 0)
  const emojiUsage = emojiCount / messages.length > 0.5 ? 'frequent' : 
                     emojiCount / messages.length > 0.2 ? 'moderate' : 'rare'

  // Analyze formality
  const formalityLevel = analyzeFormalityLevel(messages)

  return {
    avgLength,
    punctuation: `${punctuationCount.exclamations > messages.length / 2 ? 'frequent' : 'occasional'} exclamations, ` +
                 `${punctuationCount.questions > messages.length / 3 ? 'frequent' : 'occasional'} questions, ` +
                 `${punctuationCount.ellipsis > messages.length / 4 ? 'frequent' : 'rare'} ellipsis`,
    commonPhrases: commonPhrases.slice(0, 5),
    emojiUsage,
    formalityLevel
  }
}

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

  if (formalCount > informalCount * 2) return 'very formal'
  if (formalCount > informalCount) return 'somewhat formal'
  if (informalCount > formalCount * 2) return 'very casual'
  return 'casual'
}