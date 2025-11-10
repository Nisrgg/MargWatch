package com.margwatch.ui.components

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch

/**
 * Centralized error handling system using Snackbar
 */
object ErrorHandler {
    private val _errorEvents = MutableSharedFlow<ErrorEvent>()
    val errorEvents: SharedFlow<ErrorEvent> = _errorEvents.asSharedFlow()
    
    /**
     * Emit an error event to be displayed as a Snackbar
     */
    fun showError(message: String, action: ErrorAction? = null) {
        _errorEvents.tryEmit(ErrorEvent(message, action))
    }
    
    /**
     * Emit a success message
     */
    fun showSuccess(message: String) {
        _errorEvents.tryEmit(ErrorEvent(message, null, isSuccess = true))
    }
    
    /**
     * Emit an info message
     */
    fun showInfo(message: String) {
        _errorEvents.tryEmit(ErrorEvent(message, null, isInfo = true))
    }
}

/**
 * Error event data class
 */
data class ErrorEvent(
    val message: String,
    val action: ErrorAction? = null,
    val isSuccess: Boolean = false,
    val isInfo: Boolean = false
)

/**
 * Error action data class
 */
data class ErrorAction(
    val label: String,
    val onClick: () -> Unit
)

/**
 * Composable that handles error events and displays them as Snackbars
 */
@Composable
fun ErrorSnackbarHandler(
    snackbarHostState: SnackbarHostState,
    modifier: Modifier = Modifier
) {
    val scope = rememberCoroutineScope()
    
    LaunchedEffect(Unit) {
        ErrorHandler.errorEvents.collect { event ->
            val snackbarResult = snackbarHostState.showSnackbar(
                message = event.message,
                actionLabel = event.action?.label,
                duration = when {
                    event.isSuccess -> SnackbarDuration.Short
                    event.isInfo -> SnackbarDuration.Short
                    event.action != null -> SnackbarDuration.Long
                    else -> SnackbarDuration.Short
                }
            )
            
            // Handle action click
            if (snackbarResult == SnackbarResult.ActionPerformed) {
                event.action?.onClick?.invoke()
            }
        }
    }
}

/**
 * Convenience composable that provides both SnackbarHost and error handling
 */
@Composable
fun MargWatchSnackbarHost(
    snackbarHostState: SnackbarHostState,
    modifier: Modifier = Modifier
) {
    SnackbarHost(
        hostState = snackbarHostState,
        modifier = modifier
    )
    
    ErrorSnackbarHandler(snackbarHostState)
}

/**
 * Extension function to easily show errors from ViewModels
 */
fun showError(message: String, action: ErrorAction? = null) {
    ErrorHandler.showError(message, action)
}

/**
 * Extension function to easily show success messages from ViewModels
 */
fun showSuccess(message: String) {
    ErrorHandler.showSuccess(message)
}

/**
 * Extension function to easily show info messages from ViewModels
 */
fun showInfo(message: String) {
    ErrorHandler.showInfo(message)
}
