<script>
import BR from './utils/bug-report.js'

export default {
  onLaunch() {
    try {
      BR.init({ appName: 'BugReportTest', appVersion: '1.0.0' })
      console.log('[BugReport] initialized OK')
    } catch(e) {
      console.warn('[BugReport] init failed:', e.message || e)
    }
  }
}
</script>

<style>
/* Global styles */
page { background-color: #0d1117; }
</style>
