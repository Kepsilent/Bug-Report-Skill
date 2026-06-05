import Foundation

/// Performance tracing — mirrors JS BR.perf.start/end and Kotlin PerfTracker.
public class PerfTracker {
    private var traces = [String: Int64]()
    private let defaultThreshold: Int64 = 3000
    private let onLog: (Int, String, String, String, [String: Any]?) -> Void

    public init(onLog: @escaping (Int, String, String, String, [String: Any]?) -> Void) {
        self.onLog = onLog
    }

    public func start(_ name: String) {
        traces[name] = Int64(Date().timeIntervalSince1970 * 1000)
    }

    @discardableResult
    public func end(_ name: String, thresholdMs: Int64 = 3000) -> Int64 {
        guard let start = traces.removeValue(forKey: name) else { return -1 }
        let duration = Int64(Date().timeIntervalSince1970 * 1000) - start

        let level = duration > thresholdMs ? LogLevel.warn.rawValue : LogLevel.info.rawValue
        let tag = "perf:\(name)"
        let msg = "\(duration)ms" + (duration > thresholdMs ? " (threshold: \(thresholdMs)ms)" : "")
        let extra: [String: Any] = ["duration": duration, "threshold": thresholdMs, "name": name]

        onLog(level, LogCategory.PERF.rawValue, tag, msg, extra)
        return duration
    }

    public func mark(_ name: String, ms: Int64) {
        let level = ms > defaultThreshold ? LogLevel.warn.rawValue : LogLevel.info.rawValue
        onLog(level, LogCategory.PERF.rawValue, "perf:\(name)", "\(ms)ms", ["duration": ms])
    }

    public func clear() {
        traces.removeAll()
    }
}
