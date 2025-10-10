package com.margwatch.data.local

import android.content.Context
import android.util.Log
import com.margwatch.data.model.OfflineComplaint
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.File
import java.io.ObjectInputStream
import java.io.ObjectOutputStream
import java.util.*

class OfflineComplaintManager(private val context: Context) {
    
    companion object {
        private const val OFFLINE_COMPLAINTS_FILE = "offline_complaints.dat"
        private const val TAG = "OfflineComplaintManager"
    }
    
    private val mutex = Mutex()
    private val _offlineComplaints = MutableStateFlow<List<OfflineComplaint>>(emptyList())
    val offlineComplaints: Flow<List<OfflineComplaint>> = _offlineComplaints.asStateFlow()
    
    private val offlineComplaintsFile = File(context.filesDir, OFFLINE_COMPLAINTS_FILE)
    
    init {
        loadOfflineComplaints()
    }
    
    /**
     * Save a complaint offline
     */
    suspend fun saveOfflineComplaint(complaint: OfflineComplaint): String {
        mutex.withLock {
            val complaints = _offlineComplaints.value.toMutableList()
            val complaintWithId = complaint.copy(id = UUID.randomUUID().toString())
            complaints.add(complaintWithId)
            _offlineComplaints.value = complaints
            saveToFile()
            Log.d(TAG, "Saved offline complaint: ${complaintWithId.id}")
            return complaintWithId.id
        }
    }
    
    /**
     * Get all offline complaints
     */
    fun getAllOfflineComplaints(): List<OfflineComplaint> {
        return _offlineComplaints.value
    }
    
    /**
     * Get pending upload complaints
     */
    fun getPendingUploadComplaints(): List<OfflineComplaint> {
        return _offlineComplaints.value.filter { it.isPendingUpload }
    }
    
    /**
     * Mark complaint as uploaded
     */
    suspend fun markAsUploaded(complaintId: String) {
        mutex.withLock {
            val complaints = _offlineComplaints.value.toMutableList()
            val index = complaints.indexOfFirst { it.id == complaintId }
            if (index != -1) {
                complaints[index] = complaints[index].copy(isUploaded = true)
                _offlineComplaints.value = complaints
                saveToFile()
                Log.d(TAG, "Marked complaint as uploaded: $complaintId")
            }
        }
    }
    
    /**
     * Increment upload attempts
     */
    suspend fun incrementUploadAttempts(complaintId: String) {
        mutex.withLock {
            val complaints = _offlineComplaints.value.toMutableList()
            val index = complaints.indexOfFirst { it.id == complaintId }
            if (index != -1) {
                val complaint = complaints[index]
                complaints[index] = complaint.copy(
                    uploadAttempts = complaint.uploadAttempts + 1,
                    lastUploadAttempt = System.currentTimeMillis()
                )
                _offlineComplaints.value = complaints
                saveToFile()
                Log.d(TAG, "Incremented upload attempts for complaint: $complaintId")
            }
        }
    }
    
    /**
     * Remove complaint from offline storage
     */
    suspend fun removeOfflineComplaint(complaintId: String) {
        mutex.withLock {
            val complaints = _offlineComplaints.value.toMutableList()
            val complaint = complaints.find { it.id == complaintId }
            if (complaint != null) {
                // Delete image files
                complaint.imageFiles.forEach { file ->
                    if (file.exists()) {
                        file.delete()
                    }
                }
                complaints.removeAll { it.id == complaintId }
                _offlineComplaints.value = complaints
                saveToFile()
                Log.d(TAG, "Removed offline complaint: $complaintId")
            }
        }
    }
    
    /**
     * Clear all uploaded complaints
     */
    suspend fun clearUploadedComplaints() {
        mutex.withLock {
            val complaints = _offlineComplaints.value.filter { !it.isUploaded }
            _offlineComplaints.value = complaints
            saveToFile()
            Log.d(TAG, "Cleared uploaded complaints")
        }
    }
    
    /**
     * Load offline complaints from file
     */
    private fun loadOfflineComplaints() {
        try {
            if (offlineComplaintsFile.exists()) {
                ObjectInputStream(offlineComplaintsFile.inputStream()).use { ois ->
                    @Suppress("UNCHECKED_CAST")
                    val complaints = ois.readObject() as List<OfflineComplaint>
                    _offlineComplaints.value = complaints
                    Log.d(TAG, "Loaded ${complaints.size} offline complaints")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error loading offline complaints", e)
            _offlineComplaints.value = emptyList()
        }
    }
    
    /**
     * Save offline complaints to file
     */
    private fun saveToFile() {
        try {
            ObjectOutputStream(offlineComplaintsFile.outputStream()).use { oos ->
                oos.writeObject(_offlineComplaints.value)
                oos.flush()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error saving offline complaints", e)
        }
    }
}


