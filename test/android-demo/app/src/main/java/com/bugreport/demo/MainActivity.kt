package com.bugreport.demo

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.bugreport.BugReport
import com.bugreport.viewer.LogViewerActivity

class MainActivity : AppCompatActivity() {

    private lateinit var resultsView: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
        }

        val title = TextView(this).apply {
            text = "BugReport v2.1 (Android)"
            textSize = 20f
        }

        resultsView = TextView(this).apply {
            textSize = 13f
            text = "Initializing...\n"
        }

        val btnTest = Button(this).apply {
            text = "Run Tests"
            setOnClickListener { runTests() }
        }

        val btnViewer = Button(this).apply {
            text = "Open Log Viewer"
            setOnClickListener {
                startActivity(Intent(this@MainActivity, LogViewerActivity::class.java))
            }
        }

        layout.addView(title)
        layout.addView(resultsView)
        layout.addView(btnTest)
        layout.addView(btnViewer)
        setContentView(layout)

        runTests()
    }

    private fun log(msg: String) {
        resultsView.text = resultsView.text.toString() + msg + "\n"
    }

    private fun runTests() {
        resultsView.text = ""
        val start = System.currentTimeMillis()

        // Test 1: init
        val dev = BugReport.device()
        log(if (dev?.model != null) "✅ init: ${dev?.brand} ${dev?.model}" else "❌ init failed")

        // Test 2: log levels
        BugReport.e("test", "error log")
        BugReport.w("test", "warn log")
        BugReport.info("test", "info log")
        val count = BugReport.count()
        log(if (count >= 3) "✅ log levels: $count entries" else "❌ log levels: $count")

        // Test 3: network
        BugReport.net.req("GET", "/api/test", 200, 150, 1024)
        val netLogs = BugReport.query(cat = "NETWORK")
        log(if (netLogs.isNotEmpty()) "✅ network: ${netLogs.size} entries" else "❌ network empty")

        // Test 4: stats
        val stats = BugReport.stats()
        log(if (stats.total > 0) "✅ stats: ${stats.total} total, ${stats.errors} errors" else "❌ stats")

        // Test 5: export
        val text = BugReport.exportLogs("text")
        log(if (text.contains("BugReport")) "✅ export: ${text.length} chars" else "❌ export")
    }
}
