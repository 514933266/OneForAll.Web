/* eslint-disable */
// 档案字段类型
export const PERSON_FIELD_TYPE = [
  { value: 0, label: '文本' },
  // { value: 1, label: '文本域（可输入多行文本）' },
  // { value: 2, label: '富文本（拥有更多丰富的文本内容，如图片、网页）' },
  { value: 3, label: '日期' },
  // { value: 4, label: '日期（含时间）' },
  { value: 5, label: '下拉选项' },
  { value: 6, label: 'Radio选项' },
  { value: 7, label: '附件' },
  { value: 8, label: 'Check选项' }
]

// 员工类型
export const PERSON_EMPLOYEE_TYPE = [
  { value: '全职', label: '全职', bgColor: 'ofa-bg-success' },
  { value: '实习生', label: '实习生', bgColor: 'ofa-bg-primary' },
  { value: '兼职', label: '兼职', bgColor: 'ofa-bg-warning' },
  { value: '劳务派遣', label: '劳务派遣', bgColor: 'ofa-bg-warning' },
  { value: '退休返聘', label: '退休返聘', bgColor: 'ofa-bg-danger' }
]

// 员工类型
export const PERSON_EMPLOYEE_STATUS = [
  { value: '正式员工', label: '正式员工' },
  { value: '试用员工', label: '试用员工' }
]

// 团队成员异动类型
export const TEAM_MEMBER_TRANSFER_TYPE = [
  { value: 0, label: '普通调动' },
  { value: 1, label: '升职' },
  { value: 2, label: '降职' },
  { value: 3, label: '加入部门' },
  { value: 4, label: '离职' }
]

// 通知类型
export const NOTIFICATION_TYPE = [
  { value: 0, label: '系统通知' },
  // { value: 1, label: '邮件通知' },
  // { value: 2, label: '短信通知' },
  { value: 3, label: '微信公众号通知' }
]
