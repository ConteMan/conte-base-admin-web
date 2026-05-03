/**
 * 应用级 UI 扩展配置
 * 用于集中管理 Vben 框架未内置或通过 props 定义的杂项配置
 */
export const appConfig = {
  auth: {
    // 隐藏“忘记密码”入口
    showForgetPassword: false,
    
    // 显示“记住账号”复选框
    showRememberMe: true,
    
    // 全局左侧标语（为空则使用默认，传空格隐藏）
    pageTitle: 'ConteBase',
    
    // 全局左侧标语描述（为空即隐藏描述，传空格隐藏）
    pageDescription: '个人中枢与后台控制台',
    
    // 登录表单居中大标题（为空则降级取 framework i18n 配置，传空格隐藏）
    title: 'ConteBase Admin',
    
    // 登录表单居中副标题（为空则隐藏，传空格隐藏）
    subTitle: '使用管理员账号进入 ConteBase 控制台',
    
    // 是否在登录页/注册页底部显示 Copyright
    showCopyright: false,
  },
};
