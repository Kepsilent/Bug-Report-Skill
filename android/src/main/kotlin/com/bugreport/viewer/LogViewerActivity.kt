package com.bugreport.viewer

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Bundle
import android.text.TextUtils
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bugreport.BugReport
import com.bugreport.LogEntry
import com.bugreport.LogLevel
import com.bugreport.R

/**
 * In-app log viewer — dark terminal theme matching log-viewer.vue.
 * Open via: startActivity(Intent(context, LogViewerActivity::class.java))
 */
class LogViewerActivity : AppCompatActivity() {

    private lateinit var listView: RecyclerView
    private lateinit var adapter: LogListAdapter
    private lateinit var statusBar: TextView
    private lateinit var tabBar: LinearLayout
    private lateinit var searchInput: EditText

    private var currentTab = 0
    private var autoRefresh = true
    private var unwatch: (() -> Unit)? = null
    private var allLogs = listOf<LogEntry>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_log_viewer)

        listView = findViewById(R.id.log_list)
        statusBar = findViewById(R.id.status_bar)
        tabBar = findViewById(R.id.tab_bar)
        searchInput = findViewById(R.id.search_input)

        adapter = LogListAdapter { entry ->
            // Toggle expand
            adapter.toggleExpand(entry.id)
        }
        listView.layoutManager = LinearLayoutManager(this)
        listView.adapter = adapter

        setupTabs()
        refresh()
        unwatch = BugReport.watch {
            if (autoRefresh) runOnUiThread { refresh() }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        unwatch?.invoke()
    }

    private fun setupTabs() {
        val tabs = listOf("all" to 0, "errors" to 1, "warnings" to 2, "network" to 3, "perf" to 4, "crash" to 5)
        for ((label, index) in tabs) {
            val tab = TextView(this).apply {
                text = label
                setPadding(24, 12, 24, 12)
                textSize = 11f
                setOnClickListener { selectTab(index) }
            }
            tabBar.addView(tab)
        }
        selectTab(0)
    }

    private fun selectTab(index: Int) {
        currentTab = index
        for (i in 0 until tabBar.childCount) {
            val child = tabBar.getChildAt(i) as TextView
            if (i == index) {
                child.setTextColor(0xFFF0F6FC.toInt())
            } else {
                child.setTextColor(0xFF8B949E.toInt())
            }
        }
        refresh()
    }

    private fun refresh() {
        val stats = BugReport.stats()
        allLogs = when (currentTab) {
            1 -> BugReport.query(minLevel = LogLevel.ERROR.value)
            2 -> BugReport.query(minLevel = LogLevel.WARN.value).filter { it.level == LogLevel.WARN.value }
            3 -> BugReport.query(cat = "NETWORK")
            4 -> BugReport.query(cat = "PERF")
            5 -> BugReport.query(cat = "CRASH")
            else -> BugReport.query()
        }

        if (searchInput.text.isNotEmpty()) {
            val s = searchInput.text.toString().lowercase()
            allLogs = allLogs.filter {
                it.msg.lowercase().contains(s) ||
                it.tag.lowercase().contains(s) ||
                it.cat.lowercase().contains(s)
            }
        }

        adapter.submitList(allLogs)
        statusBar.text = "${allLogs.size} logs | ${formatDuration(stats.sessionMs)} uptime | ${stats.device?.model ?: ""}"
    }

    fun onSearch(v: View) {
        refresh()
    }

    fun onExportText(v: View) {
        val text = BugReport.exportLogs("text")
        copyToClipboard(text)
        Toast.makeText(this, "Copied to clipboard", Toast.LENGTH_SHORT).show()
    }

    fun onExportJson(v: View) {
        val text = BugReport.exportLogs("json")
        copyToClipboard(text)
        Toast.makeText(this, "Copied to clipboard", Toast.LENGTH_SHORT).show()
    }

    fun onClear(v: View) {
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Clear Logs")
            .setMessage("Clear all logs?")
            .setPositiveButton("Clear") { _, _ ->
                BugReport.clear()
                refresh()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    fun onToggleLive(v: View) {
        autoRefresh = !autoRefresh
        (v as? TextView)?.text = if (autoRefresh) "|| pause" else "> live"
    }

    private fun copyToClipboard(text: String) {
        val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
        cm.setPrimaryClip(ClipData.newPlainText("BugReport Logs", text))
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
