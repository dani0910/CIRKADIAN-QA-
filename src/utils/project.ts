export interface ProjectMetadata {
  description: string;
  qa?: string;
  developer?: string;
  designer?: string;
  period?: string;
  versions?: string[];
  status?: string;
}

export function parseProjectDescription(descRaw: string | null): ProjectMetadata {
  if (!descRaw) {
    return { description: '', status: '진행 중' }
  }
  try {
    const parsed = JSON.parse(descRaw)
    if (parsed && typeof parsed === 'object') {
      return {
        description: parsed.description || '',
        qa: parsed.qa || '',
        developer: parsed.developer || '',
        designer: parsed.designer || '',
        period: parsed.period || '',
        versions: Array.isArray(parsed.versions) ? parsed.versions : [],
        status: parsed.status || '진행 중'
      }
    }
  } catch (e) {
    // Not JSON
  }
  return { description: descRaw, status: '진행 중' }
}
