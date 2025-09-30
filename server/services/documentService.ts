import * as unpdf from 'unpdf'
import { v4 as uuidv4 } from 'uuid'
import { splitter } from '../utils/langchain'
import type { DocumentChunk, DocumentEmbedding } from '~~/shared/types/document'
import type { H3Event } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export async function useDocumentService(event: H3Event) {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  const extractTextFromDocument = async (file: File) => {
    const buffer = await file.arrayBuffer()
    const pdf = await unpdf.getDocumentProxy(new Uint8Array(buffer))
    const extraction = await unpdf.extractText(pdf, { mergePages: true })
    return extraction
  }

  const chunkDocumentText = async (text: string, fileName: string): Promise<DocumentChunk[]> => {
    const langchainDocuments = await splitter.createDocuments([text])
    return langchainDocuments.map(({ pageContent }) => ({
      content: pageContent,
      metadata: {
        source: fileName
      }
    }))
  }

  const storeEmbeddings = async (chatId: string, embeddings: DocumentEmbedding[]) => {
    const payload = embeddings.map(embedding => ({
      ...embedding,
      chat_id: chatId
    })) as unknown as DocumentPayload[]

    const { error } = await supabase.from('documents').insert(payload)
    if (error) {
      throw createError(error)
    }
  }

  const storeAttachment = async (file: File) => {
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(`${user?.sub}/${uuidv4()}.pdf`, file)

    if (!data || error) {
      throw createError(error)
    }

    return data
  }

  return {
    extractTextFromDocument,
    chunkDocumentText,
    storeAttachment,
    storeEmbeddings
  }
}
