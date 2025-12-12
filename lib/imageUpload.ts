import { Platform } from 'react-native';

/**
 * Properly typed file object for React Native FormData.
 * This interface matches what Supabase/fetch expect for file uploads.
 */
export interface RNFile {
    uri: string;
    name: string;
    type: string;
}

/**
 * Create a properly formatted file object for FormData uploads.
 * Handles platform differences and provides consistent typing.
 */
export function createFileFromUri(
    uri: string,
    fileName: string,
    mimeType?: string
): RNFile {
    // Infer mime type from extension if not provided
    const extension = fileName.split('.').pop()?.toLowerCase();
    const inferredType = mimeType || getMimeType(extension);

    return {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: fileName,
        type: inferredType,
    };
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension?: string): string {
    const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'heic': 'image/heic',
        'heif': 'image/heif',
    };

    return mimeTypes[extension || ''] || 'image/jpeg';
}

/**
 * Upload an image to Supabase Storage with proper error handling.
 * Returns the public URL on success, null on failure.
 */
export async function uploadImageToSupabase(
    supabase: any,
    bucket: string,
    uri: string,
    fileName: string,
    mimeType?: string
): Promise<{ url: string | null; error: string | null }> {
    try {
        const file = createFileFromUri(uri, fileName, mimeType);

        // For React Native, we need to use FormData with the file object
        const formData = new FormData();
        formData.append('file', file as unknown as Blob);

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, formData, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('[ImageUpload] Upload failed:', uploadError);
            return { url: null, error: uploadError.message };
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return { url: publicUrl, error: null };

    } catch (error) {
        console.error('[ImageUpload] Exception:', error);
        return {
            url: null,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}
