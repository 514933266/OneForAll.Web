/* eslint-disable */
// 智能人事
const API = {
  KEY: 'OneForAll.OA',
  SETTING: {
    URL: '/api/OAPersonSettings',
    FIELD: '/api/OAPersonSettings/{id}/Fields',
    BATCH_SORT: '/api/OAPersonSettings/Batch/SortNumber',
    FIELD_DELETE: '/api/OAPersonSettings/{id}/Fields/{fieldId}',
    FIELD_ENABLE: '/api/OAPersonSettings/{id}/Fields/{fieldId}/IsEnabled',
    FIELD_BATCH_SORT: '/api/OAPersonSettings/{id}/Fields/Batch/SortNumber'
  },
  TABLE_SETTING: {
    URL: '/api/OATableColumnSettings'
  },
  PERSON_ENTRY: {
    URL: '/api/OAPersonEntrys',
    BATCH_DELETE: '/api/OAPersonEntrys/Batch/IsDeleted'
  },
  // 入职档案
  PERSONAL_ENTRY: {
    URL: '/api/OAPersonalEntryFiles',
    SETTING: '/api/OAPersonalEntryFiles/{id}/Settings',
    UPLOAD_FILE: (id) => `/api/OAPersonalEntryFiles/${id}/Files`,
  },
  // 个人档案
  PERSONAL_FILE: {
    URL: '/api/OAPersonalFiles',
    HISTORY: '/api/OAPersonalTeamHistories'
  },
  PERSONAL_SCHEDULE: {
    URL: '/api/OAPersonalSchedules',
    DATE: (date) => `/api/OAPersonalSchedules/${date}`,
    BATCH_DELETE: '/api/OAPersonEntrys/Batch/IsDeleted',
    CLOSE: (id) => `/api/OAPersonalSchedules/${id}/IsClosed`
  },
  DASHBOARD: {
    PERSON: '/api/OADashboard/NewPersons',
    STATISTICS: '/api/OADashboard/Statistics'
  }
}

export default API
