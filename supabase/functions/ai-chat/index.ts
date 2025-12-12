// Supabase Edge Function: ai-chat
// Deploy with: supabase functions deploy ai-chat
// 
// This proxies AI requests to hide the API key from the client.
// Set GEMINI_API_KEY in your Supabase project secrets:
// supabase secrets set GEMINI_API_KEY=your_key_here

// @ts-nocheck - Deno runtime, not Node.js
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { message, language = 'en' } = await req.json()

        const API_KEY = Deno.env.get('GEMINI_API_KEY')
        if (!API_KEY) {
            throw new Error('GEMINI_API_KEY not configured')
        }

        const genAI = new GoogleGenerativeAI(API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `You are an expert professional dog trainer. 
Your goal is to provide helpful, positive reinforcement-based training advice.
Keep your answers concise, encouraging, and practical.
Please answer in ${language === 'hu' ? 'Hungarian' : 'English'}.

User: ${message}`

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        return new Response(
            JSON.stringify({ message: text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: unknown) {
        console.error('AI Chat Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return new Response(
            JSON.stringify({ error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
