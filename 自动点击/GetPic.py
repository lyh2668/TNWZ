from PIL import Image
import matplotlib.pyplot as plt
import time

import JudgePic

try:
    from common import screenshot
except Exception as ex:
    print(ex)
    print('请将脚本放在项目根目录中运行')
    print('请检查项目根目录中的 common 文件夹是否存在')
    exit(-1)


def Start():
    screenshot.check_screenshot()


def MyPy():
    number = 1
    while True:
        s = '%05d' % number
        ticks = time.time()
        screenshot.pull_screenshot()
        img = Image.open('./Handle/screenShot.png')
        plt.figure("picture")
        plt.imshow(img)
        # plt.show()
        path = str('./screenshot/') + str(s) + str('.png')
        number = number + 1
        if number == 100:
            number = 0
        img.save(path)

        flag = JudgePic.judge(path,s)
        time.sleep(0.5)




if __name__ == '__main__':
    Start()
    MyPy()