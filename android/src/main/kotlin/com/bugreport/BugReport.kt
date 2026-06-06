package com.bugreport

import android.app.Application
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.CopyOnWriteArrayList

/**
 * BugReport — Universal Logging for Android (Kotlin)
 * Single-line init, zero bloat, full cross-platform compatibility.
 *
 * Usage:
 *   class MyApp : Application() {
 *       override fun onCreate() {
 *           super.onCreate()
 *           BugReport.init(this)
 *       }
 *   }
 *
 *   BugReport.e("api", "POST /login failed")
 *   BugReport.net.req("POST", "/api/login", 500, 1234, 0)
 *   BugReport.perf.start("loadData")
 *   val ms = BugReport.perf.end("loadData")
 *   BugReport.exportLogs("text")
 */
object BugReport {

    // ---- Constants (mirror JS) ----
    private const val DEFAULT_MAX = 500
    private const val PERSIST_MS = 5000L
    private const val TAG = "BugReport"

    // ---- Config ----
    data class Config(
        var maxLogs: Int = DEFAULT_MAX,
        var minLevel: Int = 0,
        var persist: Boolean = true,
        var captureGlobal: Boolean = true,
        var captureNetwork: Boolean = true,
        var appName: String = "",
        var appVersion: String = "1.0.0",
        var debugMode: Boolean = false
    )

