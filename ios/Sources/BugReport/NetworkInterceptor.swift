import Foundation

/// URLProtocol subclass that automatically logs all HTTP requests.
/// Mirrors the JS fetch/XHR patch and Kotlin OkHttp interceptor.
/// Registers to URLSessionConfiguration.default.
///
/// Level logic (matches JS & Kotlin):
/// - 5xx → ERROR
/// - 4xx → WARN
/// - duration > 10s → ERROR
/// - duration > 3s → WARN
public class BugReportURLProtocol: URLProtocol {
    private static let handledKey = "BugReportURLProtocolHandled"
    private var dataTask: URLSessionDataTask?
    private var receivedData = Data()
    private var response: URLResponse?
    private var startTime: Int64 = 0

    public var onRequest: ((String, String, Int, Int64, Int64) -> Void)?
    public var onError: ((String, String) -> Void)?

    private static weak var currentInstance: BugReportURLProtocol?
    internal static var requestCallback: ((String, String, Int, Int64, Int64) -> Void)?
    internal static var errorCallback: ((String, String) -> Void)?

    public override class func canInit(with request: URLRequest) -> Bool {
        if URLProtocol.property(forKey: handledKey, in: request) != nil { return false }
        return request.url?.scheme == "http" || request.url?.scheme == "https"
    }

    public override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    public override func startLoading() {
        BugReportURLProtocol.currentInstance = self
        startTime = Int64(Date().timeIntervalSince1970 * 1000)

        let mutableRequest = (request as NSURLRequest).mutableCopy() as! NSMutableURLRequest
        URLProtocol.setProperty(true, forKey: BugReportURLProtocol.handledKey, in: mutableRequest)

        let session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
        dataTask = session.dataTask(with: mutableRequest as URLRequest)
        dataTask?.resume()
    }

    public override func stopLoading() {
        dataTask?.cancel()
    }
}

extension BugReportURLProtocol: URLSessionDataDelegate {
    public func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse, completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        self.response = response
        completionHandler(.allow)
    }

    public func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        receivedData.append(data)
    }

    public func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        let duration = Int64(Date().timeIntervalSince1970 * 1000) - startTime
        let url = request.url?.absoluteString ?? ""
        let method = request.httpMethod ?? "GET"

        if let error = error {
            BugReportURLProtocol.errorCallback?(url, error.localizedDescription)
            client?.urlProtocol(self, didFailWithError: error)
        } else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            let size = Int64(receivedData.count)
            BugReportURLProtocol.requestCallback?(method, url, status, duration, size)

            if let response = response { client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed) }
            client?.urlProtocol(self, didLoad: receivedData)
            client?.urlProtocolDidFinishLoading(self)
        }
    }
}

/// Convenience to register the interceptor.
public extension BugReportURLProtocol {
    static func register() {
        requestCallback = { _,_,_,_,_ in }
        errorCallback = { _,_ in }
        URLProtocol.registerClass(BugReportURLProtocol.self)
    }
}
