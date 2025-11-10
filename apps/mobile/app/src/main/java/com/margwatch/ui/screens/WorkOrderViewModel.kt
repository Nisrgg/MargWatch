package com.margwatch.ui.screens

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.margwatch.data.local.TokenManager
import com.margwatch.data.repository.MargWatchRepository
import com.margwatch.shared.types.WorkOrder
import com.margwatch.shared.types.WorkOrderResponse
import com.margwatch.shared.types.WorkOrderStatus
import com.margwatch.ui.components.showError
import com.margwatch.ui.components.showSuccess
import com.margwatch.shared.types.UserRole
import com.margwatch.utils.StateMachineValidator
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File

data class WorkOrderUiState(
    val isLoading: Boolean = false,
    val workOrders: List<WorkOrder> = emptyList(),
    val selectedWorkOrder: WorkOrder? = null,
    val error: String? = null,
    val showUpdateDialog: Boolean = false,
    val showCompleteDialog: Boolean = false,
    val completionImages: List<Uri> = emptyList(),
    val completionDescription: String = "",
    val completionCost: String = "",
    val isCompleting: Boolean = false,
    val completionSuccess: Boolean = false
)

class WorkOrderViewModel(
    private val repository: MargWatchRepository = MargWatchRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(WorkOrderUiState())
    val uiState: StateFlow<WorkOrderUiState> = _uiState.asStateFlow()

    fun loadWorkOrders(tokenManager: TokenManager) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val token = tokenManager.getToken().first() as? String
                if (token != null) {
                    val result = repository.getWorkerOrders(token)
                    result.onSuccess { response ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                workOrders = response.workOrders,
                                error = null
                            ) 
                        }
                    }.onFailure { e ->
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                error = "Failed to load work orders: ${e.message}"
                            ) 
                        }
                    }
                } else {
                    _uiState.update { 
                        it.copy(
                            isLoading = false,
                            error = "No authentication token found"
                        ) 
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        error = "Error loading work orders: ${e.message}"
                    ) 
                }
            }
        }
    }

    fun selectWorkOrder(workOrder: WorkOrder) {
        _uiState.update { it.copy(selectedWorkOrder = workOrder) }
    }

    fun showUpdateDialog(workOrder: WorkOrder) {
        _uiState.update { 
            it.copy(
                selectedWorkOrder = workOrder,
                showUpdateDialog = true
            ) 
        }
    }

    fun showCompleteDialog(workOrder: WorkOrder) {
        _uiState.update { 
            it.copy(
                selectedWorkOrder = workOrder,
                showCompleteDialog = true,
                completionImages = emptyList(),
                completionDescription = "",
                completionCost = "",
                completionSuccess = false
            ) 
        }
    }

    fun hideDialogs() {
        _uiState.update { 
            it.copy(
                showUpdateDialog = false,
                showCompleteDialog = false,
                selectedWorkOrder = null,
                completionImages = emptyList(),
                completionDescription = "",
                completionCost = "",
                isCompleting = false,
                completionSuccess = false
            ) 
        }
    }

    fun onPhotoCaptured(uri: Uri) {
        _uiState.update { currentState ->
            currentState.copy(
                completionImages = currentState.completionImages + uri
            )
        }
    }

    fun removeCompletionImage(uri: Uri) {
        _uiState.update { currentState ->
            currentState.copy(
                completionImages = currentState.completionImages.filter { it != uri }
            )
        }
    }

    fun updateCompletionDescription(description: String) {
        _uiState.update { it.copy(completionDescription = description) }
    }

    fun updateCompletionCost(cost: String) {
        _uiState.update { it.copy(completionCost = cost) }
    }

    fun updateWorkOrderStatus(
        tokenManager: TokenManager,
        workOrderId: String,
        status: String,
        description: String? = null,
        cost: Double? = null,
        imageFiles: List<File>? = null,
        currentUserRole: UserRole,
        onResult: (Boolean, String?) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val token = tokenManager.getToken().first() as? String
                if (token != null) {
                    // Find the current work order to get its current status
                    val currentWorkOrder = _uiState.value.workOrders.find { it.id == workOrderId }
                    if (currentWorkOrder == null) {
                        _uiState.update { it.copy(isLoading = false, error = "Work order not found") }
                        onResult(false, "Work order not found")
                        return@launch
                    }

                    // Validate state transition
                    val isValidTransition = StateMachineValidator.validateWorkOrderTransition(
                        currentWorkOrder.status.name,
                        status,
                        currentUserRole
                    )

                    if (!isValidTransition) {
                        val errorMessage = StateMachineValidator.getTransitionErrorMessage(
                            currentWorkOrder.status.name,
                            status,
                            currentUserRole
                        )
                        _uiState.update { it.copy(isLoading = false, error = errorMessage) }
                        showError(errorMessage)
                        return@launch
                    }

                    val result = repository.updateWorkOrderStatus(
                        token, workOrderId, status, description, cost, imageFiles
                    )
                    result.onSuccess {
                        _uiState.update { it.copy(isLoading = false) }
                        showSuccess("Work order status updated successfully")
                        onResult(true, null)
                    }.onFailure { e ->
                        _uiState.update { it.copy(isLoading = false, error = e.message) }
                        showError(e.message ?: "Failed to update work order status")
                        onResult(false, e.message)
                    }
                } else {
                    _uiState.update { it.copy(isLoading = false, error = "No authentication token found") }
                    onResult(false, "No authentication token found")
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
                onResult(false, e.message)
            }
        }
    }

    fun completeWorkOrder(
        tokenManager: TokenManager,
        context: android.content.Context,
        currentUserRole: UserRole,
        onResult: (Boolean, String?) -> Unit
    ) {
        val workOrder = _uiState.value.selectedWorkOrder
        if (workOrder == null) {
            onResult(false, "No work order selected")
            return
        }

        // Validate state transition to COMPLETED
        val isValidTransition = StateMachineValidator.validateWorkOrderTransition(
            workOrder.status.name,
            WorkOrderStatus.COMPLETED.name,
            currentUserRole
        )

        if (!isValidTransition) {
            val errorMessage = StateMachineValidator.getTransitionErrorMessage(
                workOrder.status.name,
                WorkOrderStatus.COMPLETED.name,
                currentUserRole
            )
            showError(errorMessage)
            onResult(false, errorMessage)
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isCompleting = true, error = null) }
            try {
                val token = tokenManager.getToken().first() as? String
                if (token != null) {
                    // Convert URIs to Files
                    val imageFiles = _uiState.value.completionImages.map { uri ->
                        val fileName = "completion_image_${System.currentTimeMillis()}_${uri.hashCode()}.jpg"
                        val file = File(context.cacheDir, fileName)
                        
                        context.contentResolver.openInputStream(uri)?.use { input ->
                            file.outputStream().use { output ->
                                input.copyTo(output)
                            }
                        }
                        file
                    }

                    val result = repository.completeWorkOrder(
                        token,
                        workOrder.id,
                        _uiState.value.completionDescription.ifEmpty { null },
                        _uiState.value.completionCost.toDoubleOrNull(),
                        imageFiles.ifEmpty { null }
                    )
                    
                    result.onSuccess {
                        _uiState.update { 
                            it.copy(
                                isCompleting = false,
                                completionSuccess = true,
                                error = null
                            ) 
                        }
                        showSuccess("Work order completed successfully")
                        onResult(true, null)
                    }.onFailure { e ->
                        _uiState.update { 
                            it.copy(
                                isCompleting = false,
                                error = e.message
                            ) 
                        }
                        showError(e.message ?: "Failed to complete work order")
                        onResult(false, e.message)
                    }
                } else {
                    _uiState.update { 
                        it.copy(
                            isCompleting = false,
                            error = "No authentication token found"
                        ) 
                    }
                    onResult(false, "No authentication token found")
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isCompleting = false,
                        error = e.message
                    ) 
                }
                onResult(false, e.message)
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
