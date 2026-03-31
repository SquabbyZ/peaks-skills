# 构建阶段
FROM node:22-alpine as build

# 设置工作目录
WORKDIR /app

# 复制package.json和pnpm-lock.yaml文件
COPY package.json pnpm-lock.yaml ./

# 安装pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 构建项目
RUN pnpm run build

# 运行阶段
FROM nginx:alpine

# 安装gettext包和brotli模块
RUN apk add --no-cache gettext nginx-mod-http-brotli

# 复制构建产物到nginx的html目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf.template

# 暴露80端口
EXPOSE 80

# 启动nginx，在启动前替换环境变量
CMD ["sh", "-c", "envsubst '$API_DOMAIN' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]