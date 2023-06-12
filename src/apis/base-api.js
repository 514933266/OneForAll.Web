var API = {
  // 域名代码
  KEY: 'OneForAll.Base',
  PERSONAL: {
    URL: '/api/SysPersonal',
    TENANT: '/api/SysPersonal/Tenant',
    HEADER: '/api/SysPersonal/Header',
    PASSWORD: '/api/SysPersonal/Password',
    MENU: '/api/SysPersonal/Menus'
  },
  PERSONAL_MESSAGE: {
    URL: '/api/SysPersonalMessages',
    UNREAD_COUNT: '/api/SysPersonalMessages/UnReadCount',
    READ: '/api/SysPersonalMessages/IsRead'
  }
}

export default API
