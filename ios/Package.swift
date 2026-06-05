// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "BugReport",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "BugReport",
            targets: ["BugReport"]),
    ],
    targets: [
        .target(
            name: "BugReport",
            path: "Sources/BugReport"),
    ]
)
