import AppKit
import WebKit

// Mouse events stop here, because the page never sees them: a drag moves the window, a click is a boop and a
// right-click (or control-click) asks for the menu.
final class BuddyView: WKWebView {
  var onClick: (() -> Void)?
  var onRightClick: ((NSEvent) -> Void)?
  private var grab: NSPoint?
  private var dragged = false

  override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }

  override func mouseDown(with event: NSEvent) {
    if event.modifierFlags.contains(.control) { return rightMouseDown(with: event) }
    grab = event.locationInWindow
    dragged = false
  }

  override func mouseDragged(with event: NSEvent) {
    guard let grab, let window else { return }
    let mouse = NSEvent.mouseLocation
    window.setFrameOrigin(NSPoint(x: mouse.x - grab.x, y: mouse.y - grab.y))
    dragged = true
  }

  override func mouseUp(with event: NSEvent) {
    if grab != nil, !dragged { onClick?() }
    grab = nil
  }

  override func rightMouseDown(with event: NSEvent) { onRightClick?(event) }
}
