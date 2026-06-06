package com.bugreport

import android.os.Build
import android.os.Looper
import java.io.PrintWriter
import java.io.StringWriter

/**
 * Global uncaught exception handler. Records a FATAL log entry,
 * then chains to the original handler to allow the OS to terminate.
 */
class CrashHandler(private val onCrash: (LogEntry) -> Unit) : Thread.UncaughtExceptionHandler {

    private val original: Thread.UncaughtExceptionHandler? = Thread.getDefaultUncaughtExceptionHandler()

    init {
        Thread.setDefaultUncaughtExceptionHandler(this)
    }

    override fun uncaughtException(thread: Thread, throwable: Throwable) {
        val sw = StringWriter()
        throwable.printStackTrace(PrintWriter(sw))
        val trace = sw.toString()

        val entry = LogEntry(
            id = 0,
            ts = System.currentTimeMillis(),
            time = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US).format(java.util.Date()),
            level = LogLevel.FATAL.value,
            levelLabel = LogLevel.FATAL.label,
            cat = LogCategory.CRASH.value,
            tag = "crash",
            msg = throwable.message ?: "App crashed",
            stack = trace,
            page = thread.name,
            extra = mapOf(
                "thread" to thread.name,
                "cause" to (throwable.cause?.message ?: ""),
                "sdk" to Build.VERSION.SDK_INT,
                "isMainThread" to (Looper.myLooper() == Looper.getMainLooper())
            ),
            device = null
        )

        onCrash(entry)

        // Chain to original handler — let the OS do its thing
        // If no original handler, explicitly terminate to avoid stuck zombie process
        if (original != null) {
            original.uncaughtException(thread, throwable)
        } else {
            android.os.Process.killProcess(android.os.Process.myPid())
            System.exit(10)
        }
    }

    fun restore() {
        Thread.setDefaultUncaughtExceptionHandler(original)
    }
}
