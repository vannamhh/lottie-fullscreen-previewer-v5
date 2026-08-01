# Lottie Fullscreen Previewer

Xem và kiểm tra tệp `.lottie` (dotLottie) và Lottie JSON toàn màn hình — đầy đủ trình điều khiển
phát lại, tùy chỉnh nền, chỉnh tốc độ, phân tích layer và xuất định dạng.

Chạy được ở hai dạng: web app (Vite) và app macOS gốc (Tauri v2).

## Yêu cầu

- Node.js 18+
- Rust (chỉ cần khi build app macOS) — cài qua <https://rustup.rs>
- Xcode Command Line Tools (`xcode-select --install`)

## Chạy dưới dạng web

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # xuất ra dist/
```

## Chạy dưới dạng app macOS

```bash
npm run app:dev      # dev, hot-reload cả frontend lẫn Rust
npm run app:build    # đóng gói .app + .dmg
```

Kết quả build nằm ở:

```
src-tauri/target/release/bundle/macos/Lottie Previewer.app
src-tauri/target/release/bundle/dmg/Lottie Previewer_0.1.0_*.dmg
```

Kéo `.app` vào `/Applications` để macOS đăng ký các liên kết tệp.

## Liên kết tệp trên macOS

| Đuôi tệp | Vai trò | Hành vi |
|---|---|---|
| `.lottie` | `Editor`, rank `Owner` | Double-click trong Finder mở thẳng app |
| `.json` | `Viewer`, rank `Alternate` | Chỉ xuất hiện trong menu **Open With**, không chiếm mặc định của `.json` |

Rank `Alternate` là chủ ý: `.json` là kiểu tệp dùng chung, nên app không được phép giành quyền
mở mặc định khỏi trình soạn thảo của bạn.

`.lottie` dùng UTI `io.dotlottie.lottie` (conform `public.zip-archive`) — đây là định danh mà
macOS thực sự gán cho tệp `.lottie`, kiểm chứng được bằng:

```bash
mdls -name kMDItemContentType some-file.lottie
```

Đừng tự đặt UTI mới cho `.lottie`. Nếu khai báo một định danh khác, LaunchServices sẽ phân giải
tệp về `io.dotlottie.lottie` và không bao giờ khớp với khai báo của app.

Nếu Finder chưa nhận liên kết ngay sau khi cài, buộc LaunchServices quét lại:

```bash
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister \
  -f "/Applications/Lottie Previewer.app"
```

### Nếu đã có app khác giữ mặc định

macOS không tự chuyển mặc định khỏi app đang giữ (ví dụ `LottieViewer.app`). App này sẽ nằm
trong menu **Open With**; muốn double-click mở thẳng thì đổi thủ công: chọn tệp → `Cmd+I` →
**Open With** → chọn app → **Change All…**

## Cách tệp đi từ Finder vào giao diện

Chuỗi xử lý được thiết kế để mọi nguồn tệp đều đổ về đúng một hàm `processFile` trong
`src/App.tsx` — kéo thả, hộp chọn tệp, và mở từ Finder dùng chung một đường:

1. macOS gửi `RunEvent::Opened` tới `src-tauri/src/lib.rs`.
2. Rust đọc bytes, mã hoá base64 (bắt buộc — `.lottie` là tệp zip nhị phân).
3. Tuỳ thời điểm mà tệp được **xếp hàng** hay **phát sự kiện**:
   - App khởi động lạnh: tệp tới trước khi React kịp mount → Rust giữ trong hàng đợi.
   - App đang chạy: phát sự kiện `lottie://open-file` thẳng tới webview.
4. `src/utils/tauriBridge.ts` dựng lại đối tượng `File` rồi gọi `processFile`.

Cơ chế hai đường này tránh lỗi đua (race) lúc khởi động lạnh, đồng thời không làm tệp bị nạp
hai lần khi app đang mở sẵn.

## Ghi chú

- Kéo thả tệp vào cửa sổ vẫn dùng sự kiện HTML5 (`dragDropEnabled: false` trong
  `tauri.conf.json`), nên logic kéo thả sẵn có của web app hoạt động y nguyên trong app macOS.
- CSP đang tắt (`security.csp: null`) vì app cần tải Lottie từ CDN và từ URL người dùng nhập.
- Bản build chưa được ký và notarize. Máy khác mở lần đầu sẽ bị Gatekeeper chặn; cần
  Apple Developer ID để phân phối.
- Bước đóng gói `.dmg` thỉnh thoảng fail (script `bundle_dmg.sh` của Tauri chạy AppleScript
  điều khiển Finder nên có race). Khi gặp, xoá tệp tạm rồi build lại:

  ```bash
  find src-tauri/target/release/bundle -name "rw.*.dmg" -delete && npm run app:build
  ```

  Chỉ cần `.app` thì bỏ qua hẳn: `npx tauri build --bundles app`.
- Quick Look (xem nhanh bằng phím Space trong Finder) **chưa có** — cần một app extension
  `.appex` riêng, sẽ làm ở bước sau.
