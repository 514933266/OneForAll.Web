export const MESAGE_LOG_STATUS: Array<{ value: number; label: string; type: 'info' | 'danger' | 'success' | 'warning' }> = [
	{ value: 0, label: '发送失败', type: 'danger' },
	{ value: 1, label: '发送成功', type: 'success' },
	{ value: 2, label: '等待发送', type: 'warning' },
	{ value: 99, label: '发送异常', type: 'danger' }
]
