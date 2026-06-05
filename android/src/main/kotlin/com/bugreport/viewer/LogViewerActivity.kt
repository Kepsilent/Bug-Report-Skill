package com.bugreport.viewer

import android.app.AlertDialog
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bugreport.BugReport
import com.bugreport.LogEntry
import com.bugreport.LogLevel
import com.bugreport.R
import java.util.Locale

/**
 * In-app log viewer — dark terminal theme, matches uni-app log-viewer-common.vue.
 * Auto i18n (zh-CN / en) based on device locale.
 */
class LogViewerActivity : AppCompatActivity() {

    // ---- Toolbar ----
    private lateinit var statusDot: View
    private lateinit var toolbarStatus: TextView
    private lateinit var btnLive: TextView
    private lateinit var btnExport: TextView
    private lateinit var btnFilter: TextView

    // ---- Stats Bar ----
    private lateinit var statE: TextView
    private lateinit var statW: TextView
    private lateinit var statN: TextView
    private lateinit var statP: TextView
    private lateinit var statSession: TextView

    // ---- Search ----
    private lateinit var searchBar: View
    private lateinit var searchInput: EditText
    private lateinit var btnCloseSearch: TextView

    // ---- Tabs ----
    private lateinit var tabBar: LinearLayout
    private data class TabRef(
        val container: ViewGroup,
        val label: TextView,
        val badge: TextView,
        val underline: View
    )
    private val tabRefs = mutableListOf<TabRef>()

    // ---- Log List ----
    private lateinit var listView: RecyclerView
    private lateinit var adapter: LogListAdapter
    private lateinit var emptyText: TextView

    // ---- Status Bar ----
    private lateinit var statusLogsCount: TextView
    private lateinit var statusUptime: TextView
    private lateinit var statusDevice: TextView
    private lateinit var btnCopyText: TextView
    private lateinit var btnCopyJson: TextView
    private lateinit var btnClear: TextView

    // ---- State ----
    private var currentTab = 0
    private var autoRefresh = true
    private var showSearch = false
    private var unwatch: (() -> Unit)? = null
    private var allLogs = listOf<LogEntry>()

    // ---- i18n ----
    private val isZh = Locale.getDefault().language.startsWith("zh")
    private fun t(zh: String, en: String): String = if (isZh) zh else en

