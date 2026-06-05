import Foundation

/// UserDefaults-based ring buffer storage.
/// Persists up to maxLogs entries every persistMs seconds.
public class StorageAdapter {
    private let maxLogs: Int
    private let persistMs: TimeInterval
    private let defaults = UserDefaults(suiteName: "com.bugreport")!
    private let dateFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    public init(maxLogs: Int = 500, persistMs: TimeInterval = 5.0) {
        self.maxLogs = maxLogs
        self.persistMs = persistMs
    }

    public func restore() -> [LogEntry] {
        guard let data = defaults.data(forKey: "logs"),
              let entries = try? JSONDecoder().decode([LogEntry].self, from: data) else {
            return []
        }
        return entries
    }

    public func persist(_ logs: [LogEntry]) {
        let tail = Array(logs.suffix(maxLogs))
        guard let data = try? JSONEncoder().encode(tail) else { return }
        defaults.set(data, forKey: "logs")
    }

    public func saveStats(errors: Int, warnings: Int, fatals: Int) {
        defaults.set(errors, forKey: "stat_errors")
        defaults.set(warnings, forKey: "stat_warnings")
        defaults.set(fatals, forKey: "stat_fatals")
    }

    public func restoreStats() -> (Int, Int, Int) {
        let e = defaults.integer(forKey: "stat_errors")
        let w = defaults.integer(forKey: "stat_warnings")
        let f = defaults.integer(forKey: "stat_fatals")
        return (e, w, f)
    }

    public func clear() {
        defaults.removePersistentDomain(forName: "com.bugreport")
    }
}
