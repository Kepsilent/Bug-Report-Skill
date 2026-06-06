import Foundation
import UIKit
import os

/// BugReport — Universal Logging for iOS (Swift)
/// Single-line init, zero bloat, full cross-platform compatibility.
///
/// Usage:
///   // AppDelegate.swift or App.init()
///   BugReport.init(appName: "声小言", appVersion: "1.0.0")
///
///   BugReport.e("api", "POST /login failed")
///   BugReport.net.req(method: "POST", url: "/api/login", status: 500, dur: 1234, size: 0)
///   BugReport.perf.start("loadData")
///   let ms = BugReport.perf.end("loadData")
///   BugReport.exportLogs("text")
public class BugReport {
    public static let shared = BugReport()

    // MARK: - Config
    public struct Config {
        public var maxLogs = 500
        public var minLevel = 0
        public var persist = true
        public var captureGlobal = true
        public var captureNetwork = true
        public var appName = ""
        public var appVersion = "1.0.0"
    }

    // MARK: - State
    private var ok = false
    public var cfg = Config()
    private var logs = [LogEntry]()
    private var seq = 0
    private var watchers = [(LogEntry) -> Void]()
    private let lock = NSLock()
    private let dateFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
    private let logger = Logger(subsystem: "com.bugreport", category: "BugReport")

    private var storage: StorageAdapter?
    private var crashHandler: CrashHandler?
    public private(set) var perf = PerfTracker { _,_,_,_,_ in }
    private let queryEngine = QueryEngine()
    private let exporter = LogExporter()
    private var persistTimer: Timer?

    private var errors = 0
    private var warnings = 0
    private var fatals = 0
    private var sessionStart = Int64(Date().timeIntervalSince1970 * 1000)
    private var byCat = [String: Int]()
    private var byPage = [String: Int]()
    private var deviceSnapshot: DeviceSnapshot?

    // MARK: - Net sub-object
    public struct NetSubsystem {
        public func req(method: String, url: String, status: Int, dur: Int64, size: Int64 = 0) {
            let lvl = status >= 500 ? LogLevel.error.rawValue :
                       status >= 400 ? LogLevel.warn.rawValue :
                       dur > 10000 ? LogLevel.error.rawValue :
                       dur > 3000 ? LogLevel.warn.rawValue : LogLevel.info.rawValue
            shared.emit(lvl, cat: .NETWORK, tag: "net:req", msg: "\(method) \(String(url.suffix(80)))",
                        stack: "", extra: ["method": AnyCodable(method), "url": AnyCodable(url),
                                           "status": AnyCodable(status), "duration": AnyCodable(dur), "size": AnyCodable(size)])
        }
        public func err(url: String, error: String) {
            shared.emit(LogLevel.error.rawValue, cat: .NETWORK, tag: "net:err", msg: error,
                        stack: "", extra: ["url": AnyCodable(url)])
        }
        public func slow(url: String, ms: Int64) {
            shared.emit(LogLevel.warn.rawValue, cat: .NETWORK, tag: "net:slow", msg: "\(ms)ms \(String(url.suffix(80)))",
                        stack: "", extra: ["url": AnyCodable(url), "duration": AnyCodable(ms)])
        }
        public func timeout(url: String, ms: Int64?) {
            shared.emit(LogLevel.error.rawValue, cat: .NETWORK, tag: "net:timeout", msg: "\(ms ?? 0)ms",
                        stack: "", extra: ["url": AnyCodable(url)])
        }
    }
    public let net = NetSubsystem()