    // ============================================================
    //  Lifecycle
    // ============================================================

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_log_viewer)

        // Bind views
        statusDot = findViewById(R.id.status_dot)
        toolbarStatus = findViewById(R.id.tb_status)
        btnLive = findViewById(R.id.btn_live)
        btnExport = findViewById(R.id.btn_export)
        btnFilter = findViewById(R.id.btn_filter)

        statE = findViewById(R.id.stat_e)
        statW = findViewById(R.id.stat_w)
        statN = findViewById(R.id.stat_n)
        statP = findViewById(R.id.stat_p)
        statSession = findViewById(R.id.stat_session)

        searchBar = findViewById(R.id.search_bar)
        searchInput = findViewById(R.id.search_input)
        btnCloseSearch = findViewById(R.id.btn_close_search)

        tabBar = findViewById(R.id.tab_bar)

        listView = findViewById(R.id.log_list)
        emptyText = findViewById(R.id.empty_text)

        statusLogsCount = findViewById(R.id.status_logs_count)
        statusUptime = findViewById(R.id.status_uptime)
        statusDevice = findViewById(R.id.status_device)
        btnCopyText = findViewById(R.id.btn_copy_text)
        btnCopyJson = findViewById(R.id.btn_copy_json)
        btnClear = findViewById(R.id.btn_clear)

        // Setup
        setupStatusDot()
        setupToolbarTexts()
        setupTabs()
        setupList()

        refresh()
        unwatch = BugReport.watch {
            if (autoRefresh) runOnUiThread { refresh() }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        unwatch?.invoke()
    }

    // ============================================================
    //  Setup
    // ============================================================

    private fun setupStatusDot() {
        val dot = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(0xFF3FB950.toInt())
            setSize(16, 16)
        }
        statusDot.background = dot
    }

    private fun setupToolbarTexts() {
        btnLive.text = t("|| 暂停", "|| pause")
        btnExport.text = t("导出", "export")
        btnFilter.text = t("筛选", "filter")
        searchInput.hint = t("搜索：标签、消息、页面、分类...", "filter: tag, message, page, category...")
        btnCloseSearch.text = t("关闭", "close")
        btnCopyText.text = t("复制文本", "copy text")
        btnCopyJson.text = t("复制JSON", "copy json")
        btnClear.text = t("清空", "clear")
    }

    private fun setupTabs() {
        val tabData = listOf(
            t("全部", "all"),
            t("错误", "errors"),
            t("警告", "warnings"),
            t("网络", "network"),
            t("性能", "perf"),
            t("崩溃", "crash")
        )
        tabRefs.clear()
        tabBar.removeAllViews()

        for ((i, label) in tabData.withIndex()) {
            val container = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
            }

            val row = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(28, 14, 28, 14)
            }

            val labelTv = TextView(this).apply {
                text = label
                textSize = 11f
                setTextColor(0xFF8B949E.toInt())
            }

            val badgeTv = TextView(this).apply {
                text = ""
                textSize = 10f
                setTextColor(0xFF8B949E.toInt())
                setPadding(6, 1, 6, 1)
                visibility = View.GONE
            }
            badgeTv.setBackgroundColor(0xFF21262D.toInt())

            row.addView(labelTv)
            row.addView(badgeTv)

            val underline = View(this).apply {
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, 4
                )
                setBackgroundColor(0x00000000)
            }

            container.addView(row)
            container.addView(underline)
            container.setOnClickListener { selectTab(i) }

            tabBar.addView(container)
            tabRefs.add(TabRef(container, labelTv, badgeTv, underline))
        }
    }

    private fun setupList() {
        adapter = LogListAdapter(isZh) { entry ->
            adapter.toggleExpand(entry.id)
        }
        listView.layoutManager = LinearLayoutManager(this)
        listView.adapter = adapter
    }

    // ============================================================
    //  Tab selection
    // ============================================================

    private fun selectTab(index: Int) {
        currentTab = index
        val accentColors = intArrayOf(
            0xFF58A6FF.toInt(), // 0: blue
            0xFFF85149.toInt(), // 1: red
            0xFFD29922.toInt(), // 2: orange
            0xFF58A6FF.toInt(), // 3: blue
            0xFF58A6FF.toInt(), // 4: blue
            0xFF58A6FF.toInt()  // 5: blue
        )

        for ((i, ref) in tabRefs.withIndex()) {
            if (i == index) {
                ref.label.setTextColor(0xFFF0F6FC.toInt())
                ref.underline.setBackgroundColor(accentColors[i])
            } else {
                ref.label.setTextColor(0xFF8B949E.toInt())
                ref.underline.setBackgroundColor(0x00000000)
            }
        }
        refresh()
    }

    // ============================================================
    //  Refresh — populate all UI
    // ============================================================

    private fun refresh() {
        val stats = BugReport.stats()

        // Filter logs by tab
        allLogs = when (currentTab) {
            1 -> BugReport.query(minLevel = LogLevel.ERROR.value)
            2 -> BugReport.query(minLevel = LogLevel.WARN.value).filter { it.level == LogLevel.WARN.value }
            3 -> BugReport.query(cat = "NETWORK")
            4 -> BugReport.query(cat = "PERF")
            5 -> BugReport.query(cat = "CRASH")
            else -> BugReport.query()
        }

        // Apply search filter
        val s = searchInput.text.toString()
        if (s.isNotEmpty()) {
            val lower = s.lowercase()
            allLogs = allLogs.filter {
                it.msg.lowercase().contains(lower) ||
                it.tag.lowercase().contains(lower) ||
                it.cat.lowercase().contains(lower)
            }
        }

        // --- Toolbar status ---
        val errCount = BugReport.errCount()
        val dot = statusDot.background as? GradientDrawable
        if (errCount > 0) {
            dot?.setColor(0xFFF85149.toInt())
            toolbarStatus.text = "$errCount " + t("个问题", "issues")
        } else {
            dot?.setColor(0xFF3FB950.toInt())
            toolbarStatus.text = t("正常", "OK")
        }

        // --- Live toggle ---
        btnLive.text = if (autoRefresh) t("|| 暂停", "|| pause") else t("> 实时", "> live")

        // --- Stats bar ---
        val netCount = (stats.byCat["NETWORK"] ?: 0)
        val perfCount = (stats.byCat["PERF"] ?: 0)
        statE.text = "E:${stats.errors}"
        statW.text = "W:${stats.warnings}"
        statN.text = "N:$netCount"
        statP.text = "P:$perfCount"
        statSession.text = formatDuration(stats.sessionMs)

        // --- Tab badges ---
        val tabCounts = listOf(
            BugReport.count(),
            BugReport.query(minLevel = LogLevel.ERROR.value).size,
            BugReport.query(minLevel = LogLevel.WARN.value).filter { it.level == LogLevel.WARN.value }.size,
            BugReport.query(cat = "NETWORK").size,
            BugReport.query(cat = "PERF").size,
            BugReport.query(cat = "CRASH").size
        )
        for ((i, ref) in tabRefs.withIndex()) {
            val count = tabCounts[i]
            if (count > 0) {
                ref.badge.visibility = View.VISIBLE
                ref.badge.text = "$count"
                // Color the error/warning badges
                when (i) {
                    1 -> ref.badge.setTextColor(0xFFF85149.toInt())
                    2 -> ref.badge.setTextColor(0xFFF85149.toInt())  // actually warning uses orange in vue, keep red for visibility
                    else -> ref.badge.setTextColor(0xFF8B949E.toInt())
                }
            } else {
                ref.badge.visibility = View.GONE
            }
        }

        // --- Log list ---
        adapter.submitList(allLogs)

        // --- Empty state ---
        if (allLogs.isEmpty()) {
            emptyText.visibility = View.VISIBLE
            emptyText.text = when (currentTab) {
                1 -> t("暂无错误。", "No errors.")
                2 -> t("暂无警告。", "No warnings.")
                else -> t("暂无日志。", "No logs.")
            }
        } else {
            emptyText.visibility = View.GONE
        }

        // --- Status bar ---
        statusLogsCount.text = "${allLogs.size} " + t("条日志", "logs")
        statusUptime.text = t("运行时长", "uptime") + " " + formatDuration(stats.sessionMs)
        statusDevice.text = stats.device?.model ?: ""
    }

    // ============================================================
    //  Click handlers
    // ============================================================

    // Stats bar
    fun onStatE(v: View) { selectTab(1) }
    fun onStatW(v: View) { selectTab(2) }
    fun onStatN(v: View) { selectTab(3) }
    fun onStatP(v: View) { selectTab(4) }

    // Filter toggle
    fun onFilter(v: View) {
        showSearch = !showSearch
        searchBar.visibility = if (showSearch) View.VISIBLE else View.GONE
        if (!showSearch) {
            searchInput.text.clear()
            refresh()
        }
    }

    // Close search
    fun onCloseSearch(v: View) {
        searchInput.text.clear()
        showSearch = false
        searchBar.visibility = View.GONE
        refresh()
    }

    // Search action
    fun onSearch(v: View) {
        refresh()
    }

    // Live toggle
    fun onToggleLive(v: View) {
        autoRefresh = !autoRefresh
        btnLive.text = if (autoRefresh) t("|| 暂停", "|| pause") else t("> 实时", "> live")
    }

    // Export — show format dialog
    fun onExport(v: View) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_export, null)

        // Populate i18n text
        dialogView.findViewById<TextView>(R.id.export_title).text = t("导出日志", "Export Logs")
        dialogView.findViewById<TextView>(R.id.export_text_label).text = t("文本格式", "Text format")
        dialogView.findViewById<TextView>(R.id.export_text_desc).text = t("可读文本，适合粘贴分享", "Human-readable, suitable for pasting")
        dialogView.findViewById<TextView>(R.id.export_json_label).text = t("JSON格式", "JSON format")
        dialogView.findViewById<TextView>(R.id.export_json_desc).text = t("结构化数据，适合程序分析", "Structured data for program analysis")
        dialogView.findViewById<TextView>(R.id.export_csv_label).text = t("CSV格式", "CSV format")
        dialogView.findViewById<TextView>(R.id.export_csv_desc).text = t("电子表格兼容格式", "Spreadsheet-compatible table")
        dialogView.findViewById<TextView>(R.id.export_cancel).text = t("取消", "Cancel")

        val dialog = AlertDialog.Builder(this)
            .setView(dialogView)
            .create()

        dialogView.findViewById<View>(R.id.export_opt_text).setOnClickListener {
            copyToClipboard(BugReport.exportLogs("text"))
            showCopiedToast()
            dialog.dismiss()
        }
        dialogView.findViewById<View>(R.id.export_opt_json).setOnClickListener {
            copyToClipboard(BugReport.exportLogs("json"))
            showCopiedToast()
            dialog.dismiss()
        }
        dialogView.findViewById<View>(R.id.export_opt_csv).setOnClickListener {
            copyToClipboard(BugReport.exportLogs("csv"))
            showCopiedToast()
            dialog.dismiss()
        }
        dialogView.findViewById<View>(R.id.export_cancel).setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
        // Make dialog background dark
        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)
    }

    // Copy buttons in status bar
    fun onCopyText(v: View) {
        copyToClipboard(BugReport.exportLogs("text"))
        showCopiedToast()
    }

    fun onCopyJson(v: View) {
        copyToClipboard(BugReport.exportLogs("json"))
        showCopiedToast()
    }

    // Clear
    fun onClear(v: View) {
        AlertDialog.Builder(this)
            .setTitle(t("清空日志", "Clear Logs"))
            .setMessage(t("确定清空所有日志吗？", "Clear all logs?"))
            .setPositiveButton(t("清空", "Clear")) { _, _ ->
                BugReport.clear()
                refresh()
            }
            .setNegativeButton(t("取消", "Cancel"), null)
            .show()
    }

    // ============================================================
    //  Helpers
    // ============================================================

    private fun copyToClipboard(text: String) {
        val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        cm.setPrimaryClip(ClipData.newPlainText(
            t("BugReport 日志", "BugReport Logs"), text
        ))
    }

    private fun showCopiedToast() {
        Toast.makeText(this, t("已复制到剪贴板", "Copied to clipboard"), Toast.LENGTH_SHORT).show()
    }

    private fun formatDuration(ms: Long): String {
        if (ms <= 0) return "0s"
        val h = ms / 3600000
        val m = (ms % 3600000) / 60000
        val s = (ms % 60000) / 1000
        return buildString {
            if (h > 0) append("${h}h ")
            if (m > 0) append("${m}m ")
            append("${s}s")
        }
    }
}
