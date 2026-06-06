// BugReport — Universal Logging Library for Android (Kotlin)
// v3.0 · Zero bloat · Single-line init · MIT
// Usage: BugReport.init(app)

package com.bugreport

/**
 * Log levels matching the JS SDK exactly.
 * VERBOSE=0, DEBUG=1, INFO=2, WARN=3, ERROR=4, FATAL=5
 */
enum class LogLevel(val value: Int, val label: String, val emoji: String) {
    VERBOSE(0, "VERBOSE", "V"),
    DEBUG(1, "DEBUG", "D"),
    INFO(2, "INFO", "I"),
    WARN(3, "WARN", "W"),
    ERROR(4, "ERROR", "E"),
    FATAL(5, "FATAL", "F");

    companion object {
        fun from(value: Int) = entries.firstOrNull { it.value == value } ?: DEBUG
    }
}
