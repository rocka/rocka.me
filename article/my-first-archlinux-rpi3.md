```meta
{
    "title": "我的第一台 Arch Linux 设备居然是树莓派",
    "date": "Dec 2 2016 01:12:19 GMT+0800",
    "tags": [ "Linux", "树莓派" ]
}
```

上学期实验室买了几个树莓派，到手之后装上 Ubuntu Mate 15.10 试玩了一番，给人的感觉并不是特别的酷。。。后来因为期末考试等各种原因，就只能一直待在橱子里面吃灰。但在这学期的开始，我们决定以物联网为主要发展方向，感觉树莓派无论是用作传感器数据采集还是数据汇总的小型服务器都是不错的选择，当然要利用起来了。

至于为何选择 Arch Linux ，只能说，额，没用过，比较新鲜吧。寨板一直在用 Ubuntu ，VPS 上跑的也是，用久了总归是有些腻味了。~~那些大法，邪教什么的，我可都没听说过~~

## 1 硬件准备

当然，要有一台树莓派。。。我这里用的具体型号是 `Raspberry Pi 3 Model B`。

Micro SD 卡一张，如果只用纯命令行界面的话 4GB 应该足够了，如果要安装图形界面的话需要大一些。然而 Arch Linux ARM 不自带图形界面。我这里用的是 32GB Class10 。

然后要有读卡器，网线（刚装好的系统只能用 ssh 连接），还有需要注意的一点是一定要买一个可以输出 5V2.5A 的 USB 适配器。否则用 ssh 连接的时候会出现莫名奇妙的 `Connection Refused`。

## 2 烧录系统

