package com.bugreport

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * SharedPreferences-based ring buffer storage.
 * Persists up to [maxLogs] entries every [persistMs] milliseconds.
 */
class StorageAdapter(context: Context, private val maxLogs: Int = 500, private val persistMs: Long = 5000L) {

    private val prefs: SharedPreferences = context.getSharedPreferences("bugreport", Context.MODE_PRIVATE)
    private val statsPrefs: SharedPreferences = context.getSharedPreferences("bugreport_stats", Context.MODE_PRIVATE)
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)

    private var dirty = false

    fun save(logs: List<LogEntry>) {
        dirty = true
    }

    fun restore(): List<LogEntry> {
        val json = prefs.getString("logs", null) ?: return emptyList()
        return try {
            val arr = JSONArray(json)
            val result = mutableListOf<LogEntry>()
            for (i in 0 until arr.length()) {
                result.add(parseLogEntry(arr.getJSONObject(i)))
            }
            result
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun persist(logs: List<LogEntry>) {
        if (!dirty) return
        val arr = JSONArray()
        val tail = logs.takeLast(maxLogs)
        for (log in tail) {
            arr.put(serializeLogEntry(log))
        }
        prefs.edit().putString("logs", arr.toString()).apply()
        dirty = false
    }

    fun saveStats(stats: BugReportStats) {
        statsPrefs.edit()
            .putInt("errors", stats.errors)
            .putInt("warnings", stats.warnings)
            .putInt("fatals", stats.fatals)
            .apply()
    }

    fun restoreStats(): Triple<Int, Int, Int> {
        val errors = statsPrefs.getInt("errors", 0)
        val warnings = statsPrefs.getInt("warnings", 0)
        val fatals = statsPrefs.getInt("fatals", 0)
        return Triple(errors, warnings, fatals)
    }

    fun clear() {
        prefs.edit().clear().apply()
        statsPrefs.edit().clear().apply()
    }

    private fun serializeLogEntry(log: LogEntry): JSONObject = JSONObject().apply {
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
        if (log.extra != null) put("extra", JSONObject(log.extra))
        if (log.device != null) put("device", JSONObject().apply {
            put("model", log.device.model)
            put("brand", log.device.brand)
            put("system", log.device.system)
            put("osVer", log.device.osVer)
            put("appVer", log.device.appVer)
            put("appName", log.device.appName)
        })
    }

    private fun parseLogEntry(obj: JSONObject): LogEntry {
        val device = if (obj.has("device") && !obj.isNull("device")) {
            val d = obj.getJSONObject("device")
            DeviceSnapshot(
                model = d.optString("model"),
                brand = d.optString("brand"),
                system = d.optString("system"),
                osVer = d.optString("osVer"),
                appVer = d.optString("appVer"),
                appName = d.optString("appName"),
                w = 0, h = 0, dpr = 1f, lang = ""
            )
        } else null

        return LogEntry(
            id = obj.optLong("id"),
            ts = obj.optLong("ts"),
            time = obj.optString("time"),
            level = obj.optInt("level"),
            levelLabel = obj.optString("levelLabel"),
            cat = obj.optString("cat"),
            tag = obj.optString("tag"),
            msg = obj.optString("msg"),
            stack = obj.optString("stack").takeIf { it.isNotEmpty() },
            page = obj.optString("page"),
            extra = null,
            device = device
        )
    }
}
