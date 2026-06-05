package com.bugreport.demo

import android.app.Application
import com.bugreport.BugReport

class DemoApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // 一行初始化 — 万金油
        BugReport.init(this) {
            appName = "BugReportDemo"
            appVersion = "1.0.0"
            debugMode = true  // 输出到 logcat，AI 可读
        }
    }
}