在 Arch Linux ARM 的支持仓库里面，可以找到[系统镜像以及很详细的烧录教程](https://archlinuxarm.org/platforms/armv8/broadcom/raspberry-pi-3)，我就不复制粘贴了。烧完之后把卡插到树莓派的卡槽里面，通电插网线，然后要去**路由器的管理页面**查看系统分配给树莓派的 ip 地址，设备名是 `alarmpi` 。然后 ssh 连接，用户名和密码都是 `alarm` 。

## 3 简单配置

第一次玩 Arch Linux ，当然要做个笔记方便以后参考。

首先切换到 `root` 用户，更新一下系统，安装常用软件包：

```shell
su root
pacman -Syu
pacman -S sudo git zsh vim
```

然后编辑文件 `/etc/sudoers.d/myOverrides`，添加以下内容，把用户 `alarm` 加入`sudoers`列表：

```shell
alarm  ALL=NOPASSWD: ALL
```

切回 `alarm`，然后可以随便装个 `screenfetch`，截图留念一下了：

![screenfetch](https://rocka.me/static/img/877509-20170425164601647-7619907.png)

## 4 用命令行连接 WiFi 网络

实验室的路由器放在隔壁老师办公室，如果只能连有线网的话操作会很不方便~~其实主要是怕老师吧~~。

要用到的工具有 `wpa_supplicant` 和 `wpa_cli`。如果没有的话，为什么不问问 `pacman` 呢 `:)`。

首先要为 `wpa_supplicant` 准备一个配置文件。我把它放在了 `/etc/wpa_supplicant/alarm.conf`：

```shell
ctrl_interface=/run/wpa_supplicant
update_config=1
```

然后用刚才的配置文件启动 `wpa_supplicant`：

```shell
sudo wpa_supplicant -B -D nl80211 -i wlan0 -c /etc/wpa_supplicant/alarm.conf
```

其中 `-B` 指定后台运行，`-D` 指定驱动类别，`-i` 指定网络设备。~~反正RPi3这样写就对了~~

然后进入 `wpa_cli` 的交互式界面：

```shell
sudo wpa_cli -i wlan0
```

扫描网络：

```shell
> scan
```

列出扫描结果：

```shell
> scan_result
```

添加网络配置：

```shell
> add_network
0
> set_network 0 ssid "SSID_Here"
OK
> set_network 0 psk "WiFi_Key_Here"
OK
> set_network 0 key_mgmt WPA-PSK
OK
```

`add_network` 的输出是刚刚添加的网络配置的编号。最后一句是设置网络解密方式，一般都是 "WPA-PSK"，注意是横杠 `-` 不是下划线。如果有 WEP 什么的，自己去 `man wpa_cli` 吧。

之后连接网络，保存配置到文件：

```shell
> enable_network 0
OK
> save_config
OK
```

到这里就完成一半了，可以用 `iwconfig` 看一下网卡信息。然后输入 `quit` 退出 `wpa_cli` ，之后还要手动启动 DHCP 获取 IP 地址：

```shell
sudo dhcpcd wlan0
```

如果没什么输出的话，一般来说就可以使用无线网络了。不过还是要看一下是不是真的获取到了 IP ：

```shell
ifconfig wlan0
```

如果有看到 `inet addr` ，说明已经正确获取 IP 地址了。如果现在看看刚才指定的配置文件，应该差不多是这样的：

```ini
ctrl_interface=/run/wpa_supplicant
update_config=1

network={
    ssid="SSID_Here"
    psk="WiFi_Key_Here"
    priority=1
}
```

为了方便之后操作，可以写个自动连接并获取 IP 的脚本 `connect.sh`：

```shell
#!/bin/sh
wpa_supplicant -B -D nl80211 -i wlan0 -c /etc/wpa_supplicant/alarm.conf
dhcpcd wlan0
exit 0
```

以后直接运行就可以了。哦，还有，别忘了加可执行权限。

```shell
sudo chmod 775 /home/alarm/wlan/connect.sh
```

## 5 配置开机启动脚本

WiFi 算是连接好了，如果断开了怎么重新连接？如果要连 WiFi ，要跑脚本；跑脚本要先连 ssh ；ssh 要先联网，但如果已经连上网了，我连 WiFi 干什么？？？似乎构成了循环依赖。 心累 =。=

所以还是琢磨着搞一个开机启动脚本。然而 Arch Linux 似乎没有 `/etc/rc.local` 这个东西，幸好我在[这里](https://bbs.archlinux.org/viewtopic.php?id=148170)搜到了可以利用系统服务来开机启动脚本的教程，魔改一下还是可以用的。

首先创建文件：

```shell
sudo touch /usr/lib/systemd/system/rc.local.service
```

内容是这样的：

```ini
[Unit]
Description=/etc/rc.local Compatibility

[Service]
Type=oneshot
ExecStart=-/etc/rc.local
TimeoutSec=0
StandardInput=tty
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

 这里参考了上面的教程，以及这个 [systemd.service](https://www.freedesktop.org/software/systemd/man/systemd.service.html) 的文件语法。

如果在 `[Unit]` 块中显式声明 `After=xxx` ，这个服务就会在系统初始化到某一阶段后才执行。比如设置 `After=network.target` 会使得脚本在系统有网络后才执行。这里我们要的是系统启动自动联网，当然要去掉了。不过对于没有显式声明 `After=` 、`Require=` 并且 `DefaultDependencies=` 没有设置为 `false` 的服务项，系统会自动添加依赖 `After=sysint.target` ，来保证脚本运行时系统已初始化完毕。

然后就是新建文件 `/etc/rc.local` ：

```shell
#!/bin/sh
/home/alarm/wlan/connect.sh
exit 0
```

其实完全可以把刚才服务中的 `ExecStart` 字段设置为想要运行的脚本位置，再然后，一个服务也可以设置多个 `ExecStart` 字段。为什么要这样写呢？大概是为了与其他发行版一致吧。

同样，不要忘记可执行权限。之后通过 `systemctl` 启动服务：

```shell
sudo chmod 775 /etc/rc.local
sudo systemctl enable rc.local.service
```

然后重启试试。不出意外的话，通电不到一分钟就可以连接无线网络了。

## 6 安装蓝牙驱动

作为一个物联网设置，怎么能没有蓝牙呢。不过 Arch Linux ARM 没有包含 RPi3B 的蓝牙驱动，需要自行从 AUR 下载源码编译；而从 AUR 下载源码的工具 `yaourt` 需要从 Git 克隆源码进行编译；但编译 `yaourt` 时又依赖一些软件包，所以第一步应该先安装这些：

```shell
sudo pacman -S packer pkg-config fakeroot patch
```

然后克隆源码并编译安装 `yaourt` ：[参考链接点我](https://archlinux.fr/yaourt-en)

```shell
cd ~
git clone https://aur.archlinux.org/package-query.git
cd package-query
makepkg -si
cd ..
git clone https://aur.archlinux.org/yaourt.git
cd yaourt
makepkg -si
```

然后各种确认，应该就能装好了。之后去下载蓝牙驱动的源码：[参考链接点我](https://archlinuxarm.org/forum/viewtopic.php?f=67&t=10017)

```shell
yaourt -S pi-bluetooth
sudo systemctl enable brcm43438.service
```

会自动进行编译安装，然后启动服务，重启就可以发现蓝牙已经被驱动了。
