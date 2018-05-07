```meta
{
    "title": "在 KDE 中使用 KWallet 自动解锁 SSH 密钥",
    "date": "Thu Mar 16 2017 00:21:33 GMT+0800 (CST)",
    "tags": [ "Linux" ]
}
```

一开始用 Ubuntu 的时候，创建过一个 SSH 密钥，然后 Unity 很贴心的帮忙勾选上了“每次登录时自动解锁此密钥”，惯得我差点把密码给忘了。前一段时间把所有 Git 仓库的远程 URL 都换成了 SSH，感觉好像快一点，但每次都输入密码很是烦人。虽然 WebStorm 可以在同步更改时选择保存密码，不过关掉以后还得输入。那就随便折腾一下这个 KWallet 吧。

大部分的内容都参考自 Arch Wiki ：

1. [KDE Wallet](https://wiki.archlinux.org/index.php/KDE_Wallet#Using_the_KDE_Wallet_to_store_ssh_keys)
2. [SSH Keys](https://wiki.archlinux.org/index.php/SSH_keys#ssh-agent)
3. [systemd/user](https://wiki.archlinux.org/index.php/Systemd/User)

## 1 安装必要的软件包

首先要安装的肯定是`openssh`。然后还要一个输密码的 GUI ，即`ksshaskpass`：

```bash
sudo pacman -S openssh ksshaskpass
```

## 2 设置 ssh-agent 服务

新建文件 `~/.config/systemd/user/ssh-agent.service`

```ini
[Unit]
Description=SSH key agent

[Service]
Type=forking
Environment=SSH_AUTH_SOCK=%t/ssh-agent.socket
ExecStart=/usr/bin/ssh-agent -a $SSH_AUTH_SOCK

[Install]
WantedBy=default.target
```

然后启用这个服务

```bash
systemctl --user enable ssh-agent.service
```

## 3 用户登录时自动 ssh-add

新建文件`~/.config/autostart-scripts/ssh-add.sh`

```bash
#!/bin/sh
ssh-add < /dev/null
```

然后不要忘了 **添加执行权限**。如果要添加多个密钥，可以给 `ssh-add` 追加参数指定密钥文件。默认加入的是`~/.ssh/id_rsa`

## 4 设置环境变量

wiki上说要放到`.bash_profile`里面，不过我直接扔到了`.xprofile`

```bash
export SSH_AUTH_SOCK="$XDG_RUNTIME_DIR/ssh-agent.socket"
export SSH_ASKPASS="/usr/bin/ksshaskpass"
```

## 5 完工

搞好这些之后，注销重新登录，就会看见`ksshaskpass`在弹窗要求你输入密钥了。允许保存密码之后，注销或重启都不需要再输入密码。 不过前提是 KWallet 需要[登录时自动解锁](https://wiki.archlinux.org/index.php/KDE_Wallet#Unlock_KDE_Wallet_automatically_on_login)。这个配置起来比较简单，这里就不复制粘贴了。

![ksshaskpass](https://rocka.me/static/img/877509-20170316005016807-1925666694.png)
