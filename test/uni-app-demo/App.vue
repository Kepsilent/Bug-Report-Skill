<script>
import BR from './utils/bug-report.js'

export default {
  onLaunch() {
    try {
      BR.init({
        appName: 'BRS v3.0 Test',
        appVersion: '3.0.0',
        captureNetwork: true,
        captureGlobal: true,
        capturePromise: true
      })
      console.log('[BRS] v3.0 initialized OK — device:', JSON.stringify(BR.device()))
    } catch(e) {
      console.warn('[BRS] init failed:', e.message || e)
    }
  }
}
</script>

<style>
page { background-color: #0d1117; }
</style>
