package com.margwatch.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.margwatch.shared.types.Complaint
import com.margwatch.data.repository.MargWatchRepository
import com.margwatch.ui.components.showError
import com.margwatch.ui.components.showSuccess
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import java.io.File
import android.content.Context
import android.net.Uri
import com.margwatch.utils.ImageUtils

data class ComplaintUiState(
    val isLoading: Boolean = false,
    val complaints: List<Complaint> = emptyList(),
    val selectedComplaint: Complaint? = null,
    val error: String? = null,
    val submissionSuccess: Boolean = false
)

class ComplaintViewModel(private val repository: MargWatchRepository = MargWatchRepository()) : ViewModel() {

    private val _uiState = MutableStateFlow(ComplaintUiState())
    val uiState: StateFlow<ComplaintUiState> = _uiState.asStateFlow()

    // Validation constants
    companion object {
        // Gujarat, India bounding box (same as backend)
        private const val GUJARAT_MIN_LAT = 20.1f
        private const val GUJARAT_MAX_LAT = 24.7f
        private const val GUJARAT_MIN_LON = 68.1f
        private const val GUJARAT_MAX_LON = 74.4f
        
        // Maximum file size (10MB)
        private const val MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024L
        
        // Minimum valid coordinate values (not 0.0)
        private const val MIN_VALID_COORDINATE = 0.0001f
    }

    /**
     * Validates coordinates for basic bounds and service area
     */
    private fun validateCoordinates(latitude: Float, longitude: Float): ValidationResult {
        // Check for zero or invalid coordinates
        if (latitude == 0.0f || longitude == 0.0f || 
            kotlin.math.abs(latitude) < MIN_VALID_COORDINATE || 
            kotlin.math.abs(longitude) < MIN_VALID_COORDINATE) {
            return ValidationResult(
                isValid = false,
                error = "Invalid GPS coordinates obtained. Please ensure location services are enabled and try again."
            )
        }
        
        // Check basic coordinate bounds
        if (latitude !in -90f..90f || longitude !in -180f..180f) {
            return ValidationResult(
                isValid = false,
                error = "Invalid GPS coordinates. Latitude must be between -90 and 90, longitude between -180 and 180."
            )
        }
        
        // Check service area (Gujarat bounds)
        if (latitude !in GUJARAT_MIN_LAT..GUJARAT_MAX_LAT || 
            longitude !in GUJARAT_MIN_LON..GUJARAT_MAX_LON) {
            return ValidationResult(
                isValid = false,
                error = "Coordinates are outside the service area. Please provide coordinates within Gujarat, India."
            )
        }
        
        return ValidationResult(isValid = true)
    }

    /**
     * Validates image files for integrity and size
     */
    private fun validateImageFiles(imageFiles: List<File>): ValidationResult {
        if (imageFiles.isEmpty()) {
            return ValidationResult(
                isValid = false,
                error = "At least one image is required for complaint submission."
            )
        }
        
        for ((index, file) in imageFiles.withIndex()) {
            if (!file.exists()) {
                return ValidationResult(
                    isValid = false,
                    error = "Image file ${index + 1} does not exist. Please retake the photo."
                )
            }
            
            if (file.length() == 0L) {
                return ValidationResult(
                    isValid = false,
                    error = "Image file ${index + 1} is empty. Please retake the photo."
                )
            }
            
            if (file.length() > MAX_FILE_SIZE_BYTES) {
                return ValidationResult(
                    isValid = false,
                    error = "Image file ${index + 1} is too large (${ImageUtils.getFileSizeString(file.length())}). Maximum size allowed is ${ImageUtils.getFileSizeString(MAX_FILE_SIZE_BYTES)}."
                )
            }
        }
        
        return ValidationResult(isValid = true)
    }

    /**
     * Data class for validation results
     */
    private data class ValidationResult(
        val isValid: Boolean,
        val error: String? = null
    )

