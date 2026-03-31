# peaks-hook-form 提示词模板

## 🎯 一键生成（推荐）

### 模板 1：标准表单生成

```
使用 peaks-hook-form 技能生成一个表单：
- 表单名称：[FormName]
- Schema 名称：[SchemaName]
- 字段列表：
  * [fieldName] ([fieldType]): [fieldLabel] [验证规则]
  * [fieldName] ([fieldType]): [fieldLabel] [验证规则]

示例：
使用 peaks-hook-form 技能生成一个表单：
- 表单名称：DatasetSettingsAntd
- Schema 名称：RagConfig
- 字段列表：
  * name (string): 名称 必填
  * description (string): 描述
  * apiUrl (string): API 地址 URL 验证
  * enabled (boolean): 启用
```

### 模板 2：简洁命令式

```
用 peaks-hook-form 生成 [FormName] 表单，包含以下字段：
- [fieldName1]: [type1], [label1]
- [fieldName2]: [type2], [label2]

示例：
用 peaks-hook-form 生成 UserForm 表单，包含以下字段：
- username: string, 用户名
- email: string, 邮箱
- role: enum, 角色
- active: boolean, 是否激活
```

### 模板 3：完整配置式

```
请使用 peaks-hook-form 的 quick_start 脚本生成完整表单：

表单信息：
- 组件名称：[FormName]
- Schema 名称：[SchemaName]
- 输出目录：[outputDir, 默认：src/pages]

字段配置：
1. 字段名：[name]
   类型：[string|number|boolean|enum|array]
   标签：[label]
   必填：[true/false]
   验证：[min|max|email|url]
   默认值：[defaultValue]
   提示信息：[tooltip]

2. 字段名：[name]
   类型：[string|number|boolean|enum|array]
   标签：[label]
   ...

示例：
请使用 peaks-hook-form 的 quick_start 脚本生成完整表单：

表单信息：
- 组件名称：UserRegisterForm
- Schema 名称：UserRegister
- 输出目录：src/pages/user

字段配置：
1. 字段名：username
   类型：string
   标签：用户名
   必填：true
   验证：min(3)
   提示信息：至少 3 个字符

2. 字段名：email
   类型：string
   标签：邮箱
   必填：true
   验证：email
   提示信息：请输入有效的邮箱地址

3. 字段名：password
   类型：string
   标签：密码
   必填：true
   验证：min(6)
   提示信息：至少 6 个字符

4. 字段名：agree
   类型：boolean
   标签：同意协议
   必填：false
```

## 📝 分步生成

### 模板 4：仅生成 Schema

```
使用 peaks-hook-form 生成 Zod schema：
- Schema 名称：[SchemaName]
- 字段列表：
  * [fieldName]: [type], [validation]

示例：
使用 peaks-hook-form 生成 Zod schema：
- Schema 名称：ProductSchema
- 字段列表：
  * name: string, 必填
  * price: number
  * description: string
  * inStock: boolean
```

### 模板 5：仅生成表单模板

```
使用 peaks-hook-form 创建表单组件模板：
- 表单名称：[FormName]
- 使用 Schema：[SchemaName]
- 需要 watch 的字段：[field1, field2]

示例：
使用 peaks-hook-form 创建表单组件模板：
- 表单名称：ProductSettings
- 使用 Schema：ProductSchema
- 需要 watch 的字段：name, price
```

### 模板 6：生成字段组件

```
使用 peaks-hook-form 生成字段组件：
- 字段名称：[FieldName]
- 组件类型：[input|select|switch|number]
- 输出目录：src/components/hook-form/children

示例：
使用 peaks-hook-form 生成字段组件：
- 字段名称：ProductName
- 组件类型：input
- 输出目录：src/components/hook-form/children
```

## 🎨 常见场景模板

### 模板 7：用户管理表单

```
使用 peaks-hook-form 生成用户管理表单：
- 表单名称：UserManagementForm
- Schema 名称：UserManagement
- 字段列表：
  * username (string): 用户名 必填 最小长度 3
  * email (string): 邮箱 必填 email 验证
  * password (string): 密码 必填 最小长度 6
  * confirmPassword (string): 确认密码 必填
  * role (enum): 角色 选项 [admin, user, editor]
  * phone (string): 手机号
  * department (string): 部门
  * active (boolean): 是否激活
  * bio (string): 个人简介
```

### 模板 8：配置设置表单

```
使用 peaks-hook-form 生成配置设置表单：
- 表单名称：SystemConfigForm
- Schema 名称：SystemConfig
- 字段列表：
  * appName (string): 应用名称 必填
  * apiEndpoint (string): API 端点 必填 URL 验证
  * timeout (number): 超时时间（秒）
  * enableCache (boolean): 启用缓存
  * enableLog (boolean): 启用日志
  * maxRetries (number): 最大重试次数
  * environment (enum): 环境 选项 [development, staging, production]
```

### 模板 9：数据提交表单

```
使用 peaks-hook-form 生成数据提交表单：
- 表单名称：DataSubmissionForm
- Schema 名称：DataSubmission
- 字段列表：
  * title (string): 标题 必填
  * category (enum): 分类 选项 [news, article, tutorial]
  * content (string): 内容 必填
  * tags (array): 标签
  * publishDate (string): 发布日期
  * isPublic (boolean): 是否公开
  * priority (number): 优先级
```

### 模板 10：登录注册表单