    // ---- State ----
    private var ok = false
    internal val cfg = Config()
    private val logs = CopyOnWriteArrayList<LogEntry>()
    private val pendingLogs = mutableListOf<LogEntry>()  // buffered before init
    private var seq = 0L
    private val watchers = CopyOnWriteArrayList<(LogEntry) -> Unit>()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)

    private var app: Application? = null
    private var storage: StorageAdapter? = null
    private var crashHandler: CrashHandler? = null
    internal var perf = PerfTracker(::onLog)
    private var queryEngine = QueryEngine()
    private var exporter = LogExporter()
    private val handler = Handler(Looper.getMainLooper())
    private var persistRunnable: Runnable? = null

    private var errors = 0
    private var warnings = 0
    private var fatals = 0
    private var sessionStart = System.currentTimeMillis()
    private val byCat = mutableMapOf<String, Int>()
    private val byPage = mutableMapOf<String, Int>()
    private var deviceSnapshot: DeviceSnapshot? = null

    // Breadcrumbs — FIFO capped list
    private val crumbs = mutableListOf<Crumb>()
    private val crumbsMax = 50

    // Latest state snapshot
    private var stateSnapshot: Any? = null

    // ---- Sanitizer ----
    private val sanitizerRules = mutableListOf<Regex>(
        Regex("\\d{11}"),                                            // phone numbers
        Regex("\\d{17,18}"),                                         // ID card numbers
        Regex("[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}") // emails
    )
    private val sensitiveKeys = setOf(
        "password","passwd","pwd","secret","token","authorization","auth",
        "api_key","apikey","accessToken","refreshToken","credential","credentials","privateKey","apiKey"
    )

    internal fun sanitize(value: Any?): Any? {
        if (value == null) return null
        if (value is String) {
            var s = value
            for (r in sanitizerRules) { s = r.replace(s, "***") }
            return s
        }
        if (value is List<*>) { return value.map { sanitize(it) } }
        if (value is Map<*, *>) {
            val out = mutableMapOf<String, Any?>()
            for ((k, v) in value) {
                val key = k.toString()
                out[key] = if (sensitiveKeys.contains(key)) "***" else sanitize(v)
            }
            return out
        }
        return value
    }

    // ---- Sanitizer API ----
    object sanitizer {
        fun addRule(regex: Regex) { sanitizerRules.add(regex) }
        fun rules(): List<Regex> = sanitizerRules.toList()
    }

    // ---- Lifecycle sub-object ----
    object life {
        fun fg() { crumb("life:foreground", ""); info("life:foreground", "") }
        fun bg() { crumb("life:background", ""); info("life:background", "") }
        fun in_(page: String) { crumb("life:page-in", page); d("life:page-in", page) }
        fun out(page: String) { crumb("life:page-out", page); d("life:page-out", page) }
    }

    // ---- Network sub-object ----
    object net {
        fun req(method: String, url: String, status: Int, durMs: Long, sizeBytes: Long = 0): LogEntry {
            return onLog(
                if (status >= 500) LogLevel.ERROR.value
                else if (status >= 400) LogLevel.WARN.value
                else if (durMs > 10000) LogLevel.ERROR.value
                else if (durMs > 3000) LogLevel.WARN.value
                else LogLevel.INFO.value,
                LogCategory.NETWORK.value,
                "net:req",
                "$method ${sanitize(url).toString().takeLast(80)}",
                mapOf("method" to method, "url" to sanitize(url), "status" to status, "duration" to durMs, "size" to sizeBytes)
            )
        }

        fun err(url: String, error: String): LogEntry {
            return onLog(LogLevel.ERROR.value, LogCategory.NETWORK.value, "net:err", sanitize(error) as? String ?: error, mapOf("url" to sanitize(url)))
        }

        fun slow(url: String, ms: Long): LogEntry {
            return onLog(LogLevel.WARN.value, LogCategory.NETWORK.value, "net:slow", "${ms}ms ${sanitize(url).toString().takeLast(80)}", mapOf("url" to sanitize(url), "duration" to ms))
        }

        fun timeout(url: String, ms: Long?): LogEntry {
            return onLog(LogLevel.ERROR.value, LogCategory.NETWORK.value, "net:timeout", "${ms ?: "?"}ms", mapOf("url" to sanitize(url)))
        }
    }

    // ---- Init ----
    fun init(application: Application, config: (Config.() -> Unit)? = null) {
        if (ok) return
        ok = true
        this.app = application

        config?.invoke(cfg)
        cfg.debugMode = cfg.debugMode || (application.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE != 0)

        // Device snapshot
        deviceSnapshot = DeviceSnapshot(
            model = Build.MODEL,
            brand = Build.BRAND,
            system = "android",
            osVer = Build.VERSION.RELEASE,
            appVer = cfg.appVersion,
            appName = cfg.appName,
            w = application.resources.displayMetrics.widthPixels,
            h = application.resources.displayMetrics.heightPixels,
            dpr = application.resources.displayMetrics.density,
            lang = Locale.getDefault().language
        )

        // Storage
        storage = StorageAdapter(application, cfg.maxLogs, PERSIST_MS)
        if (cfg.persist) {
            val restored = storage!!.restore()
            logs.addAll(restored)
            seq = logs.size.toLong()
            val (e, w, f) = storage!!.restoreStats()
            errors = e; warnings = w; fatals = f
        }

        sessionStart = System.currentTimeMillis()

        // Flush any logs that were emitted before init()
        if (pendingLogs.isNotEmpty()) {
            pendingLogs.forEach { entry ->
                onLog(entry.level, entry.cat, entry.tag, entry.msg,
                    if (entry.extra != null) @Suppress("UNCHECKED_CAST")(entry.extra as? Map<String, Any?>) else null)
            }
            pendingLogs.clear()
        }

        // Crash handler
        if (cfg.captureGlobal) {
            crashHandler = CrashHandler { entry ->
                logs.add(entry)
                fatals++
                storage?.persist(logs.toList())
                storage?.saveStats(BugReportStats(logs.size, errors, warnings, fatals, System.currentTimeMillis() - sessionStart, byCat, byPage, deviceSnapshot))
            }
        }

        // Persist timer
        if (cfg.persist) {
            persistRunnable = object : Runnable {
                override fun run() {
                    storage?.persist(logs.toList())
                    storage?.saveStats(BugReportStats(logs.size, errors, warnings, fatals, System.currentTimeMillis() - sessionStart, byCat, byPage, deviceSnapshot))
                    handler.postDelayed(this, PERSIST_MS)
                }
            }
            handler.postDelayed(persistRunnable!!, PERSIST_MS)
        }

        // Launch log
        info("app:launch", "BRS v3.0 initialized (Android)")
    }

    // ---- Logging shortcuts ----
    fun v(tag: String, msg: String, extra: Map<String, Any?>? = null) = onLog(LogLevel.VERBOSE.value, LogCategory.APP.value, tag, msg, extra)
    fun d(tag: String, msg: String, extra: Map<String, Any?>? = null) = onLog(LogLevel.DEBUG.value, LogCategory.APP.value, tag, msg, extra)
    fun info(tag: String, msg: String, extra: Map<String, Any?>? = null) = onLog(LogLevel.INFO.value, LogCategory.APP.value, tag, msg, extra)
    fun w(tag: String, msg: String, extra: Map<String, Any?>? = null) = onLog(LogLevel.WARN.value, LogCategory.APP.value, tag, msg, extra)
    fun e(tag: String, msg: String, extra: Map<String, Any?>? = null) = onLog(LogLevel.ERROR.value, LogCategory.APP.value, tag, msg, extra)
    fun f(tag: String, msg: String, extra: Map<String, Any?>? = null) = onLog(LogLevel.FATAL.value, LogCategory.CRASH.value, tag, msg, extra)
    fun crash(tag: String, msg: String, stack: String?) = onLog(LogLevel.FATAL.value, LogCategory.CRASH.value, tag, msg, null)

    // ---- Query ----
    fun query(
        minLevel: Int? = null, cat: String? = null, page: String? = null,
        tag: String? = null, search: String? = null, since: Long? = null,
        until: Long? = null, limit: Int? = null
    ): List<LogEntry> {
        return queryEngine.query(logs.toList(), QueryEngine.Filter(minLevel, cat, page, tag, search, since, until, limit))
    }

    fun errCount() = logs.count { it.level >= LogLevel.ERROR.value }
    fun wrnCount() = logs.count { it.level == LogLevel.WARN.value }
    fun count() = logs.size

    fun stats(): BugReportStats {
        return BugReportStats(
            total = logs.size,
            errors = errCount(),
            warnings = wrnCount(),
            fatals = fatals,
            sessionMs = System.currentTimeMillis() - sessionStart,
            byCat = byCat.toMap(),
            byPage = byPage.toMap(),
            device = deviceSnapshot
        )
    }

    // ---- Watch ----
    fun watch(cb: (LogEntry) -> Unit): () -> Unit {
        watchers.add(cb)
        return { watchers.remove(cb) }
    }

    // ---- Export ----
    fun exportLogs(format: String = "json", minLevel: Int? = null, cat: String? = null): String {
        val filtered = query(minLevel = minLevel, cat = cat)
        return exporter.export(filtered, stats(), format)
    }

    fun copyLogs(context: Context? = app): Boolean {
        val text = exportLogs("text")
        return try {
            val ctx = context ?: return false
            val cm = ctx.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager ?: return false
            cm.setPrimaryClip(ClipData.newPlainText("BugReport Logs", text))
            true
        } catch (e: Exception) {
            false
        }
    }

    fun clear() {
        logs.clear()
        seq = 0
        errors = 0
        warnings = 0
        fatals = 0
        byCat.clear()
        byPage.clear()
        storage?.clear()
    }

    fun flush() {
        storage?.persist(logs.toList())
    }

    fun destroy() {
        persistRunnable?.let { handler.removeCallbacks(it) }
        persistRunnable = null
        storage?.persist(logs.toList())
        crashHandler?.restore()
        watchers.clear()
        perf.clear()
    }

    fun device(): DeviceSnapshot? = deviceSnapshot

    // ---- Breadcrumbs & Snapshot ----
    fun crumb(tag: String, msg: String) {
        val now = System.currentTimeMillis()
        crumbs.add(Crumb(now, dateFormat.format(Date(now)), tag, msg))
        while (crumbs.size > crumbsMax) crumbs.removeAt(0)
    }
    fun crumbs(): List<Crumb> = crumbs.toList()
    fun clearCrumbs() { crumbs.clear() }
    fun snapshot(data: Any?) { stateSnapshot = data }
    fun getSnapshot(): Any? = stateSnapshot
    fun clearSnapshot() { stateSnapshot = null }

    // ---- Internal ----
    internal fun onLog(level: Int, category: String, tag: String, msg: String, extra: Map<String, Any?>?): LogEntry {
        // Auto-buffer: if not yet initialized, store in pending; flushed on init()
        if (!ok) {
            val dummy = LogEntry(0, System.currentTimeMillis(), "", level, LogLevel.from(level).label, category, tag, msg, null, "", extra, deviceSnapshot)
            pendingLogs.add(dummy)
            return dummy
        }
        if (level < cfg.minLevel) return LogEntry(0, 0, "", 0, "", "", "", "", null, "", null, null)

        // Sanitize sensitive data in memory before logging
        @Suppress("UNCHECKED_CAST")
        val safeExtra = sanitize(extra) as? Map<String, Any?>
        val safeMsg = sanitize(msg) as? String ?: msg

        seq++
        val now = System.currentTimeMillis()
        // On FATAL: auto-attach breadcrumbs + snapshot into extra
        var finalExtra = safeExtra
        if (level == LogLevel.FATAL.value) {
            val merged = mutableMapOf<String, Any?>()
            safeExtra?.forEach { (k, v) -> merged[k] = v }
            if (crumbs.isNotEmpty()) merged["breadcrumbs"] = crumbs.toList()
            if (stateSnapshot != null) merged["snapshot"] = stateSnapshot
            finalExtra = merged
        }
        val entry = LogEntry(
            id = seq,
            ts = now,
            time = dateFormat.format(Date(now)),
            level = level,
            levelLabel = LogLevel.from(level).label,
            cat = category,
            tag = tag,
            msg = safeMsg,
            stack = finalExtra?.get("stack") as? String ?: safeExtra?.get("stack") as? String ?: "",
            page = "",
            extra = finalExtra,
            device = deviceSnapshot
        )

        logs.add(entry)
        while (logs.size > cfg.maxLogs) logs.removeAt(0)

        if (level >= LogLevel.ERROR.value) errors++
        if (level == LogLevel.WARN.value) warnings++
        if (level == LogLevel.FATAL.value) fatals++
        byCat[category] = (byCat[category] ?: 0) + 1

        // Output to Logcat in debug mode (AI-readable via adb logcat -s BugReport)
        if (cfg.debugMode) {
            val logMsg = "#${entry.id} ${entry.levelLabel} ${entry.cat} ${entry.tag} | ${entry.msg}"
            when (level) {
                LogLevel.VERBOSE.value, LogLevel.DEBUG.value -> Log.d(TAG, logMsg)
                LogLevel.INFO.value -> Log.i(TAG, logMsg)
                LogLevel.WARN.value -> Log.w(TAG, logMsg)
                LogLevel.ERROR.value, LogLevel.FATAL.value -> Log.e(TAG, logMsg)
            }
        }

        // Notify watchers
        for (w in watchers) {
            try { w(entry) } catch (_: Exception) {}
        }

        return entry
    }
}
