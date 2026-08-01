# Lottie Fullscreen Previewer

**v1.0.0**

Công cụ xem và kiểm tra animation Lottie toàn màn hình. Chạy được ở ba dạng từ cùng một mã
nguồn: web app, app macOS, app Windows.

- Mở tệp `.lottie` (dotLottie) và Lottie JSON
- Điều khiển phát lại đầy đủ, phân tích layer, xuất mã nhúng
- Trên macOS: double-click tệp `.lottie` mở thẳng app, bấm Space trong Finder xem nhanh

---

## Mục lục

- [Chức năng](#chức-năng)
- [Yêu cầu](#yêu-cầu)
- [Chạy dưới dạng web](#chạy-dưới-dạng-web)
- [Build trên macOS](#build-trên-macos)
- [Build trên Windows](#build-trên-windows)
- [Khác biệt giữa hai nền tảng](#khác-biệt-giữa-hai-nền-tảng)
- [Kiến trúc](#kiến-trúc)
- [Xử lý sự cố](#xử-lý-sự-cố)
- [Giới hạn đã biết](#giới-hạn-đã-biết)

---

## Chức năng

### Nguồn tệp

| Cách nạp | Định dạng |
|---|---|
| Double-click trong Finder / Explorer | `.lottie` |
| Menu **Open With** | `.json` (chỉ macOS) |
| Kéo thả vào cửa sổ | `.lottie`, `.json`, `.zip` |
| Hộp chọn tệp | `.lottie`, `.json`, `.zip` |
| Nhập URL | tệp Lottie từ CDN hoặc web |
| Thư viện mẫu | bộ animation dựng sẵn |
| Lịch sử gần đây | tệp đã mở trước đó |

### Xem và điều khiển

- Phát / tạm dừng, tua theo frame, chỉnh tốc độ, chế độ lặp và bounce
- Zoom, pan, chế độ fit (contain / cover / fill)
- Nền tuỳ chọn: bàn cờ sáng, bàn cờ tối, màu tự chọn
- Lưới, đường canh, thước, tâm ngắm
- Bộ lọc CSS: sáng, tương phản, bão hoà, xoay màu, làm mờ...
- Chế độ toàn màn hình, ẩn toàn bộ điều khiển

### Phân tích và xuất

- **Inspector**: cây layer, số frame, thời lượng, kích thước khung, tài nguyên nhúng
- **Chuyển đổi**: `.lottie` ↔ Lottie JSON
- **Tối ưu**: giảm dung lượng tệp
- **Xuất mã**: sinh đoạn nhúng cho web

---

## Yêu cầu

| | macOS | Windows |
|---|---|---|
| Node.js | 18+ | 18+ |
| Rust | ổn định, qua [rustup](https://rustup.rs) | ổn định, qua [rustup](https://rustup.rs) |
| Trình biên dịch C | Xcode Command Line Tools | Visual Studio Build Tools (workload **Desktop development with C++**) |
| WebView | có sẵn (WKWebView) | WebView2 — có sẵn trên Windows 11 và Windows 10 bản mới |

**Không cần Xcode đầy đủ** để build trên macOS. Command Line Tools là đủ, kể cả cho Quick Look
extension:

```bash
xcode-select --install
```

---

## Chạy dưới dạng web

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # xuất tĩnh ra dist/
```

Bản web có mọi chức năng xem và xuất, chỉ thiếu phần tích hợp hệ điều hành (liên kết tệp,
Quick Look).

---

## Build trên macOS

### 1. Dựng app

```bash
npm install
npm run macos:build
```

Kết quả:

```
src-tauri/target/release/bundle/macos/Lottie Previewer.app
src-tauri/target/release/bundle/dmg/Lottie Previewer_1.0.0_x86_64.dmg
```

### 2. Bước hậu xử lý làm gì

`macos:build` chạy `tauri build --bundles app` rồi tới `scripts/postbuild-macos.sh`. Tauri không
diễn đạt được vài thứ đặc thù của macOS, nên script tác động thẳng vào bundle đã dựng:

| Hạng mục | Kết quả |
|---|---|
| `QuickLookExtension.appex` | Bấm Space trong Finder hiện preview animation chạy thật |
| `lottie-document.icns` | Finder hiển thị icon riêng cho tệp `.lottie` |
| ký lại | Mọi thay đổi lên bundle đều làm hỏng chữ ký, nên ký lại trong-ra-ngoài |
| `.dmg` | Dựng **sau** các bước trên, nên đĩa cài chứa đủ extension |

> **Đừng dùng `npm run app:build` trên macOS.** Nó vẫn chạy được, nhưng `.dmg` mà Tauri tạo ra
> được đóng gói *trước* bước hậu xử lý — tức là thiếu Quick Look extension. Đó cũng là lý do
> `macos:build` truyền `--bundles app`: bỏ hẳn bước dmg của Tauri (vốn điều khiển Finder qua
> AppleScript nên hay race và fail), rồi tự dựng đĩa bằng `hdiutil`.

Chỉ chạy lại phần hậu xử lý mà không build lại Rust:

```bash
npm run macos:postbuild
```

### 3. Cài đặt

```bash
cp -R "src-tauri/target/release/bundle/macos/Lottie Previewer.app" /Applications/
pluginkit -a "/Applications/Lottie Previewer.app/Contents/PlugIns/QuickLookExtension.appex"
```

Phải cài vào `/Applications` thì macOS mới đăng ký extension và liên kết tệp ổn định — chạy
thẳng từ thư mục build sẽ hỏng mỗi lần `cargo clean`.

### Liên kết tệp trên macOS

| Đuôi tệp | Vai trò | Hành vi |
|---|---|---|
| `.lottie` | `Editor`, rank `Owner` | Double-click mở thẳng app |
| `.json` | `Viewer`, rank `Alternate` | Chỉ xuất hiện trong menu **Open With** |

Rank `Alternate` là chủ ý: `.json` là kiểu tệp dùng chung, app không được phép giành quyền mở
mặc định khỏi trình soạn thảo của bạn.

`.lottie` dùng UTI `io.dotlottie.lottie` (conform `public.zip-archive`) — đây là định danh macOS
thực sự gán cho tệp `.lottie`. **Đừng tự đặt UTI mới**: nếu khai báo định danh khác,
LaunchServices vẫn phân giải tệp về `io.dotlottie.lottie` và không bao giờ khớp. Kiểm chứng:

```bash
mdls -name kMDItemContentType some-file.lottie
```

### Nếu đã có app khác giữ mặc định

macOS không tự chuyển mặc định khỏi app đang giữ (ví dụ `LottieViewer.app`). App này sẽ nằm
trong menu **Open With**; muốn double-click mở thẳng thì đổi thủ công: chọn tệp → `Cmd+I` →
**Open With** → chọn app → **Change All…**

---

## Build trên Windows

> **Chưa chạy thử trên Windows.** Toàn bộ quá trình phát triển diễn ra trên macOS. Mức độ đã
> kiểm chứng, nói thẳng:
>
> - ✅ Đoạn Rust dành cho Windows (plugin single-instance, `deliver_from_argv`) đã được
>   type-check sạch — bằng cách tạm bật cfg đó trên macOS, vì plugin này chạy được cả ba nền tảng.
> - ✅ Cấu hình tách theo nền tảng đã kiểm chứng: bản macOS có 2 liên kết tệp, bản Windows chỉ có
>   `.lottie`.
> - ❌ Chưa ai chạy `npm run app:build` trên Windows thật, chưa ai chạy thử installer.
>
> Cross-compile từ macOS bị chặn ở bước biên dịch resource của Windows (`tauri-winres` cần
> `llvm-rc`, máy dev không có), nên không thể kiểm chứng xa hơn từ phía macOS.

### 1. Cài công cụ

Cài [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) với workload
**Desktop development with C++**, rồi cài Rust qua [rustup](https://rustup.rs).

Kiểm tra WebView2 đã có chưa (Windows 11 và Windows 10 bản mới có sẵn); nếu chưa, cài
[WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/).

### 2. Dựng app

```powershell
npm install
npm run app:build
```

Kết quả:

```
src-tauri\target\release\Lottie Previewer.exe
src-tauri\target\release\bundle\nsis\Lottie Previewer_1.0.0_x64-setup.exe
src-tauri\target\release\bundle\msi\Lottie Previewer_1.0.0_x64_en-US.msi
```

Muốn chọn loại installer:

```powershell
npm run tauri -- build --bundles nsis     # chỉ NSIS
npm run tauri -- build --bundles msi      # chỉ MSI
```

### 3. Cài đặt

Chạy installer. Liên kết tệp `.lottie` được ghi vào registry **lúc cài**, không phải lúc chạy —
nên chạy thẳng `.exe` sẽ không đăng ký được gì.

### Liên kết tệp trên Windows

Chỉ `.lottie` được đăng ký. `.json` **cố tình không đăng ký** trên Windows: cơ chế registry của
Windows không có khái niệm tương đương `LSHandlerRank = Alternate`, nên đăng ký `.json` sẽ
chiếm luôn mặc định của mọi tệp JSON trong máy — đúng thứ mà cấu hình macOS tránh.

Khác biệt này nằm ở `src-tauri/tauri.macos.conf.json`, được Tauri merge đè lên
`tauri.conf.json` khi build cho macOS.

---

## Khác biệt giữa hai nền tảng

| Chức năng | macOS | Windows |
|---|---|---|
| Toàn bộ giao diện, phát lại, xuất | ✅ | ✅ |
| Double-click `.lottie` | ✅ | ✅ (sau khi cài bằng installer) |
| `.json` trong Open With | ✅ | ❌ cố tình bỏ (xem trên) |
| Mở tệp khi app đang chạy | ✅ qua `RunEvent::Opened` | ✅ qua plugin single-instance |
| Xem nhanh (Quick Look) | ✅ | ❌ cần shell extension riêng, chưa làm |
| Icon tệp riêng | ✅ | ⚠️ chưa kiểm chứng |
| Thumbnail động trong Finder/Explorer | ❌ [xem lý do](#vì-sao-không-có-thumbnail-động) | ❌ |

Lý do khác biệt về cách nhận tệp: macOS gửi sự kiện `openURLs` tới tiến trình đang chạy, còn
Windows khởi động hẳn một tiến trình mới với đường dẫn nằm trong `argv`. Plugin single-instance
chuyển tiếp `argv` đó về instance đang sống rồi thoát.

---

## Kiến trúc

```
src/                     React 19 + Vite — dùng chung cho web và app
src-tauri/               vỏ Rust (Tauri v2)
  src/lib.rs             nhận tệp từ hệ điều hành, đẩy sang webview
  tauri.conf.json        cấu hình chung
  tauri.macos.conf.json  phần đè riêng cho macOS
quicklook/               Quick Look extension (chỉ macOS)
  PreviewViewController.swift
  web/preview.ts         trang render dùng trong extension
scripts/
  postbuild-macos.sh     nhúng extension + icon, ký lại
  gen-document-icon.mjs  sinh icon tài liệu
```

### Đường đi của một tệp

Mọi nguồn tệp đều đổ về đúng một hàm `processFile` trong `src/App.tsx` — kéo thả, hộp chọn tệp,
và mở từ hệ điều hành dùng chung một đường:

1. Hệ điều hành báo có tệp — `RunEvent::Opened` (macOS) hoặc `argv` (Windows/Linux).
2. Rust đọc bytes, mã hoá base64 (bắt buộc — `.lottie` là tệp zip nhị phân).
3. Tuỳ thời điểm mà tệp được **xếp hàng** hay **phát sự kiện**:
   - App khởi động lạnh: tệp tới trước khi React kịp mount → Rust giữ trong hàng đợi.
   - App đang chạy: phát sự kiện `lottie://open-file` thẳng tới webview.
4. `src/utils/tauriBridge.ts` dựng lại đối tượng `File` rồi gọi `processFile`.

Cơ chế hai đường này tránh lỗi đua lúc khởi động lạnh, đồng thời không làm tệp bị nạp hai lần
khi app đang mở sẵn.

### Quick Look extension build ra sao

Không cần Xcode. Một `.appex` chỉ là bundle có binary với entry point `_NSExtensionMain`, mà
`swiftc` dựng được:

```bash
swiftc -parse-as-library \
       -Xlinker -e -Xlinker _NSExtensionMain \
       -Xlinker -application_extension \
       -framework QuickLookUI ...
```

Trang preview chạy ở origin `file://` trong sandbox nên không fetch được gì. Vì vậy WASM của
player được nhúng base64 ngay lúc build (`vite.quicklook.config.ts`), dữ liệu animation do Swift
tiêm vào qua `WKUserScript`, và script phải là classic script — `type="module"` bị chặn ở origin
`file://`.

---

## Xử lý sự cố

### Finder chưa nhận liên kết tệp (macOS)

```bash
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister \
  -f "/Applications/Lottie Previewer.app"
```

### Quick Look không hiện gì (macOS)

Kiểm tra extension đã được hệ thống thấy chưa:

```bash
pluginkit -m -i com.hoangnam.lottie-previewer.quicklook
```

Nếu panel trống trơn, xem log — lưu ý `log` hay bị shell function che nên gọi đường dẫn đầy đủ:

```bash
/usr/bin/log show --last 5m \
  --predicate 'processImagePath CONTAINS "QuickLookExtension"' --style compact
```

**Bẫy đã gặp:** extension bắt buộc chạy sandbox, mà `WKWebView` đẩy việc render sang các tiến
trình phụ (WebContent, GPU, Network). Thiếu `com.apple.security.network.client` thì cả ba đều
không khởi động được và panel trống — dù preview hoàn toàn offline. Triệu chứng:

```
GPUProcessProxy::gpuProcessExited: reason=Crash
WebProcessProxy::didFinishLaunching: Invalid connection identifier
NetworkProcessProxy::didClose (Network Process 0 crash)
```

Cảnh báo `networkd_settings_read_from_file ... Sandbox is preventing` là vô hại.

### Bước đóng gói `.dmg` thất bại

Nếu bạn chạy `npm run app:build` trên macOS, bước dmg của Tauri (`bundle_dmg.sh`) điều khiển
Finder qua AppleScript nên thỉnh thoảng gặp race và fail. Xoá tệp tạm rồi thử lại:

```bash
find src-tauri/target/release/bundle -name "rw.*.dmg" -delete
```

Dùng `npm run macos:build` thì không gặp lỗi này — nó bỏ hẳn bước dmg của Tauri và dựng đĩa
bằng `hdiutil`.

---

## Giới hạn đã biết

### Chưa ký và notarize

Bản build dùng chữ ký ad-hoc, chỉ chạy trên máy đã build. Phân phối cho người khác cần Apple
Developer ID (macOS) hoặc chứng chỉ ký mã (Windows), nếu không người dùng sẽ bị Gatekeeper hoặc
SmartScreen chặn.

### Vì sao không có thumbnail động

Đã thử và **không làm được bằng WKWebView**. Thumbnail extension chạy trong ngữ cảnh không có
UI, còn WebKit tách render sang tiến trình `WebContent` — tiến trình đó abort ngay khi khởi tạo
vì không đăng ký được với WindowServer:

```
abort
HIServices  _RegisterApplication
WebKit::WebProcess::platformInitializeWebProcess
responsible: ThumbnailExtension
```

Quick Look preview chạy được chính vì nó *có* ngữ cảnh UI — là view controller sống trong panel.
Cấp `com.apple.security.temporary-exception.mach-lookup.global-name` cho
`com.apple.windowserver.active` cũng không cứu được.

Mã nguồn (`quicklook/ThumbnailProvider.swift`) được giữ lại cho một renderer không dùng WebKit
sau này, nhưng **không build mặc định** — một thumbnail extension hỏng sẽ làm Finder khựng theo
đúng thời gian timeout ở mỗi tệp `.lottie`. Muốn build thử:

```bash
LOTTIE_BUILD_THUMBNAIL=1 npm run macos:postbuild
```

Thay vào đó Finder dùng icon tài liệu tĩnh — giống nhau cho mọi tệp `.lottie`, nhưng nhận biết
được ngay và không tốn tài nguyên.

### Quick Look chỉ hỗ trợ `.lottie`

Quick Look chọn extension theo UTI, mà Lottie JSON không có UTI riêng — nó chỉ là `public.json`.
Khai báo `public.json` sẽ chiếm quyền preview của *mọi* tệp JSON trong máy, nên cố tình không làm.

### CSP đang tắt

`security.csp` để `null` vì app cần tải Lottie từ CDN và từ URL người dùng nhập. Nếu bỏ tính
năng nhập URL thì nên bật CSP lại.

---

## Tham chiếu nhanh

| Lệnh | Việc |
|---|---|
| `npm run dev` | web dev server |
| `npm run build` | build web tĩnh |
| `npm run app:dev` | app dev, hot-reload cả frontend lẫn Rust |
| `npm run app:build` | đóng gói app cho nền tảng hiện tại |
| `npm run macos:postbuild` | nhúng Quick Look + icon tài liệu, ký lại (chỉ macOS) |
| `npm run tauri -- <args>` | gọi thẳng Tauri CLI |
