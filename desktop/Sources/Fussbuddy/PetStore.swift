import Foundation

// The pet's saved state: one JSON file the page writes, in the app's own (sandboxed) Application Support folder.
enum PetStore {
  private static let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
  private static let file = support.appendingPathComponent("Fussbuddy/pet.json")
  // Where the pet lived before the app was called Fussbuddy.
  private static let oldFile = support.appendingPathComponent("Buddies/pet.json")

  static func load() -> String? {
    let fm = FileManager.default
    if !fm.fileExists(atPath: file.path), fm.fileExists(atPath: oldFile.path) {
      try? fm.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
      try? fm.moveItem(at: oldFile, to: file)
      try? fm.removeItem(at: oldFile.deletingLastPathComponent())
    }
    guard let text = try? String(contentsOf: file, encoding: .utf8),
      (try? JSONSerialization.jsonObject(with: Data(text.utf8))) != nil else { return nil }
    return text
  }

  static func save(_ json: String) {
    try? FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
    try? json.write(to: file, atomically: true, encoding: .utf8)
  }
}
