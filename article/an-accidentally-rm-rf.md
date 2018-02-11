```meta
{
	"title": "一次意外的 rm -rf",
	"date": "Sat Feb 10 2018 14:42:59 GMT+0800 (CST)",
	"tags": [ "Linux" ]
}
```

> 本事件发生于 2018 年 1 月 9 日 晚 22:27:41

我最喜欢的 Interactive Shell 是 Fish 。Fish 有个特性是自动补全命令以及目录。当你在 Fish 中输入 `~` 这个字符，按下 `Tab` 键，就会列出一系列系统中已存在用户的 home 目录来供你选择。

![Home 目录补全](https://rocka.me/static/img/Screenshot_20180210_142735.png)

有一天，强迫症 ~~闲着没事干~~ 的我感觉这个补全列表里面的东西有些多，能不能干掉几个。因为有些软件已经被我删除，但用户还留在这里（比如说 amule）。于是乎，我就：

```bash
userdel --help
```

显示了如下的信息：

```sh
Usage: userdel [options] LOGIN

Options:
  -f, --force                   force removal of files,
                                even if not owned by user
  -h, --help                    display this help message and exit
  -r, --remove                  remove home directory and mail spool
  -R, --root CHROOT_DIR         directory to chroot into
```

好嘛，那我们就来点“源力”，反正这些东西也没什么用处。

```bash
sudo userdel -rf amule
```

很不错，世界清净了不少。然后我们再来删除一些没用的东西吧。先看看有什么没用的用户：

```bash
cat /etc/passwd

root:x:0:0:root:/root:/usr/bin/fish
bin:x:1:1:bin:/bin:/usr/bin/nologin
# 此处略去 ...
polkitd:x:102:102:Policy Kit Daemon:/:/usr/bin/nologin
# 此处略去 ...
```

`polkitd` ？这啥？有什么用处？删了删了。。。。

> 我也不知道为什么要删这个可能是当时头脑短路一时冲动虽然查了一些东西但是太长不想看的结果

于是：

```bash
sudo userdel -rf polkitd
```

按下回车，`sudo` 也没问我要密码。然后就看着 KDE 的窗口边框变色了，就有些心虚。再检查一下情况？

```bash
polkitd:x:102:102:Policy Kit Daemon:/:/usr/bin/nologin
```

等一下 ... `polkitd` 的 Home 目录是 `/` ，而 `userdel --force` 的效果是删除 Home 目录里所有的文件。

也就是说，我刚刚 `rm -rf /` 了？？？

哇，大事不好。可我能怎么办呢。我，我，我居然选择了重启 ...

tty 里的输出糊了我一脸，但过了一会， SDDM 还是启动了。赶紧登录进去看看。

好像吃了一发人生重来枪，`~/Documents` `~/Download` `~/Music` `~/Pictures` `~/Softwares` 全被删空了。留给我的只有一个 `~/Workspace` ，但我的 Git 仓库基本都有远程，就算是删掉也没什么，所以这是故意的？？？

再仔细检查一下，大部分 `.` 开头的隐藏文件也没了。还好 VSCode 有设置同步插件，万幸万幸 ...

只能重新配一下桌面环境了。顺便翻翻日志：

![车祸现场](https://rocka.me/static/img/Screenshot_20180109_225604.png)

我还能说什么？

这个故事告诉我们一个道理：当你要使用带有源力（`--force`）的命令的时候，尤其是要以 `root` 用户运行的时候，请务必再三检查！
