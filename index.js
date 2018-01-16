import request from 'request'
import rp from 'request-promise'
import crypto from 'crypto'
import fs from 'fs'

import './mongodb'
import QuizModel from './models/quiz'

const options = {
  method: 'POST',
  hostname: 'question.hortor.net',
  path: '/question/bat/intoRoom',
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
    uid: '填写UID',
    token: '填写TOKEN'
  },
  player2: {
    uid: '填写UID',
    token: '填写TOKEN'
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
	let params = {
	roomID,
	uid: userForgeInfo[player].uid,
	t: new Date().getTime()
	}
	let sign = createSignature(params, userForgeInfo[player].token)
	params.sign = sign
	//console.log(params)
	const res = await rp.post(
	'https://question.hortor.net/question/bat/intoRoom',
	{ form: params })
	console.log('intoRoom: '+player)
	//console.log(res)
	roomID = JSON.parse(res).data.roomId
}

const leaveRoom = async (player) => {
	let params = {
	  roomID,
	  uid: userForgeInfo[player].uid,
	  t: new Date().getTime()
	}
	let sign = createSignature(params, userForgeInfo[player].token)
	params.sign = sign
	//console.log(params)
	const res = await rp.post(
	  'https://question.hortor.net/question/bat/leaveRoom',
	  { form: params })
	console.log('leaveRoom: '+player);
	console.log(res)
	// roomID = JSON.parse(res).data.roomId
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
      'https://question.hortor.net/question/bat/beginFight',
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
      'https://question.hortor.net/question/bat/findQuiz',
      { form: params }
    )
    console.log('findQuiz')
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
      'https://question.hortor.net/question/bat/choose',
      { form: params }
    )
    console.log('chooseAnswer: '+player)
    return JSON.parse(res)
  } catch (err) {
    console.error(err.message)
  }
}

const getResults = async (player) => {
	let params = {
	  roomID,
	  uid: userForgeInfo[player].uid,
	  t: new Date().getTime()
	}
	let sign = createSignature(params, userForgeInfo[player].token)
	params.sign = sign

	const res = await rp.post(
	  'https://question.hortor.net/question/bat/fightResult',
	  { form: params }
	)
	console.log('getResults: '+player)
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
	  sleep(300)
      // 玩家2是否可以不作答？
      await chooseAnswer('player2', i + 1, answer)

      let params = Object.assign(quiz.data, {answer: result.data.answer})
      if (!one) {
        const quizModel = new QuizModel(params)
        const saved = await quizModel.save()
        console.log(saved)
      }
      sleep(300)
    }
    let count = await QuizModel.count()
    console.log(`success: ${success} total: ${count}`)
    fs.writeFileSync('./success.log', `success: ${success} total: ${count}\n`, {flag: 'a'});
  } catch (err) {
    console.error(err.message)
  }
}

const start = async () => {
  //异常流程保证完成退出操作，保护token不失效
  let failed = false
  //加入一个控制设置
  fs.writeFileSync('./control.ini', '1')
  while (fs.readFileSync('./control') == '1' || failed) {
    // 1. 有可能上一次流程异常，则会无法进行下一次的阶段
    // 2. 有可能initRoom超时，则需要重新initRoom
    // play1创建房间
	if(!failed){
		try{
			roomID = -1
			await intoRoom('player1')
			sleep(100)
			// play2加入房间
			await intoRoom('player2')
			sleep(100)
		}catch (err){
			console.error(err.message)
			continue
		}
	}
	try{
		await getResults('player1')
		sleep(100)
		await getResults('player2')
		sleep(100)
		await leaveRoom('player1')
		sleep(100)
		await leaveRoom('player2')
		sleep(100)
		failed = false
	}catch (err) {
		console.error(err.message)
		failed = true
	}
	console.log('loop end.')
    sleep(500)
  }
}

start()
