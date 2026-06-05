package com.bugreport

/**
 * Performance tracing — mirrors JS BR.perf.start/end exactly.
 */
class PerfTracker(private val onLog: (Int, String, String, String, Map<String, Any?>?) -> Unit) {

    private val traces = mutableMapOf<String, Long>()
    private val DEFAULT_THRESHOLD = 3000L

    fun start(name: String) {
        traces[name] = System.currentTimeMillis()
    }

    fun end(name: String, thresholdMs: Long = DEFAULT_THRESHOLD): Long {
        val start = traces.remove(name) ?: return -1
        val duration = System.currentTimeMillis() - start

        val level = if (duration > thresholdMs) LogLevel.WARN.value else LogLevel.INFO.value
        val tag = "perf:$name"
        val msg = "${duration}ms" + if (duration > thresholdMs) " (threshold: ${thresholdMs}ms)" else ""

        val extra = mapOf<String, Any?>(
            "duration" to duration,
            "threshold" to thresholdMs,
            "name" to name
        )
        onLog(level, LogCategory.PERF.value, tag, msg, extra)
        return duration
    }

    fun mark(name: String, ms: Long) {
        val level = if (ms > DEFAULT_THRESHOLD) LogLevel.WARN.value else LogLevel.INFO.value
        onLog(level, LogCategory.PERF.value, "perf:$name", "${ms}ms", mapOf("duration" to ms))
    }

    fun clear() {
        traces.clear()
    }
}
