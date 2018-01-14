// import Mongoose from 'mongoose'
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

const SchemaQuiz = new Schema({
  quiz: { // 题目标题
    type: String,
    unique : true,
    dropDups : true
  },
  options: [String], // 题目选项
  school: String,
  type: String,
  contributor: String,
  endTime: String,
  curTime: String,
  answer: Number, // 答案
  meta: {
    createdAt: {
      type: Date,
      default: Date.now()
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    }
  }
})

SchemaQuiz.pre('save', function (next) {
  if (this.isNew) {
    this.meta.createdAt = this.meta.updatedAt = Date.now()
  } else {
    this.meta.updatedAt = Date.now()
  }

  next()
})

// export default Mongoose.model('Quiz', SchemaQuiz)
module.exports = Mongoose.model('Quiz', SchemaQuiz)
