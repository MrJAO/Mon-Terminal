import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
})

export async function analyzeWalletText(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // ✅ latest model — fast, smart, efficient
      messages: [
        {
          role: 'system',
          content: 'You are an AI Mon Terminal that helps analyze wallet and interact with monad testnet.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content?.trim()
  } catch (error) {
    console.error('❌ AI error:', error.response?.data || error.message || error)
    return 'Mon Terminal encountered an error while thinking...'
  }
}
