import { isValidExternalUrl } from "@/lib/actions";

export function isValidImageSource(value: string): boolean {
  const source = value.trim();
  if (!source || source.startsWith("//") || source.includes("\\")) return false;

  if (source.startsWith("/")) {
    return !source.split(/[?#]/, 1)[0].split("/").includes("..");
  }

  return isValidExternalUrl(source);
}