    fun submitComplaint(
        token: String,
        imageFiles: List<File>,
        latitude: Float,
        longitude: Float,
        address: String?
    ) {
        _uiState.update { it.copy(isLoading = true, error = null, submissionSuccess = false) }
        viewModelScope.launch {
            try {
                // Validate coordinates first
                val coordinateValidation = validateCoordinates(latitude, longitude)
                if (!coordinateValidation.isValid) {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = coordinateValidation.error
                        )
                    }
                    showError(coordinateValidation.error!!)
                    return@launch
                }
                
                // Validate image files
                val imageValidation = validateImageFiles(imageFiles)
                if (!imageValidation.isValid) {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = imageValidation.error
                        )
                    }
                    showError(imageValidation.error!!)
                    return@launch
                }
                
                // All validations passed, proceed with submission
                val result = repository.submitComplaint(token, imageFiles, latitude, longitude, address)
                result.onSuccess { complaint ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            submissionSuccess = true,
                            selectedComplaint = complaint
                        )
                    }
                }.onFailure { e ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = e.message ?: "Complaint submission failed"
                        )
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("ComplaintViewModel", "EXCEPTION: Unexpected error during submission", e)
                android.util.Log.e("ComplaintViewModel", "  - Exception type: ${e.javaClass.simpleName}")
                android.util.Log.e("ComplaintViewModel", "  - Exception message: ${e.message}")
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Validation error: ${e.message}"
                    )
                }
                showError("Validation error: ${e.message}")
            }
        }
    }

    fun submitComplaintWithCompression(
        context: Context,
        token: String,
        imageUris: List<Uri>,
        latitude: Float,
        longitude: Float,
        address: String?
    ) {
        android.util.Log.d("ComplaintViewModel", "=== SUBMIT COMPLAINT WITH COMPRESSION CALLED ===")
        android.util.Log.d("ComplaintViewModel", "Input parameters:")
        android.util.Log.d("ComplaintViewModel", "  - token: Present")
        android.util.Log.d("ComplaintViewModel", "  - imageUris.size: ${imageUris.size}")
        android.util.Log.d("ComplaintViewModel", "  - latitude: $latitude")
        android.util.Log.d("ComplaintViewModel", "  - longitude: $longitude")
        android.util.Log.d("ComplaintViewModel", "  - address: $address")
        
        _uiState.update { it.copy(isLoading = true, error = null, submissionSuccess = false) }
        viewModelScope.launch {
            try {
                android.util.Log.d("ComplaintViewModel", "Starting validation checks...")
                
                // Validate coordinates first
                val coordinateValidation = validateCoordinates(latitude, longitude)
                android.util.Log.d("ComplaintViewModel", "Coordinate validation result: ${coordinateValidation.isValid}")
                if (!coordinateValidation.isValid) {
                    android.util.Log.e("ComplaintViewModel", "COORDINATE VALIDATION FAILED: ${coordinateValidation.error}")
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = coordinateValidation.error
                        )
                    }
                    showError(coordinateValidation.error!!)
                    return@launch
                }
                
                android.util.Log.d("ComplaintViewModel", "Starting image compression...")
                // Compress images asynchronously
                val compressedFiles = mutableListOf<File>()
                val compressionErrors = mutableListOf<String>()
                
                // Process images in parallel for better performance
                val compressionJobs = imageUris.map { uri ->
                    async {
                        try {
                            val compressedFile = ImageUtils.compressImage(context, uri)
                            if (compressedFile != null && ImageUtils.isValidImageSize(compressedFile)) {
                                android.util.Log.d("ComplaintViewModel", "Compressed image: ${compressedFile.name}, size: ${ImageUtils.getFileSizeString(compressedFile.length())}")
                                compressedFile
                            } else {
                                android.util.Log.w("ComplaintViewModel", "Failed to compress or validate image: $uri")
                                null
                            }
                        } catch (e: Exception) {
                            android.util.Log.e("ComplaintViewModel", "Error compressing image: $uri", e)
                            compressionErrors.add("Failed to compress image: ${e.message}")
                            null
                        }
                    }
                }
                
                // Wait for all compression jobs to complete
                val compressionResults = compressionJobs.awaitAll()
                compressedFiles.addAll(compressionResults.filterNotNull())
                
                android.util.Log.d("ComplaintViewModel", "Image compression completed:")
                android.util.Log.d("ComplaintViewModel", "  - compressionResults.size: ${compressionResults.size}")
                android.util.Log.d("ComplaintViewModel", "  - compressedFiles.size: ${compressedFiles.size}")
                android.util.Log.d("ComplaintViewModel", "  - compressionErrors.size: ${compressionErrors.size}")
                
                if (compressedFiles.isEmpty()) {
                    val errorMessage = if (compressionErrors.isNotEmpty()) {
                        "Failed to process images: ${compressionErrors.joinToString(", ")}"
                    } else {
                        "Failed to process images. Please try again."
                    }
                    android.util.Log.e("ComplaintViewModel", "NO COMPRESSED FILES - Stopping submission: $errorMessage")
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = errorMessage
                        )
                    }
                    showError(errorMessage)
                    return@launch
                }
                
                // Validate compressed image files
                android.util.Log.d("ComplaintViewModel", "Validating compressed image files...")
                val imageValidation = validateImageFiles(compressedFiles)
                android.util.Log.d("ComplaintViewModel", "Image validation result: ${imageValidation.isValid}")
                if (!imageValidation.isValid) {
                    android.util.Log.e("ComplaintViewModel", "IMAGE VALIDATION FAILED: ${imageValidation.error}")
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = imageValidation.error
                        )
                    }
                    showError(imageValidation.error!!)
                    
                    // Clean up compressed files
                    compressedFiles.forEach { file ->
                        if (file.exists()) {
                            file.delete()
                        }
                    }
                    return@launch
                }
                
                // All validations passed, proceed with submission
                android.util.Log.d("ComplaintViewModel", "All validations passed, calling repository.submitComplaint...")
                val result = repository.submitComplaint(token, compressedFiles, latitude, longitude, address)
                result.onSuccess { complaint ->
                    android.util.Log.d("ComplaintViewModel", "SUCCESS: Complaint submitted successfully")
                    android.util.Log.d("ComplaintViewModel", "  - Complaint ID: ${complaint.id}")
                    android.util.Log.d("ComplaintViewModel", "  - Status: ${complaint.status}")
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            submissionSuccess = true,
                            selectedComplaint = complaint
                        )
                    }
                    showSuccess("Complaint submitted successfully!")
                }.onFailure { e ->
                    android.util.Log.e("ComplaintViewModel", "FAILURE: Complaint submission failed", e)
                    android.util.Log.e("ComplaintViewModel", "  - Error: ${e.message}")
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = e.message ?: "Complaint submission failed"
                        )
                    }
                    showError(e.message ?: "Complaint submission failed")
                }
                
                // Clean up compressed files
                compressedFiles.forEach { file ->
                    if (file.exists()) {
                        file.delete()
                    }
                }
                
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Error processing images: ${e.message}"
                    )
                }
                showError("Error processing images: ${e.message}")
            }
        }
    }

    fun getUserComplaints(token: String) {
        _uiState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            val result = repository.getUserComplaints(token)
            result.onSuccess { data ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        complaints = data.complaints
                    )
                }
            }.onFailure { e ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load complaints"
                    )
                }
                showError(e.message ?: "Failed to load complaints")
            }
        }
    }

    fun getComplaintDetails(token: String, complaintId: String) {
        _uiState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            val result = repository.getComplaintById(token, complaintId)
            result.onSuccess { complaint ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        selectedComplaint = complaint
                    )
                }
            }.onFailure { e ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load complaint details"
                    )
                }
                showError(e.message ?: "Failed to load complaint details")
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun submissionSuccessHandled() {
        _uiState.update { it.copy(submissionSuccess = false) }
    }
}


