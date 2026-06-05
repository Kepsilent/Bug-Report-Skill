pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "BugReportDemo"

// Include the bugreport library from the parent android/ directory
include(":bugreport")
project(":bugreport").projectDir = File("../../android")

include(":app")
