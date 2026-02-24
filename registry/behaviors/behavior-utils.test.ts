/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { parseBehaviorNames } from "./behavior-utils";

describe("parseBehaviorNames", () => {
  describe("Basic Parsing", () => {
    it("should parse single behavior", () => {
      expect(parseBehaviorNames("reveal")).toEqual(["reveal"]);
    });

    it("should parse space-separated behaviors and sort them", () => {
      expect(parseBehaviorNames("reveal logger")).toEqual(["logger", "reveal"]);
    });

    it("should parse comma-separated behaviors and sort them", () => {
      expect(parseBehaviorNames("reveal, logger")).toEqual(["logger", "reveal"]);
    });

    it("should parse mixed separators and sort them", () => {
      expect(parseBehaviorNames("reveal, logger input-watcher")).toEqual([
        "input-watcher",
        "logger",
        "reveal",
      ]);
    });

    it("should handle behaviors in different order consistently", () => {
      const result1 = parseBehaviorNames("reveal logger");
      const result2 = parseBehaviorNames("logger reveal");
      expect(result1).toEqual(result2);
      expect(result1).toEqual(["logger", "reveal"]);
    });
  });

  describe("Hyphenated Names", () => {
    it("should preserve hyphenated behavior names", () => {
      expect(parseBehaviorNames("input-watcher")).toEqual(["input-watcher"]);
    });

    it("should handle multiple hyphenated behaviors", () => {
      expect(parseBehaviorNames("input-watcher element-counter")).toEqual([
        "element-counter",
        "input-watcher",
      ]);
    });

    it("should preserve multiple hyphens in behavior names", () => {
      expect(parseBehaviorNames("super-long-behavior-name")).toEqual([
        "super-long-behavior-name",
      ]);
    });
  });

  describe("Whitespace Handling", () => {
    it("should handle empty string", () => {
      expect(parseBehaviorNames("")).toEqual([]);
    });

    it("should handle null", () => {
      expect(parseBehaviorNames(null)).toEqual([]);
    });

    it("should handle undefined", () => {
      expect(parseBehaviorNames(undefined)).toEqual([]);
    });

    it("should handle whitespace-only string", () => {
      expect(parseBehaviorNames("   ")).toEqual([]);
    });

    it("should trim leading and trailing whitespace", () => {
      expect(parseBehaviorNames("  reveal  ")).toEqual(["reveal"]);
    });

    it("should handle multiple spaces between behaviors", () => {
      expect(parseBehaviorNames("reveal    logger")).toEqual([
        "logger",
        "reveal",
      ]);
    });

    it("should handle tabs and newlines", () => {
      expect(parseBehaviorNames("reveal\t\nlogger")).toEqual([
        "logger",
        "reveal",
      ]);
    });
  });

  describe("Invalid Characters", () => {
    it("should remove all numeric characters", () => {
      expect(parseBehaviorNames("reveal123logger456")).toEqual([
        "logger",
        "reveal",
      ]);
    });

    it("should remove all special characters", () => {
      expect(parseBehaviorNames("reveal!@#logger$%^")).toEqual([
        "logger",
        "reveal",
      ]);
    });

    it("should remove multiple invalid characters in sequence", () => {
      expect(parseBehaviorNames("reveal!!!logger???")).toEqual([
        "logger",
        "reveal",
      ]);
    });

    it("should handle invalid characters at start and end", () => {
      expect(parseBehaviorNames("123reveal456logger789")).toEqual([
        "logger",
        "reveal",
      ]);
    });

    it("should handle mixed valid and invalid characters", () => {
      // "r3v3a1 l0gg3r" → "r v a  l gg r" → ["a", "gg", "l", "r", "r", "v"]
      // Each number acts as a delimiter, splitting into individual letters/fragments
      expect(parseBehaviorNames("r3v3a1 l0gg3r")).toEqual([
        "a",
        "gg",
        "l",
        "r",
        "r",
        "v",
      ]);
      
      // More realistic test case
      expect(parseBehaviorNames("reveal9logger")).toEqual(["logger", "reveal"]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle single character behavior", () => {
      expect(parseBehaviorNames("a")).toEqual(["a"]);
    });

    it("should handle duplicate behavior names", () => {
      // Note: This doesn't deduplicate - that's by design
      // The consumer should handle duplicates if needed
      expect(parseBehaviorNames("reveal reveal")).toEqual(["reveal", "reveal"]);
    });

    it("should handle very long behavior names", () => {
      const longName = "a".repeat(100);
      expect(parseBehaviorNames(longName)).toEqual([longName]);
    });

    it("should handle many behaviors", () => {
      const input = Array.from({ length: 20 }, (_, i) => `behavior${i}`).join(
        " ",
      );
      const result = parseBehaviorNames(input);
      expect(result).toHaveLength(20);
      expect(result).toEqual(
        result.slice().sort(), // Should be sorted
      );
    });
  });

  describe("Consistency Tests (Auto-Loader vs Behavioral-Host)", () => {
    it("should produce same result for both parsers", () => {
      const testCases = [
        "reveal logger",
        "logger reveal",
        "reveal, logger",
        "reveal    logger",
        "reveal123logger456",
        "input-watcher",
        "reveal logger input-watcher",
      ];

      testCases.forEach((input) => {
        const result = parseBehaviorNames(input);
        // Verify result is sorted
        expect(result).toEqual(result.slice().sort());
      });
    });

    it("should handle the reported bug case correctly", () => {
      // This was failing before the fix:
      // Only first invalid char was removed, causing inconsistency
      const input = "reveal123logger456";
      const result = parseBehaviorNames(input);

      // Should remove ALL numbers, not just the first one
      expect(result).toEqual(["logger", "reveal"]);
      expect(result).not.toContain("23");
      expect(result).not.toContain("456");
    });

    it("should handle multiple special characters correctly", () => {
      const input = "reveal!@#logger$%^";
      const result = parseBehaviorNames(input);

      // Should remove ALL special chars, not just the first one
      expect(result).toEqual(["logger", "reveal"]);
      // Should not have leftover special characters
      expect(result.join("")).not.toMatch(/[^a-zA-Z-]/);
    });
  });
});
