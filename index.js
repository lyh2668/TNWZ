import request from 'request'
import rp from 'request-promise'
import crypto from 'crypto'
import fs from 'fs'

import './mongodb'
import QuizModel from './models/quiz'

const options = {
  method: 'POST',
  hostname: 'question.hortor.net',
  path: '/question/fight/intoRoom',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
}

/**
 * token: 登录唯一标识
 * uid: 用户id
 * t: 当前时间
 * sign: 签名
 */
const userForgeInfo = {
  player1: {
    uid: '这里填入用户1的uid',
    token: '这里填入用户1的token'
  },
  player2: {
    uid: '这里填入用户2的uid',
    token: '这里填入用户2的token'
  }
}

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

let roomID = -1

const intoRoom = async (player) => {
  try {
    let params = {
      roomID,
      uid: userForgeInfo[player].uid,
      t: new Date().getTime()
    }
    let sign = createSignature(params, userForgeInfo[player].token)
    params.sign = sign
    console.log(params)
    const res = await rp.post(
      'https://question.hortor.net/question/fight/intoRoom',
      { form: params })
    console.log('intoRoom', res)
    roomID = JSON.parse(res).data.roomId
  } catch (err) {
    console.error(err.message)
  }
}

const leaveRoom = async (player) => {
  try {
    let params = {
      roomID,
      uid: userForgeInfo[player].uid,
      t: new Date().getTime()
    }
    let sign = createSignature(params, userForgeInfo[player].token)
    params.sign = sign
    console.log(params)
    const res = await rp.post(
      'https://question.hortor.net/question/fight/leaveRoom',
      { form: params })
    console.log(res)
    // roomID = JSON.parse(res).data.roomId
  } catch (err) {
    console.error(err.message)
  }
}

const beginFight = async () => {
  try {
    let params = {
      roomID,
      uid: userForgeInfo.player1.uid,
      t: new Date().getTime()
    }
    let sign = createSignature(params, userForgeInfo.player1.token)
    params.sign = sign

    const res = await rp.post(
      'https://question.hortor.net/question/fight/beginFight',
      { form: params }
    )
    console.log('beginFight: ', res)
  } catch (err) {
    console.error(err.message)
  }
}

const findQuiz = async (num) => {
  console.log('num: ', num)
  try {
    let params = {
      roomID,
      uid: userForgeInfo.player1.uid,
      t: new Date().getTime(),
      quizNum: num
    }
    let sign = createSignature(params, userForgeInfo.player1.token)
    params.sign = sign

    const res = await rp.post(
      'https://question.hortor.net/question/fight/findQuiz',
      { form: params }
    )
    console.log('findQuiz: ', res)
    return JSON.parse(res)
  } catch (err) {
    console.error(err.message)
  }
}

const chooseAnswer = async (player, num, answer = 0) => {
  try {
    let params = {
      roomID,
      uid: userForgeInfo[player].uid,
      t: new Date().getTime(),
      quizNum: num,
      options: answer
    }
    let sign = createSignature(params, userForgeInfo[player].token)
    params.sign = sign

    const res = await rp.post(
      'https://question.hortor.net/question/fight/choose',
      { form: params }
    )
    console.log('chooseAnswer: ', res)
    return JSON.parse(res)
  } catch (err) {
    console.error(err.message)
  }
}

const getResults = async (player) => {
  try {
    let params = {
      roomID,
      uid: userForgeInfo[player].uid,
      t: new Date().getTime()
    }
    let sign = createSignature(params, userForgeInfo[player].token)
    params.sign = sign

    const res = await rp.post(
      'https://question.hortor.net/question/fight/fightResult',
      { form: params }
    )
    console.log('getResults')
  } catch (err) {
    console.error(err.message)
  }
}

const sleep = (numberMillis) => {
  let now = new Date()
  const exitTime = now.getTime() + numberMillis
  while (true) {
    now = new Date()
    if (now.getTime() > exitTime) {
      return
    }
  }
}

const startAnswer = async () => {
  try {
    let success = 0
    for (let i = 0; i < 5; ++i) {
      let quiz = await findQuiz(i + 1)
      if (!quiz) {
        throw new Error('未找到题目')
      }
      let answer = 0
      // 查找题库内是否有该题
      let one = await QuizModel.findOne({ quiz: quiz.data.quiz })
      if (one) {
        answer = one.answer
        ++success
      }
      let result = await chooseAnswer('player1', i + 1, answer)
      // 玩家2是否可以不作答？
      await chooseAnswer('player2', i + 1)

      let params = Object.assign(quiz.data, {answer: result.data.answer})
      if (!one) {
        const quizModel = new QuizModel(params)
        const saved = await quizModel.save()
        console.log(saved)
      }
      sleep(200)
    }
    let count = await QuizModel.count()
    console.log(`success: ${success} total: ${count}`)
    fs.writeFileSync('./success.log', `success: ${success} total: ${count}\n`, {flag: 'a'});
  } catch (err) {
    console.error(err.message)
  }
}

const start = async () => {
  // let i = 100
  while (1) {
    // 1. 有可能上一次流程异常，则会无法进行下一次的阶段
    // 2. 有可能initRoom超时，则需要重新initRoom
    // play1创建房间
    roomID = -1
    await intoRoom('player1')
    // play2加入房间
    await intoRoom('player2')
    // 开始答题
    await beginFight()
    // 获取题目, 进行答题
    await startAnswer()
    await getResults('player1')
    await getResults('player2')
    await leaveRoom('player1')
    await leaveRoom('player2')
    sleep(1000)
  }
}

start()
