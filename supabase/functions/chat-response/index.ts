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

    const { data: messages, error: messagesError } = await supabaseClient
      .from('chat_messages')
      .select('sender_name, content, timestamp')
      .eq('chat_history_id', chatHistoryId)
      .order('timestamp', { ascending: true })
      .limit(2000)

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      throw new Error('Failed to fetch chat history')
    }

    console.log('Retrieved messages:', messages)

    // Analyze message patterns and style without including names
    const participantMessages = messages
      ?.filter(msg => msg.sender_name === participantName)
      .map(msg => msg.content) || []

    // Create chat history without names at the start of messages
    const chatHistory = messages?.map(msg => msg.content).join('\n') || ''

    const prompt = `You are ${participantName}. Based on the following chat history, you've demonstrated these communication patterns:

${participantMessages.length > 0 ? `Here are some examples of how you typically communicate:
${participantMessages.slice(0, 3).join('\n')}` : 'This is a new conversation, but maintain a natural, friendly tone.'}

Chat history:
${chatHistory}

Now respond to this message as ${participantName}, maintaining consistency with your previous communication style, personality traits, and knowledge shown in the chat history:
"${currentMessage}"

Important guidelines:
- Match the tone, style, and personality shown in previous messages
- Keep responses concise and natural
- Maintain consistent knowledge and opinions
- Use similar language patterns and expressions
- Stay in character at all times
- Do not start your response with your name`

    console.log('Sending prompt to OpenAI:', prompt)

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
            content: 'You are an AI trained to respond like a specific person based on their chat history. Focus on maintaining consistent personality traits, knowledge, and communication style. Never start responses with the name of the person you are impersonating.'
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
    console.log('OpenAI response:', data)

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