package com.bugreport

import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Export logs in text, JSON, or CSV format — mirrors JS BR.exportLogs().
 */
class LogExporter {

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)

    fun export(logs: List<LogEntry>, stats: BugReportStats?, format: String = "json"): String {
        return when (format.lowercase()) {
            "text" -> exportText(logs, stats)
            "csv" -> exportCsv(logs)
            else -> exportJson(logs, stats)
        }
    }

    private fun exportText(logs: List<LogEntry>, stats: BugReportStats?): String {
        val sb = StringBuilder()
        sb.appendLine("BugReport Log Export (Android)")
        sb.appendLine("=".repeat(60))

        val device = logs.firstOrNull()?.device
        if (device != null) {
            sb.appendLine("Device:  ${device.brand} ${device.model}")
            sb.appendLine("System:  ${device.system} ${device.osVer}")
            sb.appendLine("App:     ${device.appName} v${device.appVer}")
        }
        sb.appendLine("Export:  ${dateFormat.format(Date())}")
        sb.appendLine("Logs:    ${logs.size}" +
            if (stats != null) " | Errors: ${stats.errors} | Warnings: ${stats.warnings}" else "")
        sb.appendLine("=".repeat(60))
        sb.appendLine()

        if (logs.isEmpty()) {
            sb.appendLine("No logs.")
            return sb.toString()
        }

        for (log in logs.reversed()) {
            val icon = when {
                log.level >= LogLevel.ERROR.value -> "[E]"
                log.level >= LogLevel.WARN.value -> "[W]"
                log.level >= LogLevel.INFO.value -> "[I]"
                else -> "[D]"
            }
            sb.appendLine("#${log.id} $icon ${log.time.substring(11, 23)} ${log.cat} ${log.tag}")
            sb.appendLine("  page: ${log.page}")
            if (log.msg.isNotEmpty()) sb.appendLine("  ${log.msg}")
            if (!log.stack.isNullOrEmpty()) {
                sb.append("  stack: ")
                log.stack.split("\n").take(3).forEach { sb.appendLine("  > $it") }
            }
            if (log.extra != null) {
                sb.appendLine("  data: ${JSONObject(log.extra)}")
            }
            sb.appendLine()
        }
        return sb.toString()
    }

    private fun exportJson(logs: List<LogEntry>, stats: BugReportStats?): String {
        val json = JSONObject()
        json.put("exportedAt", dateFormat.format(Date()))

        val device = logs.firstOrNull()?.device
        if (device != null) {
            json.put("device", JSONObject().apply {
                put("model", device.model)
                put("brand", device.brand)
                put("system", device.system)
                put("osVer", device.osVer)
                put("appVer", device.appVer)
                put("appName", device.appName)
            })
        }

        if (stats != null) {
            json.put("stats", JSONObject().apply {
                put("total", stats.total)
                put("errors", stats.errors)
                put("warnings", stats.warnings)
                put("fatals", stats.fatals)
                put("sessionMs", stats.sessionMs)
            })
        }

        val arr = JSONArray()
        for (log in logs) {
            arr.put(JSONObject().apply {
                put("id", log.id)
                put("ts", log.ts)
                put("time", log.time)
                put("level", log.level)
                put("levelLabel", log.levelLabel)
                put("cat", log.cat)
                put("tag", log.tag)
                put("msg", log.msg)
                put("stack", log.stack ?: "")
                put("page", log.page)
            })
        }
        json.put("logs", arr)
        return json.toString(2)
    }

    private fun exportCsv(logs: List<LogEntry>): String {
        val sb = StringBuilder()
        sb.appendLine("id,time,level,category,tag,message,page")
        for (log in logs) {
            sb.append("${log.id},${log.time},${log.levelLabel},${log.cat},${log.tag},")
            sb.append("\"${log.msg.replace("\"", "\"\"")}\",${log.page}")
            sb.appendLine()
        }
        return sb.toString()
    }
}
