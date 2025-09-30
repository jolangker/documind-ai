import { OpenAI } from 'openai'
import type { Langchain } from '~~/shared/types/langchain'

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  throw createError({ status: 500, statusMessage: 'OpenAI API Key not provided' })
}

export const openai = new OpenAI({
  apiKey
})
