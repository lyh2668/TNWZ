/*
 1. 获取到题目，DNS先劫持findQuiz接口，请求到题目以后先判断题目是否存在于题库中
 - 存在： 直接调用choose接口回答题目
 - 不存在： 返回findQuiz接口数据让用户手动答题（或者选择随机答案）
 */

const rp = require('request-promise')
const crypto = require('crypto')
require('./mongodb')
const QuizModel = require('./models/quiz')

const token = 'e65549b105a77ff9127fb508dce3f065'

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
      'https://question.hortor.net/question/bat/choose',
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

const findQuiz = async (requestData, newResponse) => {
  try {
    console.log('start findQuiz.')
    let res = JSON.parse(newResponse.body)
    const options = res.data.options
    const one = await QuizModel.findOne({ quiz: res.data.quiz })
    if (!one) {
      return { response: newResponse }
    }

    const option = one.options[one.answer - 1]
    const index = options.indexOf(option) + 1
    console.log('option: ', option, 'index: ', index)
    res.data.options[index - 1] = `${option}‼️`
    // 这两行开启则为秒选，手机上随意点答案即可
    // const params = splitParams(requestData)
    // const answer = await chooseAnswer(params, index)
    newResponse.body = JSON.stringify(res)
    return { response: newResponse }
  } catch (err) {
    console.error('error: ', err.message)
    return err.message
  }
}

module.exports = {
  *beforeSendRequest(requestDetail) {
    if (requestDetail.url === 'https://question.hortor.net/question/bat/match') {
      startFlag = 0
      console.log('--------match bat--------')
      return requestDetail
    }
  },
  *beforeSendResponse(requestDetail, responseDetail) {
    if (requestDetail.url === 'https://question.hortor.net/question/bat/findQuiz') {
      let newResponse = Object.assign({}, responseDetail.response)
      return findQuiz(requestDetail.requestData, newResponse).then()
    }
  },
  // 只代理host question.hortor.net
  *beforeDealHttpsRequest(requestDetail) {
    if (requestDetail.host && requestDetail.host.includes('question.hortor.net')) {
      return true
    }
    return false
  }
}
