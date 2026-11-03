import Foundation

// The pet's saved state: one JSON file the page writes, in the app's own (sandboxed) Application Support folder.
enum PetStore {
  private static var file: URL {
    let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    return support.appendingPathComponent("Buddies/pet.json")
  }

  static func load() -> String? {
    guard let text = try? String(contentsOf: file, encoding: .utf8),
      (try? JSONSerialization.jsonObject(with: Data(text.utf8))) != nil else { return nil }
    return text
  }

  static func save(_ json: String) {
    try? FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
    try? json.write(to: file, atomically: true, encoding: .utf8)
  }
}
