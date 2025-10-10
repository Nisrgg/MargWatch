package com.margwatch.ui.components

import android.Manifest
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import coil.compose.rememberAsyncImagePainter
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.rememberMultiplePermissionsState
import com.margwatch.ui.screens.CameraScreen
import java.io.File

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun ImageSelectionDialog(
    isOpen: Boolean,
    onDismiss: () -> Unit,
    onImagesSelected: (List<Uri>) -> Unit,
    maxImages: Int = 5
) {
    val context = LocalContext.current
    var showCamera by remember { mutableStateOf(false) }
    var selectedImages by remember { mutableStateOf<List<Uri>>(emptyList()) }
    
    val cameraPermissionState = rememberMultiplePermissionsState(
        permissions = listOf(Manifest.permission.CAMERA)
    )
    
    // Gallery launcher
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        val newImages = (selectedImages + uris).take(maxImages)
        selectedImages = newImages
    }
    
    // Single image gallery launcher
    val singleGalleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            val newImages = (selectedImages + it).take(maxImages)
            selectedImages = newImages
        }
    }
    
    if (isOpen) {
        AlertDialog(
            onDismissRequest = onDismiss,
            title = { Text("Select Images") },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Selected images preview
                    if (selectedImages.isNotEmpty()) {
                        Text(
                            text = "Selected Images (${selectedImages.size}/$maxImages)",
                            style = MaterialTheme.typography.titleSmall
                        )
                        
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(selectedImages) { uri ->
                                Box {
                                    Image(
                                        painter = rememberAsyncImagePainter(uri),
                                        contentDescription = "Selected Image",
                                        modifier = Modifier
                                            .size(80.dp)
                                            .clip(RoundedCornerShape(8.dp)),
                                        contentScale = ContentScale.Crop
                                    )
                                    
                                    // Remove button
                                    IconButton(
                                        onClick = {
                                            selectedImages = selectedImages.filter { it != uri }
                                        },
                                        modifier = Modifier
                                            .align(Alignment.TopEnd)
                                            .size(24.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Close,
                                            contentDescription = "Remove",
                                            modifier = Modifier.size(16.dp),
                                            tint = MaterialTheme.colorScheme.error
                                        )
                                    }
                                }
                            }
                        }
                    }
                    
                    // Action buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Camera button
                        Button(
                            onClick = {
                                if (cameraPermissionState.allPermissionsGranted) {
                                    showCamera = true
                                } else {
                                    cameraPermissionState.launchMultiplePermissionRequest()
                                }
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Camera", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Camera")
                        }
                        
                        // Gallery button
                        Button(
                            onClick = {
                                if (selectedImages.isEmpty()) {
                                    galleryLauncher.launch("image/*")
                                } else {
                                    singleGalleryLauncher.launch("image/*")
                                }
                            },
                            modifier = Modifier.weight(1f),
                            enabled = selectedImages.size < maxImages
                        ) {
                            Icon(Icons.Default.List, contentDescription = "Gallery", modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Gallery")
                        }
                    }
                    
                    if (selectedImages.size >= maxImages) {
                        Text(
                            text = "Maximum $maxImages images allowed",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        onImagesSelected(selectedImages)
                        onDismiss()
                    },
                    enabled = selectedImages.isNotEmpty()
                ) {
                    Text("Done")
                }
            },
            dismissButton = {
                TextButton(onClick = onDismiss) {
                    Text("Cancel")
                }
            }
        )
    }
    
    // Camera Screen
    if (showCamera) {
        CameraScreen(
            onImageCaptured = { uri ->
                val newImages = (selectedImages + uri).take(maxImages)
                selectedImages = newImages
                showCamera = false
            },
            onClose = {
                showCamera = false
            }
        )
    }
}

@Composable
fun ImagePreviewCard(
    images: List<Uri>,
    onRemoveImage: (Uri) -> Unit,
    modifier: Modifier = Modifier
) {
    if (images.isNotEmpty()) {
        Card(
            modifier = modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(4.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Selected Images (${images.size})",
                    style = MaterialTheme.typography.titleSmall
                )
                Spacer(modifier = Modifier.height(8.dp))
                
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(images) { uri ->
                        Box {
                            Image(
                                painter = rememberAsyncImagePainter(uri),
                                contentDescription = "Selected Image",
                                modifier = Modifier
                                    .size(80.dp)
                                    .clip(RoundedCornerShape(8.dp)),
                                contentScale = ContentScale.Crop
                            )
                            
                            // Remove button
                            IconButton(
                                onClick = { onRemoveImage(uri) },
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .size(24.dp)
                            ) {
                                Icon(
                                    Icons.Default.Close,
                                    contentDescription = "Remove",
                                    modifier = Modifier.size(16.dp),
                                    tint = MaterialTheme.colorScheme.error
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
