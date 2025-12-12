import { supabase } from './supabase';

export interface ChatResponse {
    message: string;
}

/**
 * Send a message to the AI training assistant.
 * 
 * V1: Uses Supabase Edge Function as proxy to hide API key.
 * Falls back to client-side call if edge function not deployed.
 */
export const sendMessageToAI = async (userMessage: string, language: string = 'en'): Promise<ChatResponse> => {
    try {
        // Try Supabase Edge Function first (recommended for production)
        const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: { message: userMessage, language }
        });

        if (!error && data?.message) {
            return { message: data.message };
        }

        // If edge function fails or not deployed, return helpful message
        console.warn('[AI Service] Edge function not available:', error?.message || 'Unknown error');
        return {
            message: language === 'hu'
                ? 'Az AI edző jelenleg nem érhető el. Kérlek, próbáld újra később!'
                : 'The AI coach is temporarily unavailable. Please try again later!',
        };

    } catch (error) {
        console.error("AI Service Error:", error);
        return {
            message: language === 'hu'
                ? 'Hiba történt az AI elérésekor. Kérlek, próbáld újra!'
                : 'Sorry, I had trouble reaching the training center. Please try again.',
        };
    }
};
