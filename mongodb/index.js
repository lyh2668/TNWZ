// import mongoose from 'mongoose'
// import config from '../config' // 抽离的配置文件
const Mongoose = require('mongoose')
const config = require('../config')
console.log(config.mongodb.opt)

const DATABASE_URL = config.mongodb.host // 数据库URL
const DATABASE_NAME = config.mongodb.database  // 操作的数据库
const DATABASE_OPT = config.mongodb.opt // 数据库链接的可选项
const db = Mongoose.connect(DATABASE_URL + DATABASE_NAME, {
  useMongoClient: true
})
Mongoose.Promise = global.Promise

// 打开数据库
db.once('open', () => {
  console.log('连接数据库成功')
})

// 数据库报错
db.on('error', err => {
  console.log('Error in MongoDB connection: ', err)
  Mongoose.disconnect()
})

// 关闭数据库
db.on('close', () => {
  console.log('数据库断开， 重连ing')
  // 若是数据库失联则重新链接数据库
  Mongoose.connect(DATABASE_URL, DATABASE_OPT)
})
