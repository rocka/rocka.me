```meta
{
    "title": "微信开发者工具 在 Linux 中的使用与吐槽",
    "date": "Thu Aug 31 2017 11:32:02 GMT+0800 (CST)",
    "tags": [ "Linux" ]
}
```

听说微信开发者工具更新了，啊不，不是听说，其实是在某挨踢之家看到的 [一篇文章](https://www.ithome.com/html/it/323782.htm) ，出于好奇，就进去看了一下。发现下载页面只提供了 Win32/64 以及 macOS 的下载。真抠门啊，不给个 Linux 版的。我猜这个“开发者工具”是用 Electron 驱动的，于是下载了一个 macOS 版的准备看看。

下载下来是个 dmg ，可以用 `7z x file.dmg` 直接解包。这是解包之后的目录结构：

```bash
微信web开发者工具
├── Applications
├── .background
│   └── dmg-background.tiff
├── .DS_Store
├── [HFS+ Private Data]
├── .HFS+ Private Directory Data\015
├── .VolumeIcon.icns
└── wechatwebdevtools.app
    └── Contents
        ├── _CodeSignature
        ├── Info.plist
        ├── MacOS
        ├── PkgInfo
        ├── Resources
        └── Versions
```

打开 wechatwebdevtools.app/Contents/Resources ，里面出现了 app.nw 这个文件夹，原来用的是 nw.js 。继续进入，果然有 node_modules 以及 package.json 。然后进入 node_modules 看一下，发现了 react ， react-dom ， react-redux ........ 以及一大堆的 babel 插件。从 stage-0 到 stage-3 ，babel-register ， babel-minify 一应俱全。在打包的时候就不能把这些 devDeps 给删掉吗？？？

暂停一下，继续来看看能不能运行。

AUR 里面装一个 nwjs-bin 就行了。然后 cd 到 app.nw 运行

```console
$ nw .
```

然后 ... 就这么跑起来了 ...

![扫码登录](https://rocka.me/static/img/Screenshot_20170831_120245.png)

行吧，然后微信扫码登录，选择小程序项目，新建一个没有 AppID 的测试项目，就进入主界面了。看起来还挺不错的，别误会，我说的主要是右边的 Monaco Editor （笑

![IDE 界面 & 设置窗口](https://rocka.me/static/img/Screenshot_20170831_112045.png)

各种窗体控件都是 macOS 风格，毫无疑问是用 CSS 画出来的。其实还是有那么一点好看的 （

![确认保存的对话框](https://rocka.me/static/img/Screenshot_20170831_112121.png)

很自然的，我就以为 Windows 版的开发者工具会是 Windows 风格。下载 exe 安装包然后用 7z 解包，出来的是一毛一样的界面。啊，还是太高估腾讯了，就连 Android 版的微信都是与 iOS 一样的，何况这个开发者工具呢？还是图样图森破了。

既然这个开发者工具是包装在浏览器里的，为什么不给 Linux 平台提供一个二进制包？腾讯系的大部分产品都对 Linux 平台视而不见，这个开发者工具不提供 Linux 平台的版本也是意料之中吧。但“开发者工具”面向的是“开发者”诶，使用 Linux 的前端开发者的数量 ... 似乎并不多。

嘛，毕竟熟悉 Linux 的开发者完成上面那一套操作肯定是小菜一碟了，他们都会自己折腾的。

~~啊，赶在八月结束之前又水了一片文章呢~~

> 本文在撰写时，使用的微信开发者工具版本号为 1.00.170830
