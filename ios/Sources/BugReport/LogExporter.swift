import Foundation
import UIKit

/// Export logs in text, JSON, or CSV format — mirrors JS BR.exportLogs() and Kotlin LogExporter.
public class LogExporter {
    private let dateFormatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    public func export(_ logs: [LogEntry], stats: BugReportStats?, format: String = "json") -> String {
        switch format.lowercased() {
        case "text": return exportText(logs, stats: stats)
        case "csv":  return exportCsv(logs)
        default:     return exportJson(logs, stats: stats)
        }
    }

    private func exportText(_ logs: [LogEntry], stats: BugReportStats?) -> String {
        var sb = ""
        sb += "BugReport Log Export (iOS)\n"
        sb += String(repeating: "=", count: 60) + "\n"

        if let device = logs.first?.device {
            sb += "Device:  \(device.brand) \(device.model)\n"
            sb += "System:  \(device.system) \(device.osVer)\n"
            sb += "App:     \(device.appName) v\(device.appVer)\n"
        }
        sb += "Export:  \(dateFormatter.string(from: Date()))\n"
        sb += "Logs:    \(logs.count)"
        if let s = stats { sb += " | Errors: \(s.errors) | Warnings: \(s.warnings)" }
        sb += "\n" + String(repeating: "=", count: 60) + "\n\n"

        if logs.isEmpty { sb += "No logs.\n"; return sb }

        for log in logs.reversed() {
            let icon = log.level >= LogLevel.error.rawValue ? "[E]" :
                       log.level >= LogLevel.warn.rawValue ? "[W]" :
                       log.level >= LogLevel.info.rawValue ? "[I]" : "[D]"
            let t = String(log.time.suffix(12))
            sb += "#\(log.id) \(icon) \(t) \(log.cat) \(log.tag)\n"
            sb += "  page: \(log.page)\n"
            if !log.msg.isEmpty { sb += "  \(log.msg)\n" }
            if !log.stack.isEmpty {
                let lines = log.stack.split(separator: "\n").prefix(3)
                for line in lines { sb += "  > \(line)\n" }
            }
            sb += "\n"
        }
        return sb
    }

    private func exportJson(_ logs: [LogEntry], stats: BugReportStats?) -> String {
        var dict: [String: Any] = [
            "exportedAt": dateFormatter.string(from: Date()),
            "logs": logs.map { entry -> [String: Any] in
                [
                    "id": entry.id, "ts": entry.ts, "time": entry.time,
                    "level": entry.level, "levelLabel": entry.levelLabel,
                    "cat": entry.cat, "tag": entry.tag, "msg": entry.msg,
                    "stack": entry.stack, "page": entry.page
                ]
            }
        ]
        if let s = stats {
            dict["stats"] = ["total": s.total, "errors": s.errors, "warnings": s.warnings,
                             "fatals": s.fatals, "sessionMs": s.sessionMs]
        }
        guard let data = try? JSONSerialization.data(withJSONObject: dict, options: [.prettyPrinted]),
              let json = String(data: data, encoding: .utf8) else { return "{}" }
        return json
    }

    private func exportCsv(_ logs: [LogEntry]) -> String {
        var sb = "id,time,level,category,tag,message,page\n"
        for log in logs {
            let msg = log.msg.replacingOccurrences(of: "\"", with: "\"\"")
            sb += "\(log.id),\(log.time),\(log.levelLabel),\(log.cat),\(log.tag),\"\(msg)\",\(log.page)\n"
        }
        return sb
    }
}
