export const messages = {
  th: {
    brand: 'อยู่ต่อ',
    tagline: 'เพราะความห่วงใย ไม่ได้จบลงที่การจากลา',
    navigation: {
      dashboard: 'ภาพรวม',
      assets: 'ทรัพย์สินของฉัน',
      contacts: 'บุคคลที่ไว้วางใจ',
      documents: 'คลังเอกสาร',
      instructions: 'บันทึกความประสงค์',
      family: 'พื้นที่สำหรับครอบครัว',
      checklist: 'รายการดำเนินการ',
      assistant: 'ผู้ช่วย AI',
      tax: 'แนวทางภาษี',
    },
  },
  en: {
    brand: 'YooTor',
    tagline: 'Because care continues beyond goodbye.',
    navigation: {
      dashboard: 'Overview',
      assets: 'My assets',
      contacts: 'Trusted contacts',
      documents: 'Document vault',
      instructions: 'Personal wishes',
      family: 'Family space',
      checklist: 'Administrative checklist',
      assistant: 'AI guidance',
      tax: 'Tax guidance',
    },
  },
} as const;
export type Locale = keyof typeof messages;
export const defaultLocale: Locale = 'th';
export const navigationLabels = messages[defaultLocale].navigation;
