package com.bugreport

import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

/**
 * OkHttp Interceptor that automatically logs all HTTP requests.
 * Mirrors the JS SDK's fetch/XHR monkey-patch behavior.
 *
 * Level logic (matches JS):
 * - 5xx -> ERROR
 * - 4xx -> WARN
 * - duration > 10s -> ERROR
 * - duration > 3s -> WARN
 * - otherwise -> INFO
 */
class NetworkInterceptor(
    private val onRequest: (String, String, Int, Long, Long) -> Unit,
    private val onError: (String, String) -> Unit
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val method = request.method
        val url = request.url.toString()
        val start = System.currentTimeMillis()

        return try {
            val response = chain.proceed(request)
            val duration = System.currentTimeMillis() - start
            val size = response.body?.contentLength() ?: 0L
            onRequest(method, url, response.code, duration, size)
            response
        } catch (e: IOException) {
            val duration = System.currentTimeMillis() - start
            onError(url, e.message ?: "Network error")
            throw e
        }
    }
}