```
使用 peaks-hook-form 生成登录表单：
- 表单名称：LoginForm
- Schema 名称：Login
- 字段列表：
  * email (string): 邮箱 必填 email 验证
  * password (string): 密码 必填 最小长度 6
  * rememberMe (boolean): 记住我
```

```
使用 peaks-hook-form 生成注册表单：
- 表单名称：RegisterForm
- Schema 名称：Register
- 字段列表：
  * username (string): 用户名 必填 最小长度 3
  * email (string): 邮箱 必填 email 验证
  * password (string): 密码 必填 最小长度 8
  * confirmPassword (string): 确认密码 必填
  * phone (string): 手机号
  * agreeTerms (boolean): 同意条款 必填
```

## 🔧 高级用法

### 模板 11：带 API 集成的表单

```
使用 peaks-hook-form 生成完整表单并集成 API：
- 表单名称：[FormName]
- Schema 名称：[SchemaName]
- 字段列表：[fields...]
- API 端点：[API endpoint]
- 提交方法：[POST|PUT|PATCH]
- 成功回调：[success handler]
- 错误处理：[error handler]

示例：
使用 peaks-hook-form 生成完整表单并集成 API：
- 表单名称：CreateProductForm
- Schema 名称：CreateProduct
- 字段列表：
  * name (string): 产品名称 必填
  * price (number): 价格 必填
  * description (string): 描述
  * category (enum): 分类 选项 [electronics, clothing, food]
- API 端点：/api/products
- 提交方法：POST
- 成功回调：显示成功消息，跳转到产品列表
- 错误处理：显示错误消息
```

### 模板 12：带权限控制的表单

```
使用 peaks-hook-form 生成带权限控制的表单：
- 表单名称：[FormName]
- Schema 名称：[SchemaName]
- 字段列表：[fields...]
- 权限要求：
  * 创建权限：[permission]
  * 编辑权限：[permission]
  * 删除权限：[permission]

示例：
使用 peaks-hook-form 生成带权限控制的表单：
- 表单名称：ArticleEditorForm
- Schema 名称：Article
- 字段列表：
  * title (string): 标题 必填
  * content (string): 内容 必填
  * status (enum): 状态 选项 [draft, published, archived]
  * author (string): 作者
- 权限要求：
  * 创建权限：article:create
  * 编辑权限：article:edit
  * 发布权限：article:publish
```

### 模板 13：多步骤表单

```
使用 peaks-hook-form 生成多步骤表单：
- 表单名称：[FormName]
- 步骤列表：
  步骤 1: [StepName]
    - 字段：[fields...]
  步骤 2: [StepName]
    - 字段：[fields...]
  步骤 3: [StepName]
    - 字段：[fields...]

示例：
使用 peaks-hook-form 生成多步骤表单：
- 表单名称：OnboardingForm
- 步骤列表：
  步骤 1: 基本信息
    - username (string): 用户名
    - email (string): 邮箱
    - password (string): 密码
  步骤 2: 个人信息
    - firstName (string): 名
    - lastName (string): 姓
    - phone (string): 手机号
  步骤 3: 偏好设置
    - language (enum): 语言 选项 [zh, en]
    - timezone (string): 时区
    - notifications (boolean): 启用通知
```

## 💡 提示词技巧

### 技巧 1：明确字段类型

```
❌ 模糊：生成一个用户表单，有名字、邮箱等字段
✅ 明确：生成 UserForm，包含 username(string), email(string), age(number), active(boolean)
```

### 技巧 2：指定验证规则

```
❌ 简单：生成产品表单，名称必填
✅ 详细：生成 ProductForm，name 字段必填且最小长度 3，price 字段必填且为数字
```

### 技巧 3：说明使用场景

```
❌ 笼统：生成一个表单
✅ 具体：生成后台管理系统的产品编辑表单，需要支持图片上传和富文本编辑
```

### 技巧 4：提供完整信息

```
❌ 不完整：生成配置表单
✅ 完整：生成系统配置表单，包含应用名称、API 地址、超时设置、缓存开关、日志开关，用于系统管理页面
```

## 📋 快速复制模板

### 最简模板

```
使用 peaks-hook-form 生成 [表单名] 表单：
- [字段 1]: [类型], [标签]
- [字段 2]: [类型], [标签]
```

### 标准模板

```
使用 peaks-hook-form 技能：
- 表单名称：[FormName]
- Schema 名称：[SchemaName]
- 字段列表：
  * [fieldName] ([type]): [label] [validation]
```

### 完整模板

```
请使用 peaks-hook-form 的 quick_start 脚本生成完整表单：

表单信息：
- 组件名称：[FormName]
- Schema 名称：[SchemaName]
- 输出目录：[outputDir]

字段配置：
1. 字段名：[name]
   类型：[type]
   标签：[label]
   必填：[true/false]
   验证：[validation]
   提示信息：[tooltip]
```

## 🎯 最佳实践

1. **明确表单用途**：在提示词中说明表单的使用场景
2. **详细字段说明**：包含类型、标签、验证规则
3. **指定命名规范**：表单名称使用 PascalCase，字段使用 camelCase
4. **说明特殊需求**：如 API 集成、权限控制等
5. **提供示例值**：对于 enum 类型，提供具体选项

---

**使用建议：**

- 新手从"最简模板"开始
- 熟悉后使用"标准模板"
- 复杂场景使用"完整模板"
- 参考"常见场景模板"快速上手
