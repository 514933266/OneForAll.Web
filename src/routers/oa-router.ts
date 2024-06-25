import { IPersonalMenuTree } from '../interfaces/IPersonalMenuTree'

// 人员档案
export const PERSON = { Name: 'OaPerson', Code: 'OaPersons', Url: '/oa/person' }
// 人员档案字段设置
export const PERSON_SETTING: IPersonalMenuTree = { Id: 'OaPersonSetting', Code: 'OaPersonSettings', Name: '人员档案设置', Url: '/oa/person-setting', Type: 2, OpenType: 1, IsDefault: false, Icon: 'file', Children: [] }
// 人员档案详情
export const PERSON_DETAIL: IPersonalMenuTree = { Id: 'OaPersonDetail', Code: 'OaPersons', Name: '员工档案', Url: '/oa/person-detail', Type: 2, OpenType: 1, IsDefault: false, Icon: 'file', Children: [] }
// 入职档案
export const PERSON_ENTRY_FILE: IPersonalMenuTree = { Id: 'OaPersonEntryFile', Code: 'OAPersonalEntryFiles', Name: '入职档案填写', Url: '/entry-file', Type: 2, OpenType: 1, IsDefault: false, Icon: 'file', Children: [] }
// 部门
export const TEAM = { Name: 'OaTeam', Code: 'OaTeams', Url: '/oa/team' }
// 部门类型
export const TEAM_TYPE: IPersonalMenuTree = { Id: 'OaTeamType', Name: 'OaTeamType', Code: 'OaTeamTypes', Url: '/oa/team-type', Type: 2, OpenType: 1, IsDefault: false, Icon: 'sitemap', Children: [] }
// 职级管理
export const JOB_LEVEL: IPersonalMenuTree = { Id: 'OaJobLevel', Name: 'OaJobLevel', Code: 'OaJobLevels', Url: '/oa/job-level', Type: 2, OpenType: 1, IsDefault: false, Icon: 'user-graduate', Children: [] }
// 职务管理
export const JOB_DUTY: IPersonalMenuTree = { Id: 'OaJobDuty', Name: 'OaJobDuty', Code: 'OaJobDutys', Url: '/oa/job-duty', Type: 2, OpenType: 1, IsDefault: false, Icon: 'user-cog', Children: [] }
