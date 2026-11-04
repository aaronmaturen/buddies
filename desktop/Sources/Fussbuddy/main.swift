import AppKit
import WebKit

// A thin Mac window around the buddy library: the pet and its rules live in web/, and the Swift side only provides
// a see-through window, the cursor and the mouse, the menu bar menu and a file to save the pet in.
// The window is mostly empty, because hearts, notes and confetti fly about three head widths out from the buddy.
// The page draws the buddy at a fixed fraction of the window, so the window's side sets the buddy's size.
let sizes: [(name: String, side: CGFloat)] = [("Small", 300), ("Medium", 420), ("Large", 600)]
let sizeKey = "BuddySize", centerKey = "BuddyCenter"

// Bigger screens get a bigger buddy, until someone picks a size.
func defaultSide() -> CGFloat {
  let height = NSScreen.main?.visibleFrame.height ?? 0
  return height >= 1400 ? 600 : height >= 1000 ? 420 : 300
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler {
  private var window: NSWindow!
  private var view: BuddyView!
  private var menu: StatusMenu!
  private var lastMouse = NSPoint(x: -1, y: -1)
  private var side: CGFloat = {
    let saved = UserDefaults.standard.double(forKey: sizeKey)
    return saved > 0 ? saved : defaultSide()
  }()

  func applicationDidFinishLaunching(_ notification: Notification) {
    makeWindow()
    makeMenu()
    // The page's cursor, and whether the mouse is over the buddy. Empty parts of the window let clicks through.
    Timer.scheduledTimer(withTimeInterval: 1.0 / 30, repeats: true) { [weak self] _ in self?.tick() }
  }

  private func makeWindow() {
    let config = WKWebViewConfiguration()
    config.preferences.inactiveSchedulingPolicy = .none
    config.userContentController.add(self, name: "pet")
    let saved = "window.savedPet = \(PetStore.load() ?? "null");"
    config.userContentController.addUserScript(WKUserScript(source: saved, injectionTime: .atDocumentStart, forMainFrameOnly: true))

    view = BuddyView(frame: NSRect(x: 0, y: 0, width: side, height: side), configuration: config)
    // Not public API, and the one thing here that could fail App Review. underPageBackgroundColor left it white.
    view.setValue(false, forKey: "drawsBackground")
    view.onClick = { [weak self] in self?.run("desktop.boop()") }
    view.onRightClick = { [weak self] event in self?.openCareMenu(for: event) }

    window = NSWindow(contentRect: view.frame, styleMask: .borderless, backing: .buffered, defer: false)
    window.isOpaque = false
    window.backgroundColor = .clear
    window.hasShadow = false
    window.level = .floating
    window.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary]
    window.contentView = view
    // The buddy's spot is saved as the window's center, so it stays put when the size changes.
    if let saved = UserDefaults.standard.string(forKey: centerKey) {
      center(at: NSPointFromString(saved))
    } else if let screen = NSScreen.main {
      // Puts the buddy near the corner, so the empty part of the window hangs off the screen.
      let area = screen.visibleFrame, margin = side * 0.27
      center(at: NSPoint(x: area.maxX - margin, y: area.minY + margin))
    }
    NotificationCenter.default.addObserver(forName: NSWindow.didMoveNotification, object: window, queue: .main) { [weak self] _ in
      guard let frame = self?.window.frame else { return }
      UserDefaults.standard.set(NSStringFromPoint(NSPoint(x: frame.midX, y: frame.midY)), forKey: centerKey)
    }
    window.orderFrontRegardless()

    let web = Bundle.main.resourceURL!.appendingPathComponent("web")
    view.loadFileURL(web.appendingPathComponent("index.html"), allowingReadAccessTo: web)
  }

  private func makeMenu() {
    menu = StatusMenu(side: side)
    menu.onCare = { [weak self] action, guess in
      self?.run("desktop.care('\(action)'\(guess.map { ", '\($0)'" } ?? ""))")
    }
    menu.onNewEgg = { [weak self] in self?.run("desktop.newEgg()") }
    menu.onSize = { [weak self] side in
      guard let self else { return }
      self.side = side
      let frame = self.window.frame
      self.center(at: NSPoint(x: frame.midX, y: frame.midY))
    }
  }

  private func run(_ script: String) { view.evaluateJavaScript(script) }

  // A native context menu at the mouse. An egg has no menu yet; it rocks to show it heard.
  private func openCareMenu(for event: NSEvent) {
    guard let care = menu.contextMenu() else { return run("desktop.nudge()") }
    NSMenu.popUpContextMenu(care, with: event, for: view)
  }

  private func center(at point: NSPoint) {
    window.setFrame(NSRect(x: point.x - side / 2, y: point.y - side / 2, width: side, height: side), display: true)
  }

  func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
    guard let body = message.body as? [String: Any] else { return }
    switch body["type"] as? String {
    case "save": if let pet = body["pet"] as? String { PetStore.save(pet) }
    case "status": menu.update(body)
    default: break
    }
  }

  private func tick() {
    let mouse = NSEvent.mouseLocation
    let moved = mouse != lastMouse
    lastMouse = mouse
    let frame = window.frame
    let x = mouse.x - frame.minX, y = frame.maxY - mouse.y
    view.evaluateJavaScript("desktop.tick(\(x), \(y), \(moved))") { [weak self] result, _ in
      guard let over = result as? Bool else { return }
      self?.window.ignoresMouseEvents = !over
    }
  }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory)
app.run()
