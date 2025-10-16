package com.margwatch.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.margwatch.data.local.TokenManager
import com.margwatch.data.model.WorkOrder
import com.margwatch.data.model.WorkOrderResponse
import com.margwatch.data.repository.MargWatchRepository
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
    val showCompleteDialog: Boolean = false
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
                showCompleteDialog = true
            ) 
        }
    }

    fun hideDialogs() {
        _uiState.update { 
            it.copy(
                showUpdateDialog = false,
                showCompleteDialog = false,
                selectedWorkOrder = null
            ) 
        }
    }

    fun updateWorkOrderStatus(
        tokenManager: TokenManager,
        workOrderId: String,
        status: String,
        description: String? = null,
        cost: Double? = null,
        imageFiles: List<File>? = null,
        onResult: (Boolean, String?) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val token = tokenManager.getToken().first() as? String
                if (token != null) {
                    val result = repository.updateWorkOrderStatus(
                        token, workOrderId, status, description, cost, imageFiles
                    )
                    result.onSuccess {
                        _uiState.update { it.copy(isLoading = false) }
                        onResult(true, null)
                    }.onFailure { e ->
                        _uiState.update { it.copy(isLoading = false, error = e.message) }
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
        workOrderId: String,
        description: String? = null,
        cost: Double? = null,
        imageFiles: List<File>? = null,
        onResult: (Boolean, String?) -> Unit
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val token = tokenManager.getToken().first() as? String
                if (token != null) {
                    val result = repository.completeWorkOrder(
                        token, workOrderId, description, cost, imageFiles
                    )
                    result.onSuccess {
                        _uiState.update { it.copy(isLoading = false) }
                        onResult(true, null)
                    }.onFailure { e ->
                        _uiState.update { it.copy(isLoading = false, error = e.message) }
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

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
