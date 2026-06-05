import Foundation
import UIKit

/// Global uncaught exception + signal handler.
/// Records a FATAL log entry before the app terminates.
public class CrashHandler {
    private let onCrash: (String, String) -> Void
    private static var shared: CrashHandler?

    public init(onCrash: @escaping (String, String) -> Void) {
        self.onCrash = onCrash
        CrashHandler.shared = self

        // NSException handler
        NSSetUncaughtExceptionHandler { exception in
            let msg = exception.reason ?? "Unknown crash"
            let stack = exception.callStackSymbols.joined(separator: "\n")
            CrashHandler.shared?.onCrash(msg, stack)
        }

        // Signal handlers for hard crashes (SIGABRT, SIGSEGV, etc.)
        signal(SIGABRT) { _ in CrashHandler.shared?.onCrash("SIGABRT", Thread.callStackSymbols.joined(separator: "\n")) }
        signal(SIGSEGV) { _ in CrashHandler.shared?.onCrash("SIGSEGV", Thread.callStackSymbols.joined(separator: "\n")) }
        signal(SIGBUS)  { _ in CrashHandler.shared?.onCrash("SIGBUS", Thread.callStackSymbols.joined(separator: "\n")) }
        signal(SIGFPE)  { _ in CrashHandler.shared?.onCrash("SIGFPE", Thread.callStackSymbols.joined(separator: "\n")) }
        signal(SIGILL)  { _ in CrashHandler.shared?.onCrash("SIGILL", Thread.callStackSymbols.joined(separator: "\n")) }
    }
}
