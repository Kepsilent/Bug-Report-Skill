import Foundation

/// Filter engine for log queries — mirrors JS BR.query() and Kotlin QueryEngine.
public class QueryEngine {
    public struct Filter {
        public let minLevel: Int?
        public let cat: String?
        public let page: String?
        public let tag: String?
        public let search: String?
        public let since: Int64?
        public let until: Int64?
        public let limit: Int?

        public init(minLevel: Int? = nil, cat: String? = nil, page: String? = nil,
                    tag: String? = nil, search: String? = nil, since: Int64? = nil,
                    until: Int64? = nil, limit: Int? = nil) {
            self.minLevel = minLevel; self.cat = cat; self.page = page
            self.tag = tag; self.search = search; self.since = since
            self.until = until; self.limit = limit
        }
    }

    public func query(_ logs: [LogEntry], filter: Filter = Filter()) -> [LogEntry] {
        var result = logs

        if let lvl = filter.minLevel { result = result.filter { $0.level >= lvl } }
        if let cat = filter.cat { result = result.filter { $0.cat == cat } }
        if let page = filter.page { result = result.filter { $0.page.contains(page) } }
        if let tag = filter.tag { result = result.filter { $0.tag.contains(tag) } }
        if let search = filter.search {
            let s = search.lowercased()
            result = result.filter {
                $0.msg.lowercased().contains(s) ||
                $0.tag.lowercased().contains(s) ||
                $0.page.lowercased().contains(s) ||
                $0.cat.lowercased().contains(s)
            }
        }
        if let since = filter.since { result = result.filter { $0.ts >= since } }
        if let until = filter.until { result = result.filter { $0.ts <= until } }

        result = result.reversed()
        if let limit = filter.limit { result = Array(result.prefix(limit)) }
        return result
    }
}
