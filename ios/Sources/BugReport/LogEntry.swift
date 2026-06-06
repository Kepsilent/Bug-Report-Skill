import Foundation

/// Unified LogEntry — must match the JS & Kotlin SDKs exactly.
/// This is the cross-platform data contract.
public struct LogEntry: Codable, Identifiable, Equatable {
    public let id: Int
    public let ts: Int64
    public let time: String
    public let level: Int
    public let levelLabel: String
    public let cat: String
    public let tag: String
    public let msg: String
    public let stack: String
    public let page: String
    public let extra: [String: AnyCodable]?
    public let device: DeviceSnapshot?

    public static func == (lhs: LogEntry, rhs: LogEntry) -> Bool {
        lhs.id == rhs.id
    }
}

public struct DeviceSnapshot: Codable {
    public let model: String
    public let brand: String
    public let system: String
    public let osVer: String
    public let appVer: String
    public let appName: String
    public let w: Int
    public let h: Int
    public let dpr: Float
    public let lang: String
}

public struct BugReportStats: Codable {
    public let total: Int
    public let errors: Int
    public let warnings: Int
    public let fatals: Int
    public let sessionMs: Int64
    public let byCat: [String: Int]
    public let byPage: [String: Int]
    public let device: DeviceSnapshot?
}

/// Breadcrumb entry — lightweight FIFO trail.
public struct CrumbEntry: Codable {
    public let t: Int64
    public let time: String
    public let tag: String
    public let msg: String
}

/// Simple type-erased Codable wrapper for extra fields.
public struct AnyCodable: Codable {
    public let value: Any

    public init(_ value: Any) { self.value = value }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let v = try? container.decode(String.self) { value = v }
        else if let v = try? container.decode(Int.self) { value = v }
        else if let v = try? container.decode(Double.self) { value = v }
        else if let v = try? container.decode(Bool.self) { value = v }
        else { value = "unknown" }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let v = value as? String { try container.encode(v) }
        else if let v = value as? Int { try container.encode(v) }
        else if let v = value as? Double { try container.encode(v) }
        else if let v = value as? Bool { try container.encode(v) }
        else { try container.encode(String(describing: value)) }
    }
}
