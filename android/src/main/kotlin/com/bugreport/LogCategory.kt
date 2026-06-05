package com.bugreport

/**
 * Log categories matching the JS SDK exactly.
 */
enum class LogCategory(val value: String) {
    CRASH("CRASH"),
    NETWORK("NETWORK"),
    RENDER("RENDER"),
    LIFECYCLE("LIFECYCLE"),
    PERF("PERF"),
    STORAGE("STORAGE"),
    AUDIO("AUDIO"),
    VIDEO("VIDEO"),
    EVAL("EVAL"),
    APP("APP"),
    USER("USER"),
    SYSTEM("SYSTEM");

    companion object {
        fun from(value: String) = entries.firstOrNull { it.value == value } ?: APP
    }
}
