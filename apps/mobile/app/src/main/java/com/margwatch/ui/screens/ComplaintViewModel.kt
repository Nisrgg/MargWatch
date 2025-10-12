package com.margwatch.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.margwatch.data.model.Complaint
import com.margwatch.data.repository.MargWatchRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File

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

    fun submitComplaint(
        token: String,
        imageFiles: List<File>,
        latitude: Float,
        longitude: Float,
        address: String?
    ) {
        _uiState.update { it.copy(isLoading = true, error = null, submissionSuccess = false) }
        viewModelScope.launch {
            val result = repository.submitComplaint(token, imageFiles, latitude, longitude, address)
            result.onSuccess { complaint ->
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        submissionSuccess = true,
                        selectedComplaint = complaint // Optionally show submitted complaint
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


