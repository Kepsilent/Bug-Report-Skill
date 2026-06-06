package com.bugreport

/**
 * Unified LogEntry data contract — must match the JS SDK shape exactly.
 * This is the single source of truth for cross-platform log compatibility.
 */
data class LogEntry(
    val id: Long,
    val ts: Long,
    val time: String,
    val level: Int,
    val levelLabel: String,
    val cat: String,
    val tag: String,
    val msg: String,
    val stack: String?,
    val page: String,
    val extra: Map<String, Any?>?,
    val device: DeviceSnapshot?
)

data class DeviceSnapshot(
    val model: String,
    val brand: String,
    val system: String,
    val osVer: String,
    val appVer: String,
    val appName: String,
    val w: Int,
    val h: Int,
    val dpr: Float,
    val lang: String
)

data class BugReportStats(
    val total: Int,
    val errors: Int,
    val warnings: Int,
    val fatals: Int,
    val sessionMs: Long,
    val byCat: Map<String, Int>,
    val byPage: Map<String, Int>,
    val device: DeviceSnapshot?
)

data class Crumb(
    val t: Long,
    val time: String,
    val tag: String,
    val msg: String
)
