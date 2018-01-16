# -*- coding:utf-8 -*-
import os

import time


def StartCheck(x, y):
    time.sleep(0.5)
    # print("check")
    cmd = 'adb shell input swipe {x1} {y1} {x2} {y2} {duration}'.format(
        x1=x,
        y1=y,
        x2=x,
        y2=y,
        duration=200
    )
    os.system(cmd)


if __name__ == '__main__':
    StartCheck(500,1440)