    // MARK: - Init
    public static func init_(appName: String, appVersion: String = "1.0.0",
                            captureNetwork: Bool = true, captureGlobal: Bool = true,
                            maxLogs: Int = 500) {
        let br = shared
        guard !br.ok else { return }
        br.ok = true
        br.cfg.appName = appName
        br.cfg.appVersion = appVersion
        br.cfg.captureNetwork = captureNetwork
        br.cfg.captureGlobal = captureGlobal
        br.cfg.maxLogs = maxLogs

        // Device snapshot
        let device = UIDevice.current
        br.deviceSnapshot = DeviceSnapshot(
            model: device.model, brand: "Apple", system: device.systemName,
            osVer: device.systemVersion, appVer: appVersion, appName: appName,
            w: Int(UIScreen.main.bounds.width), h: Int(UIScreen.main.bounds.height),
            dpr: Float(UIScreen.main.scale), lang: Locale.current.languageCode ?? ""
        )

        // Storage
        br.storage = StorageAdapter(maxLogs: maxLogs)
        if br.cfg.persist {
            br.logs = br.storage!.restore()
            br.seq = br.logs.count
            let (e, w, f) = br.storage!.restoreStats()
            br.errors = e; br.warnings = w; br.fatals = f
        }
        br.sessionStart = Int64(Date().timeIntervalSince1970 * 1000)

        // Crash handler
        if br.cfg.captureGlobal {
            br.crashHandler = CrashHandler { msg, stack in
                br.lock.lock()
                defer { br.lock.unlock() }
                // Force persist on crash
                br.emit(LogLevel.fatal.rawValue, cat: .CRASH, tag: "crash", msg: msg, stack: stack, extra: nil)
                br.storage?.persist(br.logs)
                br.storage?.saveStats(errors: br.errors, warnings: br.warnings, fatals: br.fatals)
            }
        }

        // Perf tracker wiring
        br.perf = PerfTracker { level, cat, tag, msg, extra in
            br.emit(level, cat: LogCategory.from(cat), tag: tag, msg: msg, stack: "", extra: extra?.mapValues { AnyCodable($0) })
        }

        // Network interceptor
        if br.cfg.captureNetwork {
            BugReportURLProtocol.register()
            BugReportURLProtocol.requestCallback = { method, url, status, dur, size in
                br.net.req(method: method, url: url, status: status, dur: dur, size: size)
            }
            BugReportURLProtocol.errorCallback = { url, error in
                br.net.err(url: url, error: error)
            }
        }

        // Persist timer
        if br.cfg.persist {
            br.persistTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
                br.lock.lock(); defer { br.lock.unlock() }
                br.storage?.persist(br.logs)
                br.storage?.saveStats(errors: br.errors, warnings: br.warnings, fatals: br.fatals)
            }
        }

