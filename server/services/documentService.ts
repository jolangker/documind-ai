import * as unpdf from 'unpdf'
import { v4 as uuidv4 } from 'uuid'
import { splitter } from '../utils/langchain'
import type { DocumentChunk, DocumentEmbedding } from '~~/shared/types/document'

export function useDocumentService() {
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

  const storeEmbeddings = async (embeddings: DocumentEmbedding[]) => {
    const { error } = await supabase.from('documents').insert(embeddings)
    if (error) {
      createError(error)
    }
  }

  const storeAttachment = async (userId: string, file: File) => {
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(`${userId}/${uuidv4()}.pdf`, file)

    if (!data || error) {
      throw createError(error)
    }

    return data
  }

  const storeDocumentEmbeddings = async (userId: string, file: File, embeddings: DocumentEmbedding[]) => {
    await storeEmbeddings(embeddings)
    const attachment = await storeAttachment(userId, file)

    return attachment
  }

  return {
    extractTextFromDocument,
    chunkDocumentText,
    storeDocumentEmbeddings
  }
}
