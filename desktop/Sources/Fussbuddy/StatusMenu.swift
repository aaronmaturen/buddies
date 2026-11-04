import AppKit
import ServiceManagement

// The menu bar icon and its menu: how the pet is doing, care, and the app's settings. The same status and care
// items make the right-click menu on the buddy.
// The icon changes when the pet needs you, and a call can play a sound.
final class StatusMenu: NSObject, NSMenuDelegate {
  var onCare: ((String, String?) -> Void)?
  var onNewEgg: (() -> Void)?
  var onSize: ((CGFloat) -> Void)?
  var side: CGFloat

  private let item = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
  private let menu = NSMenu()
  private var status: [String: Any] = [:]
  private var soundOn: Bool {
    get { UserDefaults.standard.object(forKey: "Sound") as? Bool ?? true }
    set { UserDefaults.standard.set(newValue, forKey: "Sound") }
  }

  init(side: CGFloat) {
    self.side = side
    super.init()
    menu.delegate = self
    item.menu = menu
    setIcon("face.smiling")
  }

  func update(_ next: [String: Any]) {
    let was = status["calling"] as? String
    status = next
    let calling = next["calling"] as? String
    if calling != nil, calling != was, soundOn { NSSound(named: "Tink")?.play() }
    let stage = next["stage"] as? String
    setIcon(stage == "dead" ? "leaf" : calling != nil ? "exclamationmark.bubble.fill"
      : next["asleep"] as? Bool == true ? "moon.zzz.fill" : "face.smiling")
  }

  private func setIcon(_ symbol: String) {
    item.button?.image = NSImage(systemSymbolName: symbol, accessibilityDescription: "Fussbuddy")
  }

  private static func hearts(_ n: Any?) -> String {
    let full = n as? Int ?? 0
    return String(repeating: "♥", count: full) + String(repeating: "♡", count: max(0, 4 - full))
  }

  private static let calls = ["hungry": "is hungry", "sad": "is sad", "sick": "is sick",
    "lights": "wants the lights off", "naughty": "is acting up"]

  private var stage: String { status["stage"] as? String ?? "egg" }
  private var alive: Bool { stage != "egg" && stage != "dead" }

  func menuNeedsUpdate(_ menu: NSMenu) {
    menu.removeAllItems()
    addStatus(to: menu)
    if alive { addCare(to: menu) }
    menu.addItem(submenu("Size", sizes.enumerated().map { i, size in
      action(size.name, #selector(pickSize(_:)), tag: i, on: size.side == side)
    }))
    menu.addItem(action("Sound", #selector(toggleSound), on: soundOn))
    menu.addItem(action("Open at Login", #selector(toggleLogin), on: SMAppService.mainApp.status == .enabled))
    menu.addItem(action(stage == "dead" ? "New Egg" : "New Egg…", #selector(newEgg)))
    menu.addItem(.separator())
    menu.addItem(withTitle: "Quit Fussbuddy", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
  }

  // The right-click menu on the buddy: how it's doing and the care actions, or a new egg once it's gone.
  // Nil for an egg, which has nothing to care for yet.
  func contextMenu() -> NSMenu? {
    guard stage != "egg" else { return nil }
    let menu = NSMenu()
    addStatus(to: menu)
    if alive { addCare(to: menu) } else { menu.addItem(action("New Egg", #selector(newEgg))) }
    return menu
  }

  private func addStatus(to menu: NSMenu) {
    let name = status["name"] as? String ?? "Buddy"
    if stage == "dead" {
      info("\(name) died of \(status["cause"] as? String ?? "something")", in: menu)
    } else {
      info("\(name) · \(stage) · day \((status["age"] as? Int ?? 0) + 1)", in: menu)
      if alive {
        info("Hunger \(Self.hearts(status["hunger"]))", in: menu)
        info("Happy \(Self.hearts(status["happy"]))", in: menu)
      }
      if let why = status["calling"] as? String { info("\(name) \(Self.calls[why] ?? "needs you")", in: menu) }
      else if status["fading"] as? Bool == true { info("\(name) doesn't look well", in: menu) }
      if let round = status["round"] as? Int, round > 0 {
        info("Which hand? Round \(round) of \(status["rounds"] as? Int ?? 5) · \(status["wins"] as? Int ?? 0) found", in: menu)
      }
    }
    menu.addItem(.separator())
  }

  private func addCare(to menu: NSMenu) {
    menu.addItem(action("Feed", #selector(care(_:)), id: "feed"))
    if status["round"] as? Int ?? 0 > 0 {
      menu.addItem(action("Left Hand", #selector(care(_:)), id: "guess left"))
      menu.addItem(action("Right Hand", #selector(care(_:)), id: "guess right"))
    } else {
      menu.addItem(action("Play", #selector(care(_:)), id: "play"))
      menu.addItem(action("Gift", #selector(care(_:)), id: "gift"))
    }
    menu.addItem(action("Clean", #selector(care(_:)), id: "clean"))
    menu.addItem(action("Medicine", #selector(care(_:)), id: "medicine"))
    menu.addItem(action(status["lightsOff"] as? Bool == true ? "Lights On" : "Lights Off", #selector(care(_:)), id: "lights"))
    menu.addItem(action("Scold", #selector(care(_:)), id: "scold"))
    menu.addItem(.separator())
  }

  private func info(_ title: String, in menu: NSMenu) {
    let item = menu.addItem(withTitle: title, action: nil, keyEquivalent: "")
    item.isEnabled = false
  }

  private func action(_ title: String, _ selector: Selector, tag: Int = 0, id: String? = nil, on: Bool = false) -> NSMenuItem {
    let item = NSMenuItem(title: title, action: selector, keyEquivalent: "")
    item.target = self; item.tag = tag; item.representedObject = id; item.state = on ? .on : .off
    return item
  }

  private func submenu(_ title: String, _ items: [NSMenuItem]) -> NSMenuItem {
    let item = NSMenuItem(title: title, action: nil, keyEquivalent: "")
    item.submenu = NSMenu(title: title)
    items.forEach { item.submenu?.addItem($0) }
    return item
  }

  @objc private func care(_ item: NSMenuItem) {
    let parts = (item.representedObject as? String ?? "").split(separator: " ").map(String.init)
    onCare?(parts[0], parts.count > 1 ? parts[1] : nil)
  }

  @objc private func pickSize(_ item: NSMenuItem) {
    side = sizes[item.tag].side
    UserDefaults.standard.set(Double(side), forKey: sizeKey)
    onSize?(side)
  }

  @objc private func toggleSound() { soundOn.toggle() }

  @objc private func toggleLogin() {
    let service = SMAppService.mainApp
    try? service.status == .enabled ? service.unregister() : service.register()
  }

  // Starting over is final, so it asks first unless the pet has already died.
  @objc private func newEgg() {
    if status["stage"] as? String != "dead" {
      NSApp.activate(ignoringOtherApps: true)
      let alert = NSAlert()
      alert.messageText = "Start over with a new egg?"
      alert.informativeText = "\(status["name"] as? String ?? "Your buddy") will be gone for good."
      alert.addButton(withTitle: "New Egg")
      alert.addButton(withTitle: "Cancel")
      guard alert.runModal() == .alertFirstButtonReturn else { return }
    }
    onNewEgg?()
  }
}
