import UIKit

/// In-app log viewer — dark terminal theme matching log-viewer.vue.
///
/// Usage:
///   let vc = LogViewerController()
///   navigationController?.pushViewController(vc, animated: true)
public class LogViewerController: UITableViewController {
    private enum Tab: Int, CaseIterable {
        case all, errors, warnings, network, perf, crash
        var label: String {
            switch self {
            case .all: return "all"; case .errors: return "errors"
            case .warnings: return "warnings"; case .network: return "network"
            case .perf: return "perf"; case .crash: return "crash"
            }
        }
    }

    private var currentTab: Tab = .all
    private var filteredLogs = [LogEntry]()
    private var allLogs = [LogEntry]()
    private var expandedIds = Set<Int>()
    private var autoRefresh = true
    private var unwatch: (() -> Void)?

    // Theme colors
    private let bg0 = UIColor(red: 0x0D/255, green: 0x11/255, blue: 0x17/255, alpha: 1)
    private let bg1 = UIColor(red: 0x16/255, green: 0x1B/255, blue: 0x22/255, alpha: 1)
    private let fg0 = UIColor(red: 0xC9/255, green: 0xD1/255, blue: 0xD9/255, alpha: 1)
    private let fg1 = UIColor(red: 0x8B/255, green: 0x94/255, blue: 0x9E/255, alpha: 1)
    private let fg2 = UIColor(red: 0x6E/255, green: 0x76/255, blue: 0x81/255, alpha: 1)
    private let blue = UIColor(red: 0x58/255, green: 0xA6/255, blue: 0xFF/255, alpha: 1)
    private let red = UIColor(red: 0xF8/255, green: 0x51/255, blue: 0x49/255, alpha: 1)
    private let orange = UIColor(red: 0xD2/255, green: 0x99/255, blue: 0x22/255, alpha: 1)
    private let green = UIColor(red: 0x3F/255, green: 0xB9/255, blue: 0x50/255, alpha: 1)

    public override func viewDidLoad() {
        super.viewDidLoad()
        title = "BugReport"
        view.backgroundColor = bg0
        tableView.backgroundColor = bg0
        tableView.separatorColor = UIColor(white: 0.1, alpha: 1)
        tableView.register(LogCell.self, forCellReuseIdentifier: "LogCell")
        tableView.rowHeight = UITableView.automaticDimension
        tableView.estimatedRowHeight = 44

        // Toolbar items
        let liveBtn = UIBarButtonItem(title: "|| pause", style: .plain, target: self, action: #selector(toggleLive))
        let exportBtn = UIBarButtonItem(title: "export", style: .plain, target: self, action: #selector(doExport))
        liveBtn.tintColor = fg0
        exportBtn.tintColor = fg0
        navigationItem.rightBarButtonItems = [exportBtn, liveBtn]

        // Segmented control
        let tabs = UISegmentedControl(items: Tab.allCases.map { $0.label })
        tabs.selectedSegmentIndex = 0
        tabs.addTarget(self, action: #selector(tabChanged(_:)), for: .valueChanged)
        tabs.backgroundColor = bg1
        navigationItem.titleView = tabs

        refresh()
        unwatch = BugReport.watch { [weak self] _ in
            DispatchQueue.main.async {
                if self?.autoRefresh == true { self?.refresh() }
            }
        }
    }

    @objc private func tabChanged(_ sender: UISegmentedControl) {
        currentTab = Tab(rawValue: sender.selectedSegmentIndex) ?? .all
        refresh()
    }

    @objc private func toggleLive(_ sender: UIBarButtonItem) {
        autoRefresh = !autoRefresh
        sender.title = autoRefresh ? "|| pause" : "> live"
    }

    @objc private func doExport() {
        let text = BugReport.exportLogs("text")
        UIPasteboard.general.string = text
        let alert = UIAlertController(title: "Exported", message: "Copied to clipboard", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }

    private func refresh() {
        let lvl: Int? = currentTab == .errors ? 4 : currentTab == .warnings ? 3 : nil
        let cat: String? = currentTab == .network ? "NETWORK" : currentTab == .perf ? "PERF" : currentTab == .crash ? "CRASH" : nil
        allLogs = BugReport.query(minLevel: lvl, cat: cat)
        filteredLogs = allLogs
        tableView.reloadData()
    }

    // MARK: - TableView
    public override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        filteredLogs.count
    }

    public override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "LogCell", for: indexPath) as! LogCell
        let log = filteredLogs[indexPath.row]
        let expanded = expandedIds.contains(log.id)
        cell.configure(log: log, expanded: expanded)
        cell.onTap = { [weak self] in
            guard let self = self else { return }
            if expanded { self.expandedIds.remove(log.id) } else { self.expandedIds.insert(log.id) }
            self.tableView.reloadRows(at: [indexPath], with: .automatic)
        }
        return cell
    }

    public override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let log = filteredLogs[indexPath.row]
        if expandedIds.contains(log.id) { expandedIds.remove(log.id) } else { expandedIds.insert(log.id) }
        tableView.reloadRows(at: [indexPath], with: .automatic)
    }
}

/// Custom table cell for log entries — dark terminal theme.
class LogCell: UITableViewCell {
    var onTap: (() -> Void)?

