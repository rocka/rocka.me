---
title: 为 Telegram Desktop 生成 Emoji Sprite
date: Sun Mar 24 2019 22:04:50 GMT+0800 (CST)
tags:
  - Linux
  - Telegram
  - 笔记
---

Telegram Desktop 在 [v1.5.8](https://desktop.telegram.org/changelog#v-1-5-8-21-01-19) 版本中新增了自定义 Emoji 样式的功能，但这些样式我都不喜欢。~~辣鸡咕鸽还我小果冻！~~

![没有一个好看的](https://rocka.me/static/img/Screenshot_20190324_220928.png)

稍微翻了一下 Telegram 的数据目录，发现下载的 Emoji 都保存在  ~/.local/share/TelegramDesktop/tdata/emoji 这个目录下，而且都是以 Spirte 图片的形式存储的。于是我们就有丰富的 hack 空间啦！

我知道没有人喜欢看这些罗里巴嗦的步骤，所以把下载链接[先放在这里](https://rocka.me/static/file/telegram-blobmoji.7z)。

> **UPDATE:** Telegram Desktop 在 [v2.1.3](https://desktop.telegram.org/changelog#v-2-1-3-08-05-20) 版本中新增了对 Emoji 12.1 的支持，所以之前的 Sprite 失效了。虽然 Blobmoji 并没有完全覆盖，但总比没有要好 ... [新版（v2）下载连接在这里](https://rocka.me/static/file/telegram-blobmoji-v2.7z)。(2020/09/27)

<!-- more -->

作为一个前端~~程序员~~搬砖工，我首先想到的是用 HTML5 `<canvas>` 去画出这些 Emoji ，然后转换成 webp 格式把文件替换掉。那么现在问题来了，怎么获得所有 Emoji 的排列顺序呢？打开 Telegram 的 Emoji 输入面板，按照顺序一个一个点进去不就完成了！然后我立即否定了这个想法。首先 Emoji 实在是太多了 ... 而且很多还有性别和肤色的变种，输入起来简直是一种折磨 ...

否定了手动输入的想法，那就去翻一下源码吧。很快我找到了 [data.cpp](https://github.com/telegramdesktop/tdesktop/blob/f1b0b60340e7b8d2cdf321dcf2da1d523e8e5579/Telegram/SourceFiles/codegen/emoji/data.cpp) ，这里存储了所有 Emoji 的字符值。接下来的一切就顺理成章了，复制相关联的文件，然后编译一下，拿到对应的字符串 ...

所需的文件列表：

```
codegen
├── common
│   ├── logging.cpp
│   └── logging.h
└── emoji
    ├── data.cpp
    └── data.h
```

然后打开 Qt Creator，把文件导入，并编写一个 `main.cpp` 用来输出所有的字符：

```cpp
#include <iostream>
#include <QTextStream>

#include "codegen/emoji/data.h"

int main()
{
    QTextStream out(stdout);
    auto data = codegen::emoji::PrepareData();
    foreach (auto const& emoji, data.list) {
        out << emoji.id << endl;
    }
    return 0;
}
```

记得在 QMake 的配置文件里加上一句 `CONFIG += c++17`，不然 Telegram 的有些神仙操作是不能通过编译的。

运行程序，终端打印出了一堆 Emoji。然后对照已有的 Sprite 文件，顺序居然一毛一样！好吧我真的没想到事情居然这么简单。把程序的输出重定向到 `data.txt` 保存备用，接下来就是 JS 的时间了。

`index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Telegram Desktop Emoji Sprite Generator</title>
    <style>
    #cvs { width: 1152px; }
    </style>
</head>
<body>
    <canvas id="cvs" width="2304" height="5688"></canvas>
    <script src="./index.js"></script>
</body>
</html>
```

`index.js`:

```js
const EmojiStr = ``;

const SpriteSize = 72;
const SpriteLines = 16;
const SpritePerLine = 32;
const SpriteOffsetX = 0;
const SpriteOffsetY = -5;

const ctx = document.getElementsByTagName('canvas')[0].getContext('2d');
ctx.font = '58px Blobmoji';
ctx.textBaseline = 'bottom';

EmojiStr.split('\n').forEach((e, i) => {
    const xPos = (i % SpritePerLine) * SpriteSize;
    const yPos = Math.trunc(i / SpritePerLine + 1) * SpriteSize;
    console.log(i, e, xPos, yPos);
    ctx.fillText(e, xPos + SpriteOffsetX, yPos + SpriteOffsetY, SpriteSize);
});
```

显然 JS 文件中 `EmojiStr` 的值应该替换成换行分隔的 Emoji 字符串。替换好后浏览器打开 index.html，将 canvas 另存为 emoji_full.png。

![index.html](https://rocka.me/static/img/Screenshot_20190324_225139.png)

下一步操作是将图片裁切并转换为 webp 格式，用 `imagemagick` 一步搞定：

```shell
convert emoji_full.png -crop 2304x1152 -quality 100 emoji.webp
```

2304x1152 是单张图片的大小，显然最后一张的长度是不够 1152px 的，`imagemagick` 也没有自作主张地添加 padding，而是保留了原始长度 1080px。对比一下 Telegram 自己下载的 Sprite 图片，尺寸完全一致。接下来只需要把裁切之后的图片重命名，关闭 Telegram 并替换掉数据目录里对应的图片就好了。

![Blobmoji 小果冻](https://rocka.me/static/img/Screenshot_20190324_225253.png)