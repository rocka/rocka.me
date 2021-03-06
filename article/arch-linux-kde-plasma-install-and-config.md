```meta
{
    "title": "Arch Linux & KDE Plasma 配置笔记",
    "date": "Fri Jun 23 2017 14:11:18 GMT+0800 (CST)",
    "tags": [ "Linux" ]
}
```

换了新电脑之后，便入了 Arch Linux 的深坑。一开始是三天两头换桌面环境，还尝试使用 Unity for Arch ，最后还是停在了 KDE Plasma 。因为听说（真的是道听途说） f2fs 对固态硬盘很友好，便尝试在根文件系统上使用 f2fs 。但没有比较，也感觉不出来系统有多快，反而遇到很多坑 ... 装系统和日常使用的时候都有。比如系统启动的时候突然闪出一个 `[FAILED]` ，关机的时候半天关不掉（这里似乎忘了提示信息是什么了，反正是一个 1min 30s 的正计时，但时间到了以后又会顺延 1min 30s ，有时能到二十几分钟 ... ），Chrome 三天两头提示个人配置文件已损坏，但重启电脑又接着恢复 ... 等一系列坑爹的问题。一忍再忍，终于忍无可忍，但这时候就要期末考试了，所以只能继续忍下去。现在期末考试终于结束了，可以愉快的重装系统了！

首先是备份，直接把 `/home` 打成 tar 包复制到固态最后面一块刚划出来的分区里面备用。然后进入 LiveCD ，把 f2fs 分区干掉，换成 ext4 。这里又想吐槽一次了，f2fs 居然不支持分区移动和收缩，要拓展分区只能用 `resize.f2fs`，`parted` 也是拿他没什么办法。

> arch-chroot 分割线

先安装基本的软件包，当然少不了 fish shell 了！

```bash
pacman -S sudo fish git vim zsh nodejs npm shadowsocks-libev proxychains
```

在 Arch Wiki 的 KDE 安装环节，只提到了安装 `kde-applications` 软件包组或 `kde-applications-meta` 包。但这样会搞出很多没用的包，比如各种游戏，莫名奇妙的化学工具，“KDE 元素周期表”等等 ... 需要酌情做一些精简。

```bash
pacman -S xorg xorg-server plasma dolphin kate kdialog konsole kfind dragon ffmpegthumbs kde-meta-kdeadmin kde-meta-kdeutils kde-meta-kdegraphics sddm sddm-kcm
```

然后是一些驱动，之前一直没有安装 Intel 的显卡驱动，还以为是优化不好 ...

```bash
pacman -S xf86-input-libinput mesa xf86-video-intel vulkan-intel
```

安装 GRUB ，还是稍微贴一下吧：

```bash
pacman -S grub efibootmgr
grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=grub
```

如果要与 Windows 共存的话，还需要安装 `os-prober` ，以便 GRUB 自动添加 Windows Boot Mgr 到引导。

然后生成 GRUB 配置文件：

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

如果要在 GRUB 中添加自定义的启动项，比如 关机 / 进入 EFI 固件设置等，可以：

```bash
vim /etc/grub.d/40_custom
# add
menuentry "EFI Firmware Setup" {
    fwsetup
}

menuentry "Shutdown" {
    echo "System shutting down..."
    halt
}
```

然后重新生成 GRUB 主配置文件。

在 `mkinitcpio` 之前，需要先添加 `nvme` 模块。

```bash
vim /etc/mkinitcpio.conf
# change
# MODULES=""
# to
# MODULES="nvme"
mkinitcpio -p linux
```

调整 sddm 的 DPI

```bash
vim /etc/sddm.conf
# find
#
# [X11]
# ServerArguments=-nolisten tcp
#
# add arugment "-dpi 210"
# ServerArguments=-nolisten tcp -dpi 210
```

在 sddm 中启用 “触控板轻触点击”

```bash
vim /etc/X11/xorg.conf.d/20-touchpad.conf
# add
Section "InputClass"
        Identifier "libinput touchpad catchall"
        MatchIsTouchpad "on"
        MatchDevicePath "/dev/input/event*"
        Driver "libinput"

        Option "Tapping" "on"
        Option "NaturalScrolling" "on"
        Option "MiddleEmulation" "on"
        Option "DisableWhileTyping" "on"
EndSection
```

然后是一些乱七八糟的配置项：

```bash
# 语言和时区
vim /etc/locale.gen
locale-gen
echo LANG=en_US.UTF-8 > /etc/locale.conf
tzselect

# 硬件时钟同步
hwclock --systohc --utc

# root 密码
passwd

# 添加用户
useradd -m -G wheel,users -s /usr/bin/fish rocka
passwd rocka

# 把自己加入 sudoers
EDITOR=vim visudo

# 主机名
echo  quad > /etc/hostname

# 启动各种服务
systemctl enable sddm
systemctl enable NetworkManager
systemctl enable shadowsocks-libev
```

现在差不多了，把之前的 `/home` 目录复制回来，解压，重启开机，桌面环境基本继承下来了，接下来就是安装一些桌面插件和软件。

首先是 `archlinuxcn` 源，ustc 镜像一份。

```bash
sudo vim /etc/pacman.conf
# add
[archlinuxcn]
Server = https://mirrors.ustc.edu.cn/archlinuxcn/$arch
```

一大波常用软件，桌面插件，字体等

```bash
sudo pacman -Syyu archlinuxcn-keyring
sudo pacman -S yaourt
yaourt -S plasma5-applets-applets-active-window-control \
          plasma5-applets-applets-redshift-control \
          noto-fonts \
          noto-fonts-cjk \
          noto-fonts-emoji \
          wqy-microhei \
          wqy-micorhei-lite \
          wqy-zenhei \
          consolas-font \
          ttf-droid-sans-mono-slashed-powerline-git \
          ttf-monaco \
          google-chrome \
          firefox-kde-opensuse \
          libinput-gestures \
          visual-studio-code \
          sublime-text-dev-imfix \
          teltegram-desktop-systemqt-notoemoji \
          typora \
          kdeconnect \
          wps-office \
          ttf-wps-fonts \
          gparted
```

大部分东西的配置文件，我放到了 [这个仓库](https://github.com/rocket1184/dotfiles) ，这里就不再赘述。

最后再说一个比较蛋疼的地方吧。在 HiDPI 的 Plasma 桌面中，大部分地方是可以正确缩放的，但 `System Tray` 这个 Plasmoid 中的托盘图标没法正确缩放。这时就需要修改一个配置文件：

```bash
vim ~/.config/plasma-org.kde.plasma.desktop-appletsrc
# find
#
# [Containments][20][General]
# extraItems= ...
# hiddenItems= ..
# knownItems= ...
# shownItems= ...
#
# add
# iconSize=2
```

然后注销，再登录，托盘图标大小就正常了。

最后的最后，附图一张：

![screenfetch](https://rocka.me/static/img/877509-20170623153259820-416895378.png)