    private let idLabel = UILabel()
    private let levelBadge = UILabel()
    private let timeLabel = UILabel()
    private let catLabel = UILabel()
    private let msgLabel = UILabel()
    private let chevron = UILabel()
    private let detailView = UIView()
    private let metaLabel = UILabel()
    private let stackLabel = UILabel()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        backgroundColor = UIColor(red: 0x0D/255, green: 0x11/255, blue: 0x17/255, alpha: 1)
        selectionStyle = .none
        setupViews()
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) not implemented") }

    private func setupViews() {
        let row = UIStackView(arrangedSubviews: [idLabel, levelBadge, timeLabel, catLabel, msgLabel, chevron])
        row.axis = .horizontal; row.spacing = 6; row.alignment = .center
        contentView.addSubview(row)
        row.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            row.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 6),
            row.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 12),
            row.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -12)
        ])

        detailView.isHidden = true
        let detailStack = UIStackView(arrangedSubviews: [metaLabel, stackLabel])
        detailStack.axis = .vertical; detailStack.spacing = 8
        detailView.addSubview(detailStack)
        detailStack.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            detailStack.topAnchor.constraint(equalTo: detailView.topAnchor, constant: 8),
            detailStack.leadingAnchor.constraint(equalTo: detailView.leadingAnchor, constant: 64),
            detailStack.trailingAnchor.constraint(equalTo: detailView.trailingAnchor, constant: -12),
            detailStack.bottomAnchor.constraint(equalTo: detailView.bottomAnchor, constant: -8)
        ])
        contentView.addSubview(detailView)
        detailView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            detailView.topAnchor.constraint(equalTo: row.bottomAnchor),
            detailView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            detailView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            detailView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
        ])

        [idLabel, levelBadge, timeLabel, catLabel, chevron].forEach { $0.font = .monospacedSystemFont(ofSize: 10, weight: .regular) }
        msgLabel.font = .monospacedSystemFont(ofSize: 12, weight: .regular)
        metaLabel.font = .monospacedSystemFont(ofSize: 10, weight: .regular)
        stackLabel.font = .monospacedSystemFont(ofSize: 10, weight: .regular)
        msgLabel.lineBreakMode = .byTruncatingTail

        idLabel.textColor = UIColor(white: 0.4, alpha: 1)
        timeLabel.textColor = UIColor(white: 0.4, alpha: 1)
        catLabel.textColor = UIColor(red: 0x58/255, green: 0xA6/255, blue: 0xFF/255, alpha: 1)
        msgLabel.textColor = UIColor(white: 0.8, alpha: 1)
        chevron.textColor = UIColor(white: 0.4, alpha: 1)
        metaLabel.textColor = UIColor(white: 0.55, alpha: 1)
        stackLabel.textColor = UIColor(white: 0.55, alpha: 1)

        idLabel.setContentHuggingPriority(.required, for: .horizontal)
        levelBadge.setContentHuggingPriority(.required, for: .horizontal)
        timeLabel.setContentHuggingPriority(.required, for: .horizontal)
        catLabel.setContentHuggingPriority(.required, for: .horizontal)
        chevron.setContentHuggingPriority(.required, for: .horizontal)
        msgLabel.setContentHuggingPriority(.defaultLow, for: .horizontal)
    }

    func configure(log: LogEntry, expanded: Bool) {
        idLabel.text = "#\(log.id)"
        levelBadge.text = " " + (LogLevel(rawValue: log.level)?.emoji ?? "?") + " "
        levelBadge.textColor = .white
        levelBadge.backgroundColor = badgeColor(log.level)
        levelBadge.layer.cornerRadius = 3; levelBadge.clipsToBounds = true

        let t = log.time
        timeLabel.text = String(t.suffix(12))
        catLabel.text = log.cat
        msgLabel.text = log.msg.isEmpty ? log.tag : log.msg
        msgLabel.numberOfLines = expanded ? 0 : 1
        chevron.text = expanded ? "▲" : "▼"

        // Error highlight
        contentView.backgroundColor = log.level >= 4 ? UIColor(red: 0xF8/255, green: 0x51/255, blue: 0x49/255, alpha: 0.04) :
                                     log.level == 3 ? UIColor(red: 0xD2/255, green: 0x99/255, blue: 0x22/255, alpha: 0.03) :
                                     UIColor(red: 0x0D/255, green: 0x11/255, blue: 0x17/255, alpha: 1)

        detailView.isHidden = !expanded
        if expanded {
            var meta = ""
            meta += "ID: \(log.id)\n"; meta += "Level: \(log.levelLabel)\n"
            meta += "Category: \(log.cat)\n"; meta += "Tag: \(log.tag)\n"
            meta += "Page: \(log.page)\n"; meta += "Time: \(log.time)"
            metaLabel.text = meta
            stackLabel.isHidden = log.stack.isEmpty
            stackLabel.text = log.stack
        }
    }

    private func badgeColor(_ level: Int) -> UIColor {
        switch level {
        case 0, 1: return UIColor(white: 0.15, alpha: 1)
        case 2: return UIColor(red: 0x1F/255, green: 0x6F/255, blue: 0xEB/255, alpha: 1)
        case 3: return UIColor(red: 0x9E/255, green: 0x6A/255, blue: 0x03/255, alpha: 1)
        default: return UIColor(red: 0xDA/255, green: 0x36/255, blue: 0x33/255, alpha: 1)
        }
    }
}
