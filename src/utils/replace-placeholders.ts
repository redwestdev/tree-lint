export function replacePlaceholders(
  template: string,
  values: Record<string, string>,
): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => {
    return values[key] ?? `{{${key}}}`;
  });
}
