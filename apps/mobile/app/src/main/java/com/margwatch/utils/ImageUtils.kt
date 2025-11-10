package com.margwatch.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

object ImageUtils {
    
    /**
     * Compresses an image from URI to a smaller file
     * @param context Android context
     * @param uri Source image URI
     * @param quality Compression quality (0-100, default 80)
     * @param maxWidth Maximum width for the compressed image
     * @param maxHeight Maximum height for the compressed image
     * @return Compressed image file
     */
    suspend fun compressImage(
        context: Context, 
        uri: Uri, 
        quality: Int = 80,
        maxWidth: Int = 1920,
        maxHeight: Int = 1080
    ): File? = withContext(Dispatchers.IO) {
        var originalBitmap: Bitmap? = null
        var scaledBitmap: Bitmap? = null
        var inputStream: InputStream? = null
        var outputStream: FileOutputStream? = null
        
        try {
            // Get input stream from URI
            inputStream = context.contentResolver.openInputStream(uri)
            if (inputStream == null) {
                android.util.Log.e("ImageUtils", "Could not open input stream for URI: $uri")
                return@withContext null
            }
            
            // Decode the bitmap
            originalBitmap = BitmapFactory.decodeStream(inputStream)
            inputStream.close()
            inputStream = null
            
            if (originalBitmap == null) {
                android.util.Log.e("ImageUtils", "Could not decode bitmap from URI: $uri")
                return@withContext null
            }
            
            // Calculate scaling to fit within max dimensions while maintaining aspect ratio
            scaledBitmap = scaleBitmap(originalBitmap, maxWidth, maxHeight)
            
            // Create temporary file
            val fileName = "compressed_image_${System.currentTimeMillis()}.jpg"
            val tempFile = File(context.cacheDir, fileName)
            
            // Compress and save
            outputStream = FileOutputStream(tempFile)
            scaledBitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
            outputStream.close()
            outputStream = null
            
            android.util.Log.d("ImageUtils", "Image compressed successfully: ${tempFile.name}, size: ${tempFile.length()} bytes")
            tempFile
            
        } catch (e: Exception) {
            android.util.Log.e("ImageUtils", "Error compressing image", e)
            null
        } finally {
            // Clean up resources
            try {
                inputStream?.close()
                outputStream?.close()
                originalBitmap?.recycle()
                scaledBitmap?.recycle()
            } catch (e: Exception) {
                android.util.Log.w("ImageUtils", "Error cleaning up resources", e)
            }
        }
    }
    
    /**
     * Scales a bitmap to fit within the specified dimensions while maintaining aspect ratio
     */
    private fun scaleBitmap(bitmap: Bitmap, maxWidth: Int, maxHeight: Int): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        
        // If already within limits, return original
        if (width <= maxWidth && height <= maxHeight) {
            return bitmap
        }
        
        // Calculate scaling factor
        val scaleWidth = maxWidth.toFloat() / width
        val scaleHeight = maxHeight.toFloat() / height
        val scale = minOf(scaleWidth, scaleHeight)
        
        val newWidth = (width * scale).toInt()
        val newHeight = (height * scale).toInt()
        
        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }
    
    /**
     * Gets the file size in a human-readable format
     */
    fun getFileSizeString(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "${bytes / 1024} KB"
            bytes < 1024 * 1024 * 1024 -> "${bytes / (1024 * 1024)} MB"
            else -> "${bytes / (1024 * 1024 * 1024)} GB"
        }
    }
    
    /**
     * Validates if the image file is within acceptable size limits
     */
    fun isValidImageSize(file: File, maxSizeBytes: Long = 10 * 1024 * 1024): Boolean {
        return file.exists() && file.length() > 0 && file.length() <= maxSizeBytes
    }
}
