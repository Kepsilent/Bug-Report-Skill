// BugReport — Universal Logging Library for iOS (Swift)
// v3.0 · Zero bloat · Single-line init · MIT
// Usage: BugReport.init(appName: "MyApp")

import Foundation

/// Log levels matching the JS & Kotlin SDKs exactly.
/// VERBOSE=0, DEBUG=1, INFO=2, WARN=3, ERROR=4, FATAL=5
public enum LogLevel: Int, Codable, CaseIterable {
    case verbose = 0
    case debug = 1
    case info = 2
    case warn = 3
    case error = 4
    case fatal = 5

    public var label: String {
        switch self {
        case .verbose: return "VERBOSE"
        case .debug:   return "DEBUG"
        case .info:    return "INFO"
        case .warn:    return "WARN"
        case .error:   return "ERROR"
        case .fatal:   return "FATAL"
        }
    }

    public var emoji: String {
        switch self {
        case .verbose: return "V"
        case .debug:   return "D"
        case .info:    return "I"
        case .warn:    return "W"
        case .error:   return "E"
        case .fatal:   return "F"
        }
    }
}
