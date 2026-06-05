// Log categories matching the JS & Kotlin SDKs exactly.

public enum LogCategory: String, Codable, CaseIterable {
    case CRASH
    case NETWORK
    case RENDER
    case LIFECYCLE
    case PERF
    case STORAGE
    case AUDIO
    case VIDEO
    case EVAL
    case APP
    case USER
    case SYSTEM

    public static func from(_ value: String) -> LogCategory {
        return LogCategory(rawValue: value) ?? .APP
    }
}
