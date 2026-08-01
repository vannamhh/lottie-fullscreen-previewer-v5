import AppKit
import QuickLookUI
import WebKit

/// Quick Look preview for `.lottie` files.
///
/// Rendering happens in a `WKWebView` running the same dotLottie player the main
/// app uses, so a preview and the app agree on what an animation looks like. The
/// page and its WASM are bundled inside this extension — nothing is fetched.
@objc(PreviewViewController)
final class PreviewViewController: NSViewController, QLPreviewingController {

    /// Guards against a pathological file stalling the Quick Look panel.
    private static let maxFileBytes = 64 * 1024 * 1024

    /// Quick Look kills a preview that takes too long; surface *something* first.
    /// The panel keeps filling in after this fires, so erring short is cheap.
    private static let readyTimeout: TimeInterval = 2

    private var webView: WKWebView!
    private var completion: ((Error?) -> Void)?
    private var timeoutWork: DispatchWorkItem?

    enum PreviewError: LocalizedError {
        case tooLarge(Int)
        case unreadable
        case resourcesMissing

        var errorDescription: String? {
            switch self {
            case .tooLarge(let bytes):
                return "Tệp quá lớn để xem nhanh (\(bytes / 1024 / 1024) MB)."
            case .unreadable:
                return "Không đọc được nội dung tệp."
            case .resourcesMissing:
                return "Thiếu tài nguyên preview trong extension."
            }
        }
    }

    override func loadView() {
        let configuration = WKWebViewConfiguration()
        // Deliberately *not* suppressing incremental rendering: the page paints its
        // background immediately, which beats a blank panel while the player warms up.
        let webView = WKWebView(frame: NSRect(x: 0, y: 0, width: 640, height: 480),
                                configuration: configuration)
        webView.navigationDelegate = self
        // Quick Look is a viewer, not a browser.
        webView.allowsBackForwardNavigationGestures = false
        webView.allowsMagnification = false

        self.webView = webView
        self.view = webView
    }

    func preparePreviewOfFile(at url: URL, completionHandler handler: @escaping (Error?) -> Void) {
        completion = handler

        let bundle = Bundle(for: type(of: self))
        guard let page = bundle.url(forResource: "preview", withExtension: "html") else {
            finish(with: PreviewError.resourcesMissing)
            return
        }

        let data: Data
        do {
            let size = (try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
            guard size <= Self.maxFileBytes else {
                finish(with: PreviewError.tooLarge(size))
                return
            }
            data = try Data(contentsOf: url)
        } catch {
            finish(with: PreviewError.unreadable)
            return
        }

        // The page reads these before its own script runs, so inject at document start.
        let controller = webView.configuration.userContentController
        controller.removeAllUserScripts()
        controller.addUserScript(WKUserScript(
            source: """
            window.__LOTTIE_B64__ = "\(data.base64EncodedString())";
            window.__LOTTIE_NAME__ = \(jsStringLiteral(url.lastPathComponent));
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true,
        ))

        // Don't let a hung webview leave the panel blank forever.
        let work = DispatchWorkItem { [weak self] in self?.finish(with: nil) }
        timeoutWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.readyTimeout, execute: work)

        webView.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
    }

    /// Calls back exactly once, whichever of load / failure / timeout gets there first.
    private func finish(with error: Error?) {
        timeoutWork?.cancel()
        timeoutWork = nil
        guard let handler = completion else { return }
        completion = nil
        handler(error)
    }
}

extension PreviewViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        finish(with: nil)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        finish(with: error)
    }

    func webView(_ webView: WKWebView,
                 didFailProvisionalNavigation navigation: WKNavigation!,
                 withError error: Error) {
        finish(with: error)
    }

    /// WebKit's helper processes dying is the failure mode that leaves the panel
    /// blank with no navigation error at all, so it needs its own signal.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        NSLog("[lottie-ql] web content process terminated — check extension entitlements")
        finish(with: nil)
    }
}

/// Encodes a Swift string as a JavaScript literal, quotes and all.
private func jsStringLiteral(_ value: String) -> String {
    let data = try? JSONSerialization.data(withJSONObject: [value])
    guard let data, let array = String(data: data, encoding: .utf8) else { return "\"\"" }
    return String(array.dropFirst().dropLast()) // strip the JSON array brackets
}
