import type { _SERVICE as FundVerseBackendService } from "../../../declarations/FundVerse_backend/FundVerse_backend.did.d.ts";

const CHUNK_SIZE = 1_500_000; // 1.5MB chunks to stay under 2MB limit

export interface ChunkedUploadResult {
  success: boolean;
  docId?: bigint;
  error?: string;
}

/**
 * Upload a file using chunked upload for large files
 */
export async function uploadFileChunked(
  backendActor: FundVerseBackendService,
  campaignId: bigint,
  file: File,
  name: string
): Promise<ChunkedUploadResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const fileSize = arrayBuffer.byteLength;
    
    // If file is small enough, use regular upload
    if (fileSize <= CHUNK_SIZE) {
      const bytes = new Uint8Array(arrayBuffer);
      const docId = await backendActor.upload_doc(
        campaignId,
        name,
        file.type,
        Array.from(bytes),
        BigInt(Date.now() >>> 0)
      );
      
      if (docId && docId.length > 0) {
        return { success: true, docId: docId[0] as bigint };
      } else {
        return { success: false, error: "Failed to upload document" };
      }
    }
    
    // For large files, use chunked upload
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    
    // Start chunked upload
    const docIdResult = await backendActor.start_chunked_upload(
      campaignId,
      name,
      file.type,
      totalChunks,
      BigInt(Date.now() >>> 0)
    );
    
    if (!docIdResult || docIdResult.length === 0) {
      return { success: false, error: "Failed to start chunked upload" };
    }
    
    const docId = docIdResult[0] as bigint;
    
    // Upload chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunkData = arrayBuffer.slice(start, end);
      const chunkBytes = new Uint8Array(chunkData);
      
      const isFinal = i === totalChunks - 1;
      
      const chunk = {
        doc_id: docId,
        chunk_index: i,
        data: Array.from(chunkBytes),
        is_final: isFinal,
      };
      
      const result = await backendActor.upload_chunk(chunk);
      
      if ('Err' in result) {
        return { success: false, error: result.Err };
      }
    }
    
    return { success: true, docId };
  } catch (error: any) {
    console.error("Chunked upload error:", error);
    return { 
      success: false, 
      error: error?.message || "Unknown error during upload" 
    };
  }
}

/**
 * Upload multiple files with progress tracking
 */
export async function uploadMultipleFiles(
  backendActor: FundVerseBackendService,
  campaignId: bigint,
  files: Array<{ file: File; name: string }>,
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: boolean; docIds: bigint[]; errors: string[] }> {
  const docIds: bigint[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const { file, name } = files[i];
    
    try {
      const result = await uploadFileChunked(backendActor, campaignId, file, name);
      
      if (result.success && result.docId) {
        docIds.push(result.docId);
      } else {
        errors.push(`${name}: ${result.error || 'Upload failed'}`);
      }
    } catch (error: any) {
      errors.push(`${name}: ${error?.message || 'Upload failed'}`);
    }
    
    // Report progress
    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }
  
  return {
    success: errors.length === 0,
    docIds,
    errors,
  };
}
