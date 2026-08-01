import AppKit
import QuickLookThumbnailing
import WebKit

/// Finder thumbnails for `.lottie` files.
///
/// There is no native Lottie renderer available here, so a frame is rendered by
/// the same web player the app and the Quick Look preview use, then snapshotted
/// out of an offscreen `WKWebView`.
@objc(ThumbnailProvider)
final class ThumbnailProvider: QLThumbnailProvider {

    override func provideThumbnail(
        for request: QLFileThumbnailRequest,
        _ handler: @escaping (QLThumbnailReply?, Error?) -> Void
    ) {
        // WebKit is main-thread-only; QuickLookThumbnailing calls us on a worker.
        DispatchQueue.main.async {
            FrameRenderer.render(request: request, completion: handler)
        }
    }
}

/// Renders one frame offscreen and hands back an image.
///
/// Keeps itself alive for the duration of the render — the provider returns
/// immediately, so nothing else holds a reference to the webview.
private final class FrameRenderer: NSObject {

    /// Well past what a healthy render needs; only trips on a wedged webview.
    private static let timeout: TimeInterval = 8

    private static var inFlight = Set<FrameRenderer>()

    private let request: QLFileThumbnailRequest
    private let completion: (QLThumbnailReply?, Error?) -> Void

    private var window: NSWindow?
    private var webView: WKWebView?
    private var timeoutWork: DispatchWorkItem?
    private var finished = false

    enum ThumbnailError: LocalizedError {
        case unreadable
        case resourcesMissing
        case renderFailed

        var errorDescription: String? {
            switch self {
            case .unreadable: return "Không đọc được tệp."
            case .resourcesMissing: return "Thiếu tài nguyên render trong extension."
            case .renderFailed: return "Không render được frame."
            }
        }
    }

    static func render(
        request: QLFileThumbnailRequest,
        completion: @escaping (QLThumbnailReply?, Error?) -> Void
    ) {
        let renderer = FrameRenderer(request: request, completion: completion)
        inFlight.insert(renderer)
        renderer.start()
    }

    private init(request: QLFileThumbnailRequest,
                 completion: @escaping (QLThumbnailReply?, Error?) -> Void) {
        self.request = request
        self.completion = completion
    }

    private func start() {
        let bundle = Bundle(for: FrameRenderer.self)
        guard let page = bundle.url(forResource: "preview", withExtension: "html") else {
            finish(image: nil, error: ThumbnailError.resourcesMissing)
            return
        }

        guard let data = try? Data(contentsOf: request.fileURL) else {
            finish(image: nil, error: ThumbnailError.unreadable)
            return
        }

        let size = request.maximumSize
        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(self, name: "thumbnail")
        configuration.userContentController.addUserScript(WKUserScript(
            source: """
            window.__LOTTIE_MODE__ = "thumbnail";
            window.__LOTTIE_B64__ = "\(data.base64EncodedString())";
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true,
        ))

        let webView = WKWebView(frame: NSRect(origin: .zero, size: size),
                                configuration: configuration)
        // Let the animation's own transparency reach the Finder icon instead of
        // baking a white card behind it.
        webView.setValue(false, forKey: "drawsBackground")
        self.webView = webView

        // takeSnapshot needs a hosted, laid-out view; an offscreen window is the
        // cheapest way to give it one.
        let window = NSWindow(contentRect: NSRect(origin: .zero, size: size),
                              styleMask: [.borderless],
                              backing: .buffered,
                              defer: false)
        window.isReleasedWhenClosed = false
        window.contentView = webView
        window.orderOut(nil)
        self.window = window

        let work = DispatchWorkItem { [weak self] in
            self?.finish(image: nil, error: ThumbnailError.renderFailed)
        }
        timeoutWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + Self.timeout, execute: work)

        webView.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
    }

    private func snapshot() {
        guard let webView else { return }
        let config = WKSnapshotConfiguration()
        config.rect = CGRect(origin: .zero, size: request.maximumSize)

        webView.takeSnapshot(with: config) { [weak self] image, error in
            self?.finish(image: image, error: error)
        }
    }

    /// Delivers the reply exactly once, whichever of render / failure / timeout wins.
    private func finish(image: NSImage?, error: Error?) {
        guard !finished else { return }
        finished = true
        timeoutWork?.cancel()
        timeoutWork = nil

        if let image {
            let size = request.maximumSize
            completion(QLThumbnailReply(contextSize: size) {
                image.draw(in: CGRect(origin: .zero, size: size))
                return true
            }, nil)
        } else {
            completion(nil, error ?? ThumbnailError.renderFailed)
        }

        webView?.configuration.userContentController
            .removeScriptMessageHandler(forName: "thumbnail")
        window?.contentView = nil
        window = nil
        webView = nil
        FrameRenderer.inFlight.remove(self)
    }
}

extension FrameRenderer: WKScriptMessageHandler {
    func userContentController(_ controller: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard message.name == "thumbnail" else { return }
        if (message.body as? String) == "ready" {
            snapshot()
        } else {
            finish(image: nil, error: ThumbnailError.renderFailed)
        }
    }
}
