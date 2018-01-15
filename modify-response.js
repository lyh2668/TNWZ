/*
 1. 获取到题目，DNS先劫持findQuiz接口，请求到题目以后先判断题目是否存在于题库中
 - 存在： 直接调用choose接口回答题目
 - 不存在： 返回findQuiz接口数据让用户手动答题（或者选择随机答案）
 */

// import rp from 'request-promise'
// import crypto from 'crypto'
// import './mongodb'
// import QuizModel from './models/quiz'
const rp = require('request-promise')
const crypto = require('crypto')
require('./mongodb')
const QuizModel = require('./models/quiz')

const token = '这里填入token'

const createSignature = (params, token) => {
  let obj = Object.assign(params, { token })

  const md5 = crypto.createHash("md5")
  let str = ''

  const keys = Object.keys(obj).sort()
  for (const key of keys) {
    str += `${key}=${obj[key]}`
  }

  md5.update(str)
  return md5.digest('hex')
}

let startFlag = 0

const chooseAnswer = async (data, option) => {
  try {
    let params = {
      roomID: data.roomID,
      uid: data.uid,
      t: new Date().getTime(),
      quizNum: startFlag === 0 ? '1' : data.quizNum, // quizNum有个bug 2 2 3 4 5
      option: option
    }
    ++startFlag
    let sign = createSignature(params, token)
    params.sign = sign
    console.log('params: ', params, 'sign: ', sign)
    const res = await rp.post(
      'https://question.hortor.net/question/fight/choose',
      { form: params }
    )
    console.log('chooseAnswer: ', res)
    return res
  } catch (err) {
    console.error(err.message)
  }
}

const splitParams = (data) => {
  const arr = new String(data).split('&')
  let obj = {}
  for (let i = 0; i < arr.length; ++i) {
    const tmp = arr[i].split('=')
    obj[tmp[0]] = tmp[1]
  }
  return obj
}

const findQuiz = async (requestData) => {
  try {
    console.log('start findQuiz.')
    // 继续请求
    let res = await rp.post(
      'https://question.hortor.net/question/fight/findQuiz',
      { form: splitParams(requestData) })
    console.log('findQuiz: ', res)
    if (res) {
      res = JSON.parse(res)
    } else  {
      throw new Error('quiz not exist.')
    }

    if (!res.data) {
      throw new Error(JSON.stringify(res))
    }

    const options = res.data.options
    console.log('options: ', options)
    const one = await QuizModel.findOne({ quiz: res.data.quiz })
    console.log('one: ', one)
    // 题目未找到则返回题目手工作答
    if (!one) {
      return null
    }
    const option = one.options[one.answer - 1]
    const index = options.indexOf(option) + 1
    console.log('option: ', option, 'index: ', index)
    const params = splitParams(requestData)
    const answer = await chooseAnswer(params, index)
    console.log('answer', answer)

    return res
  } catch (err) {
    console.error('error: ', err.message)
    return err.message
    // return responseDetail.response
  }
}

module.exports = {
  *beforeSendRequest(requestDetail) {
    if (requestDetail.url === 'https://question.hortor.net/question/fight/match' ||
        requestDetail.url === 'https://question.hortor.net/question/fight/beginFight') {
      startFlag = 0
      console.log('--------match fight--------')
      return requestDetail
    }
  },
  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url === 'https://question.hortor.net/question/fight/findQuiz') {
      findQuiz(requestDetail.requestData).then((res) => {
        return res
      })
    }
  }
}
