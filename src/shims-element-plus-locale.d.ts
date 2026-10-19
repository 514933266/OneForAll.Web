// element-plus 2.7.x 的 exports 字段限制了 es/* 子路径的运行时导入，
// dist 下的 locale 产物又缺少类型声明，此处补充声明
declare module 'element-plus/dist/locale/zh-cn.mjs' {
	const zhCn: typeof import('element-plus/es/locale/lang/zh-cn').default
	export default zhCn
}
