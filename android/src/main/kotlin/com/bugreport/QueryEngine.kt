package com.bugreport

/**
 * Filter engine for log queries — mirrors JS BR.query().
 */
class QueryEngine {

    data class Filter(
        val minLevel: Int? = null,
        val cat: String? = null,
        val page: String? = null,
        val tag: String? = null,
        val search: String? = null,
        val since: Long? = null,
        val until: Long? = null,
        val limit: Int? = null
    )

    fun query(logs: List<LogEntry>, filter: Filter = Filter()): List<LogEntry> {
        var result = logs.toList()

        filter.minLevel?.let { lvl -> result = result.filter { it.level >= lvl } }
        filter.cat?.let { cat -> result = result.filter { it.cat == cat } }
        filter.page?.let { page -> result = result.filter { it.page.contains(page) } }
        filter.tag?.let { tag -> result = result.filter { it.tag.contains(tag) } }
        filter.search?.let { search ->
            val s = search.lowercase()
            result = result.filter {
                it.msg.lowercase().contains(s) ||
                it.tag.lowercase().contains(s) ||
                it.page.lowercase().contains(s) ||
                it.cat.lowercase().contains(s)
            }
        }
        filter.since?.let { since -> result = result.filter { it.ts >= since } }
        filter.until?.let { until -> result = result.filter { it.ts <= until } }

        result = result.reversed()
        filter.limit?.let { limit -> result = result.take(limit) }
        return result
    }
}
