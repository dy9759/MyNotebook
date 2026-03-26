/**
 * Maps common English transformation names/titles to localized labels.
 * When the user's language matches a known translation, it returns the localized version.
 * Otherwise, returns the original text unchanged.
 */

// Common transformation name mappings (case-insensitive key → localized labels)
const TRANSFORMATION_LABELS: Record<string, Record<string, string>> = {
  // name-based matches (lowercase)
  'summary': {
    'zh-CN': '摘要',
    'zh-TW': '摘要',
    'ja-JP': '要約',
    'ru-RU': 'Резюме',
    'fr-FR': 'Résumé',
    'it-IT': 'Riepilogo',
    'pt-BR': 'Resumo',
    'bn-IN': 'সারসংক্ষেপ',
  },
  'key points': {
    'zh-CN': '关键要点',
    'zh-TW': '關鍵要點',
    'ja-JP': 'キーポイント',
    'ru-RU': 'Ключевые моменты',
    'fr-FR': 'Points clés',
    'it-IT': 'Punti chiave',
    'pt-BR': 'Pontos-chave',
    'bn-IN': 'মূল বিষয়',
  },
  'key_points': {
    'zh-CN': '关键要点',
    'zh-TW': '關鍵要點',
    'ja-JP': 'キーポイント',
  },
  'questions': {
    'zh-CN': '问题生成',
    'zh-TW': '問題生成',
    'ja-JP': '質問生成',
    'ru-RU': 'Генерация вопросов',
    'fr-FR': 'Génération de questions',
    'it-IT': 'Generazione domande',
    'pt-BR': 'Geração de perguntas',
  },
  'study guide': {
    'zh-CN': '学习指南',
    'zh-TW': '學習指南',
    'ja-JP': 'スタディガイド',
    'ru-RU': 'Учебное пособие',
    'fr-FR': "Guide d'étude",
    'it-IT': 'Guida allo studio',
    'pt-BR': 'Guia de estudo',
  },
  'study_guide': {
    'zh-CN': '学习指南',
    'zh-TW': '學習指南',
    'ja-JP': 'スタディガイド',
  },
  'flashcards': {
    'zh-CN': '闪卡',
    'zh-TW': '閃卡',
    'ja-JP': 'フラッシュカード',
    'ru-RU': 'Флэш-карты',
    'fr-FR': 'Flashcards',
    'it-IT': 'Flashcard',
    'pt-BR': 'Flashcards',
  },
  'outline': {
    'zh-CN': '大纲',
    'zh-TW': '大綱',
    'ja-JP': 'アウトライン',
    'ru-RU': 'Структура',
    'fr-FR': 'Plan',
    'it-IT': 'Schema',
    'pt-BR': 'Esquema',
  },
  'analysis': {
    'zh-CN': '分析',
    'zh-TW': '分析',
    'ja-JP': '分析',
    'ru-RU': 'Анализ',
    'fr-FR': 'Analyse',
    'it-IT': 'Analisi',
    'pt-BR': 'Análise',
  },
  'translate': {
    'zh-CN': '翻译',
    'zh-TW': '翻譯',
    'ja-JP': '翻訳',
    'ru-RU': 'Перевод',
    'fr-FR': 'Traduction',
    'it-IT': 'Traduzione',
    'pt-BR': 'Tradução',
  },
  'translation': {
    'zh-CN': '翻译',
    'zh-TW': '翻譯',
    'ja-JP': '翻訳',
  },
  'action items': {
    'zh-CN': '行动项',
    'zh-TW': '行動項目',
    'ja-JP': 'アクションアイテム',
    'ru-RU': 'Действия',
    'fr-FR': "Points d'action",
    'it-IT': 'Azioni',
    'pt-BR': 'Itens de ação',
  },
  'action_items': {
    'zh-CN': '行动项',
    'zh-TW': '行動項目',
    'ja-JP': 'アクションアイテム',
  },
  'timeline': {
    'zh-CN': '时间线',
    'zh-TW': '時間線',
    'ja-JP': 'タイムライン',
    'ru-RU': 'Хронология',
    'fr-FR': 'Chronologie',
    'it-IT': 'Cronologia',
    'pt-BR': 'Linha do tempo',
  },
  'notes': {
    'zh-CN': '笔记',
    'zh-TW': '筆記',
    'ja-JP': 'ノート',
    'ru-RU': 'Заметки',
    'fr-FR': 'Notes',
    'it-IT': 'Note',
    'pt-BR': 'Notas',
  },
  'critique': {
    'zh-CN': '评论',
    'zh-TW': '評論',
    'ja-JP': '批評',
    'ru-RU': 'Критика',
    'fr-FR': 'Critique',
    'it-IT': 'Critica',
    'pt-BR': 'Crítica',
  },
  'pros and cons': {
    'zh-CN': '优缺点分析',
    'zh-TW': '優缺點分析',
    'ja-JP': '長所と短所',
  },
  'mind map': {
    'zh-CN': '思维导图',
    'zh-TW': '心智圖',
    'ja-JP': 'マインドマップ',
  },
  'explain like i\'m 5': {
    'zh-CN': '通俗解释',
    'zh-TW': '通俗解釋',
    'ja-JP': '簡単に説明',
  },
  'eli5': {
    'zh-CN': '通俗解释',
    'zh-TW': '通俗解釋',
    'ja-JP': '簡単に説明',
  },
}

/**
 * Get the localized label for a transformation name.
 * Falls back to the original text if no translation is found.
 */
export function getTransformationLabel(text: string, language: string): string {
  if (!text || language === 'en-US') return text

  const key = text.toLowerCase().trim()
  const translations = TRANSFORMATION_LABELS[key]
  if (translations && translations[language]) {
    return translations[language]
  }

  return text
}
