# TNWZ
头脑王者开房答题抓题库 & 排位自动答题脚本
### [掘金文章: 我是如何次次《头脑王者》获得满分的](https://juejin.im/editor/posts/5a5b4097518825734d149423)

### 环境要求
1. node v7.6以上
2. mongodb
3. anyproxy

#### 安装anyproxy
```
1. 安装node.js
2. npm i -g anyproxy
3. anyproxy-ca // 生成证书
4. anyproxy -i // 以代理https的方式启动
// 然后手机端配置代理的IP及PORT，默认端口为8001，
// Anyproxy的WebService的默认端口为8002，这里可以查看到接口
// 手机端配置代理以后需要下载证书并信任，
// 苹果端的可以在手机的Safiri里面输入xxx.xxx.xxx.xxx:8002/fetchCrtFile的方式下载到证书
// 高版本的iOS可能需要在两处地方信任。
```
1. git clone
2. npm install 或 yarn install
3. 开启mongodb数据库

### 模拟开房对战
1. 填写index.js文件中2个对战用户的 uid & token
2. npm run start 执行脚本

### 模拟排位
1. 填写modify-response.js中的token
2. 手机信任证书并连上代理
3. npm run fight 执行脚本
