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
  PERSONAL_ENTRY: {
    URL: '/api/OAPersonalEntryFiles',
    SETTING: '/api/OAPersonalEntryFiles/{id}/Settings'
  }
}

export default API
