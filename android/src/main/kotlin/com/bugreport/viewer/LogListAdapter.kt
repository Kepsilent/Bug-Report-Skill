package com.bugreport.viewer

import android.graphics.Typeface
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.RecyclerView
import com.bugreport.LogEntry
import com.bugreport.LogLevel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * RecyclerView adapter for log entries — dark terminal theme.
 */
class LogListAdapter(private val onClick: (LogEntry) -> Unit) : RecyclerView.Adapter<LogListAdapter.ViewHolder>() {

    private var logs = listOf<LogEntry>()
    private val expandedIds = mutableSetOf<Long>()
    private val timeFormat = SimpleDateFormat("HH:mm:ss.SSS", Locale.US)

    fun submitList(newLogs: List<LogEntry>) {
        val diff = DiffUtil.calculateDiff(LogDiffCallback(logs, newLogs))
        logs = newLogs
        diff.dispatchUpdatesTo(this)
    }

    fun toggleExpand(id: Long) {
        if (expandedIds.contains(id)) expandedIds.remove(id) else expandedIds.add(id)
        notifyItemChanged(logs.indexOfFirst { it.id == id })
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_log_entry, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val log = logs[position]
        val expanded = expandedIds.contains(log.id)

        // Row
        holder.idText.text = "#${log.id}"
        holder.levelBadge.text = log.levelLabel?.take(1) ?: LogLevel.from(log.level).emoji
        holder.levelBadge.setBackgroundColor(levelBgColor(log.level))
        holder.timeText.text = formatTime(log.ts)
        holder.catText.text = log.cat
        holder.msgText.text = log.msg.ifEmpty { log.tag }
        holder.msgText.maxLines = if (expanded) Int.MAX_VALUE else 1
        holder.chevron.text = if (expanded) "▲" else "▼"

        // Detail
        if (expanded) {
            holder.detailView.visibility = View.VISIBLE
            holder.metaText.text = buildString {
                appendLine("ID: ${log.id}")
                appendLine("Level: ${log.levelLabel}")
                appendLine("Category: ${log.cat}")
                appendLine("Tag: ${log.tag}")
                appendLine("Page: ${log.page}")
                appendLine("Time: ${log.time}")
            }
            holder.stackText.visibility = if (!log.stack.isNullOrEmpty()) View.VISIBLE else View.GONE
            holder.stackText.text = log.stack
        } else {
            holder.detailView.visibility = View.GONE
        }

        // Error highlight
        val isError = log.level >= LogLevel.ERROR.value
        holder.itemView.setBackgroundColor(if (isError) 0x0AF85149.toInt() else 0x00000000)
        if (isError) {
            holder.itemView.setPadding(12, 0, 0, 0)
        } else {
            holder.itemView.setPadding(0, 0, 0, 0)
        }

        holder.itemView.setOnClickListener { onClick(log) }
    }

    override fun getItemCount() = logs.size

    private fun formatTime(ts: Long): String {
        return try { timeFormat.format(Date(ts)) } catch (e: Exception) { "" }
    }

    private fun levelBgColor(level: Int): Int = when (level) {
        LogLevel.VERBOSE.value, LogLevel.DEBUG.value -> 0xFF21262D.toInt()
        LogLevel.INFO.value -> 0xFF1F6FEB.toInt()
        LogLevel.WARN.value -> 0xFF9E6A03.toInt()
        else -> 0xFFDA3633.toInt()
    }

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val idText: TextView = view.findViewById(R.id.log_id)
        val levelBadge: TextView = view.findViewById(R.id.log_level)
        val timeText: TextView = view.findViewById(R.id.log_time)
        val catText: TextView = view.findViewById(R.id.log_cat)
        val msgText: TextView = view.findViewById(R.id.log_msg)
        val chevron: TextView = view.findViewById(R.id.log_chevron)
        val detailView: View = view.findViewById(R.id.log_detail)
        val metaText: TextView = view.findViewById(R.id.log_meta)
        val stackText: TextView = view.findViewById(R.id.log_stack)
    }

    class LogDiffCallback(
        private val oldList: List<LogEntry>,
        private val newList: List<LogEntry>
    ) : DiffUtil.Callback() {
        override fun getOldListSize() = oldList.size
        override fun getNewListSize() = newList.size
        override fun areItemsTheSame(oldPos: Int, newPos: Int) = oldList[oldPos].id == newList[newPos].id
        override fun areContentsTheSame(oldPos: Int, newPos: Int) = oldList[oldPos] == newList[newPos]
    }
}