        br.info("app:launch", "BugReport v2.1 initialized (iOS)")
    }

    // MARK: - Logging shortcuts
    public static func v(_ tag: String, _ msg: String, extra: [String: Any]? = nil) { shared.emit(0, cat: .APP, tag: tag, msg: msg, stack: "", extra: extra?.mapValues { AnyCodable($0) }) }
    public static func d(_ tag: String, _ msg: String, extra: [String: Any]? = nil) { shared.emit(1, cat: .APP, tag: tag, msg: msg, stack: "", extra: extra?.mapValues { AnyCodable($0) }) }
    public static func info(_ tag: String, _ msg: String, extra: [String: Any]? = nil) { shared.emit(2, cat: .APP, tag: tag, msg: msg, stack: "", extra: extra?.mapValues { AnyCodable($0) }) }
    public static func w(_ tag: String, _ msg: String, extra: [String: Any]? = nil) { shared.emit(3, cat: .APP, tag: tag, msg: msg, stack: "", extra: extra?.mapValues { AnyCodable($0) }) }
    public static func e(_ tag: String, _ msg: String, extra: [String: Any]? = nil) { shared.emit(4, cat: .APP, tag: tag, msg: msg, stack: "", extra: extra?.mapValues { AnyCodable($0) }) }
    public static func f(_ tag: String, _ msg: String, extra: [String: Any]? = nil) { shared.emit(5, cat: .CRASH, tag: tag, msg: msg, stack: "", extra: extra?.mapValues { AnyCodable($0) }) }
    public static func crash(_ tag: String, _ msg: String, stack: String) { shared.emit(5, cat: .CRASH, tag: tag, msg: msg, stack: stack, extra: nil) }

    // MARK: - Query
    public static func query(minLevel: Int? = nil, cat: String? = nil, page: String? = nil,
                             tag: String? = nil, search: String? = nil, since: Int64? = nil,
                             until: Int64? = nil, limit: Int? = nil) -> [LogEntry] {
        shared.lock.lock(); defer { shared.lock.unlock() }
        return shared.queryEngine.query(shared.logs, filter: QueryEngine.Filter(
            minLevel: minLevel, cat: cat, page: page, tag: tag, search: search,
            since: since, until: until, limit: limit))
    }

    public static func errCount() -> Int { shared.lock.lock(); defer { shared.lock.unlock() }; return shared.logs.filter { $0.level >= 4 }.count }
    public static func wrnCount() -> Int { shared.lock.lock(); defer { shared.lock.unlock() }; return shared.logs.filter { $0.level == 3 }.count }

    public static func stats() -> BugReportStats {
        shared.lock.lock(); defer { shared.lock.unlock() }
        return BugReportStats(
            total: shared.logs.count,
            errors: shared.logs.filter { $0.level >= 4 }.count,
            warnings: shared.logs.filter { $0.level == 3 }.count,
            fatals: shared.fatals,
            sessionMs: Int64(Date().timeIntervalSince1970 * 1000) - shared.sessionStart,
            byCat: shared.byCat, byPage: shared.byPage, device: shared.deviceSnapshot
        )
    }

    // MARK: - Watch
    public static func watch(_ cb: @escaping (LogEntry) -> Void) -> () -> Void {
        shared.lock.lock(); defer { shared.lock.unlock() }
        shared.watchers.append(cb)
        return { [weak shared] in
            shared?.lock.lock(); defer { shared?.lock.unlock() }
            shared?.watchers.removeAll { $0 as AnyObject === cb as AnyObject }
        }
    }

    // MARK: - Export
    public static func exportLogs(_ format: String = "json", minLevel: Int? = nil) -> String {
        let filtered = query(minLevel: minLevel)
        return shared.exporter.export(filtered, stats: stats(), format: format)
    }

    public static func copyLogs() -> Bool {
        let text = exportLogs("text")
        guard !text.isEmpty else { return false }
        UIPasteboard.general.string = text
        // Verify the write took effect
        return UIPasteboard.general.string == text
    }

    public static func clear() {
        shared.lock.lock(); defer { shared.lock.unlock() }
        shared.logs.removeAll()
        shared.seq = 0
        shared.errors = 0; shared.warnings = 0; shared.fatals = 0
        shared.byCat.removeAll(); shared.byPage.removeAll()
        shared.storage?.clear()
    }

    public static func device() -> DeviceSnapshot? { shared.deviceSnapshot }

    // MARK: - Internal
    private func emit(_ level: Int, cat: LogCategory, tag: String, msg: String,
                      stack: String, extra: [String: AnyCodable]?) {
        lock.lock()
        defer { lock.unlock() }

        guard ok, level >= cfg.minLevel else { return }
        seq += 1
        let now = Int64(Date().timeIntervalSince1970 * 1000)
        let entry = LogEntry(
            id: seq, ts: now, time: dateFormatter.string(from: Date()),
            level: level, levelLabel: LogLevel(rawValue: level)?.label ?? "UNKNOWN",
            cat: cat.rawValue, tag: tag, msg: msg, stack: stack, page: "", extra: extra, device: deviceSnapshot
        )

        logs.append(entry)
        while logs.count > cfg.maxLogs { logs.removeFirst() }

        if level >= LogLevel.error.rawValue { errors += 1 }
        if level == LogLevel.warn.rawValue { warnings += 1 }
        if level == LogLevel.fatal.rawValue { fatals += 1 }
        byCat[cat.rawValue] = (byCat[cat.rawValue] ?? 0) + 1

        // Dev mode: output to os.Logger (AI-readable via Xcode console)
        #if DEBUG
        let logMsg = "#\(seq) \(entry.levelLabel) \(cat.rawValue) \(tag) | \(msg)"
        switch level {
        case 0, 1: logger.debug("\(logMsg)")
        case 2:    logger.info("\(logMsg)")
        case 3:    logger.warning("\(logMsg)")
        case 4, 5: logger.error("\(logMsg)")
        default:   break
        }
        #endif

        // Notify watchers
        for w in watchers { w(entry) }
    }
}
