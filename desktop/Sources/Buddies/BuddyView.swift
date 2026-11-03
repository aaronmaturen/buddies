import AppKit
import WebKit

// Can take keys, so the care menu's arrow keys and Escape work.
final class BuddyWindow: NSWindow {
  override var canBecomeKey: Bool { true }
}

// Mouse events stop here, because the page never sees them: a drag moves the window, a click is a boop and a
// right-click opens the care menu. While that menu is open the page gets the mouse, so its wedges can be clicked.
final class BuddyView: WKWebView {
  var onClick: (() -> Void)?
  var onRightClick: ((NSPoint) -> Void)?
  var menuOpen = false
  private var grab: NSPoint?
  private var dragged = false

  override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }

  override func mouseDown(with event: NSEvent) {
    if menuOpen { return super.mouseDown(with: event) }
    if event.modifierFlags.contains(.control) { return rightMouseDown(with: event) }
    grab = event.locationInWindow
    dragged = false
  }

  override func mouseDragged(with event: NSEvent) {
    if menuOpen { return super.mouseDragged(with: event) }
    guard let grab, let window else { return }
    let mouse = NSEvent.mouseLocation
    window.setFrameOrigin(NSPoint(x: mouse.x - grab.x, y: mouse.y - grab.y))
    dragged = true
  }

  override func mouseUp(with event: NSEvent) {
    if menuOpen { return super.mouseUp(with: event) }
    if grab != nil, !dragged { onClick?() }
    grab = nil
  }

  // Page pixels from the top left.
  override func rightMouseDown(with event: NSEvent) {
    if menuOpen { return }
    let p = convert(event.locationInWindow, from: nil)
    onRightClick?(NSPoint(x: p.x, y: isFlipped ? p.y : bounds.height - p.y))
  }
}
