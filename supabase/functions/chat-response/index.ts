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

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch recent chat history
    const { data: messages, error: messagesError } = await supabaseClient
      .from('chat_messages')
      .select('sender_name, content, timestamp')
      .eq('chat_history_id', chatHistoryId)
      .order('timestamp', { ascending: true })
      .limit(10)

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      throw new Error('Failed to fetch chat history')
    }

    console.log('Retrieved messages:', messages)

    // Format chat history for context
    const chatHistory = messages?.map(msg => 
      `${msg.sender_name}: ${msg.content}`
    ).join('\n') || ''

    // Create prompt for AI
    const prompt = `You are ${participantName}. You have been having conversations as shown in this chat history:

${chatHistory}

Now respond to this message naturally, as ${participantName} would, based on your chat history and personality:
"${currentMessage}"

Keep your response concise and natural, maintaining the same tone and style as shown in the chat history.`

    console.log('Sending prompt to OpenAI:', prompt)

    // Get AI response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an AI trained to respond like a specific person based on their chat history.' },
          { role: 'user', content: prompt }
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    console.log('OpenAI response:', data)

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
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