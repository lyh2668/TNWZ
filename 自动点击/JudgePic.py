# -*- coding:utf-8 -*-
from PIL import Image
import Check
from Check.StartCheck import StartCheck


def judge(path, s):
    im = Image.open(path)
    x, y = im.size
    checkStartGameY = 22 * y / 24
    checkStartGameX = x / 2
    checkFinishGameY = 17 * y / 24
    checkFinishGameX = x / 2
    checkLvUpY = 18 * y / 24
    checkLvUpX = x / 2
    checkAnswerY = 13 * y / 24
    checkAnswerX = x / 2
    im_pixel = im.load()
    # JudgeStart(im_pixel, x, y)
    # JudgeChooseAnswer(im_pixel, x, y)
    # JudgeFinish(im_pixel, x, y)
    # JudgeLvUp(im_pixel, x, y)


    if (JudgeStart(im_pixel, x, y)):
        print("start")
        StartCheck(checkStartGameX, checkStartGameY)
        # print(checkStartGameX, checkStartGameY)
        # StartCheck(500, 1040)
        return
    if (JudgeFinish(im_pixel, x, y)):
        print("finish")
        StartCheck(checkFinishGameX, checkFinishGameY)
        # print(checkFinishGameX, checkFinishGameY)
        return
    if (JudgeLvUp(im_pixel, x, y)):
        print("lvUp")
        StartCheck(checkLvUpX, checkLvUpY)
        # print(checkLvUpX, checkLvUpY)
        return
    if (JudgeChooseAnswer(im_pixel, x, y)):
        print("choose")
        StartCheck(checkAnswerX, checkAnswerY)
        # print(checkAnswerX, checkAnswerY)
        # StartCheck(500, 1040)
        return


def JudgeStart(im_pixel, x, y):
    judgeY = 11 * y / 24
    flag_pixel = im_pixel[0, judgeY]
    for i in range(0, x, 50):
        pixel = im_pixel[i, judgeY]
        if pixel != flag_pixel:
            return True
            break
    if i >= x - 49:
        return False


def JudgeChooseAnswer(im_pixel, x, y):
    judgeY = (21 * y / 48) + 30  # 测试出来的
    judgeXFrom = int(6 * x / 27)
    judgeXTo = int(20 * x / 27)

    flag_pixel = im_pixel[0, judgeY]
    for i in range(judgeXFrom, judgeXTo, 50):
        pixel = im_pixel[i, judgeY]
        if pixel != flag_pixel:
            return False
            break
    if i >= judgeXTo - 49:
        return True


def JudgeFinish(im_pixel, x, y):
    judgeY = 29 * y / 48
    flag_pixel = im_pixel[0, judgeY]
    for i in range(0, x, 50):
        pixel = im_pixel[i, judgeY]
        if pixel != flag_pixel:
            # print(i,judgeY)
            return False
            break
    if i >= x - 49:
        return True


def JudgeLvUp(im_pixel, x, y):
    judgeX = 4 * x / 27
    judgeYFrom = int(13 * y / 24)
    judgeYTo = int(20 * y / 24)
    flag_pixel = im_pixel[judgeX, judgeYFrom]
    for i in range(judgeYFrom, judgeYTo, 50):
        pixel = im_pixel[judgeX, i]
        if pixel != flag_pixel:
            return False
            break
    if i >= judgeYTo - 49:
        return True


if __name__ == '__main__':
    im = Image.open("./11.png")
    im_pixel = im.load()
    judge("./11.png", 1)
