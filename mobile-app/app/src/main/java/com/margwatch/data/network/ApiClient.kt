package com.margwatch.data.network

import com.google.gson.GsonBuilder
import com.margwatch.data.model.UserRoleDeserializer
import com.margwatch.data.model.UserRole
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import com.margwatch.config.NetworkConfig
import java.util.concurrent.TimeUnit

object ApiClient {
    // Development URLs
    private const val DEV_BASE_URL_EMULATOR = "http://10.0.2.2:5000/api/"
    private const val DEV_BASE_URL_PHYSICAL = "http://192.168.137.1:5000/api/"
    
    // Production URL (when you deploy)
    private const val PROD_BASE_URL = "https://api.margwatch.com/api/"
    
    // Choose the appropriate URL based on your setup
    private const val BASE_URL = NetworkConfig.BASE_URL
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val gson = GsonBuilder()
        .registerTypeAdapter(UserRole::class.java, UserRoleDeserializer())
        .create()

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    val apiService: MargWatchApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(MargWatchApiService::class.java)
    }
}
