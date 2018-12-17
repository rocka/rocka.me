---
title: 在 Arch Linux 中安装 WordPress
date: Sun Dec 16 2018 17:35:30 GMT+0800 (CST)
tags:
  - Linux
  - 笔记
---

现在的博客程序用着挺好的，为什么去折腾 WordPress ？此中有很深刻的原因，而且我也没准备更换博客系统。不过还是踩了一些坑，得记录下来。

<!-- more -->

首先，安装必要的软件包

```sh
sudo pacman -S nginx-mainline php-fpm
```

为什么没装数据库呢？数据库扔到 Docker 里面了。既然这样，那为什么不连 WordPress 一起放在 Docker 里面呢？其实一开始就是放在 Docker 里面的，不过官方的镜像实在是太大了，虽然官方有提供基于 Alpine Linux 的镜像，但只暴露了 fpm 的端口，用 nginx 提供静态文件服务的时候有权限问题 ... 反正就是不好用。至于数据库，我没有什么数据库的管理经验，只知道如果把数据卷挂载出来的话迁移是很方便的，那就这样吧 ...

然后启用这两个服务：

```sh
sudo systemctl enable --now nginx
sudo systemctl enable --now php-fpm
```

配置一下 `php` ：

```sh
sudo vim /etc/php/php.ini
# modify
max_execution_time=300
memory_limit=256M
post_max_size=100M
upload_max_file_size=100M
# append
extension=mysqli
extension=pdo_mysql
```

如果不启用后面这两个， WordPress 就会因为找不到 `mysql_connect()` 而报错：

```accesslog
[error] 20788#20788: *20 FastCGI sent in stderr: "PHP message: PHP Fatal error:  Uncaught Error: Call to undefined function mysql_connect() in /srv/wordpress/wp-includes/wp-db.php:1564
Stack trace:
#0 /srv/wordpress/wp-includes/wp-db.php(592): wpdb->db_connect()
#1 /srv/wordpress/wp-includes/load.php(409): wpdb->__construct('user', 'pwd...', 'db_name', 'host')
#2 /srv/wordpress/wp-settings.php(106): require_wp_db()
#3 /srv/wordpress/wp-config.php(95): require_once('/srv/wordp...')
#4 /srv/wordpress/wp-load.php(37): require_once('/srv/wordp...')
#5 /srv/wordpress/wp-blog-header.php(13): require_once('/srv/wordp...')
#6 /srv/wordpress/index.php(17): require('/srv/wordp...')
#7 {main}
  thrown in /srv/wordpress/wp-includes/wp-db.php on line 1564" while reading response header from upstream...
```

胡乱搜索了半天都没搞懂是怎么回事，最后随便翻了一下 Arch Wiki ，果然有[问题](https://wiki.archlinux.org/index.php/PHP#MySQL/MariaDB) ...

然后下载 WordPress 并解压：

```sh
cd /srv/
curl -Lo wp.tgz https://wordpress.org/latest.tar.gz
tar zxf wp.tgz
sudo chown -R http:http /srv/wordpress
```

这样最新版的 WordPress 就已经安装到 `/srv/wordpress` 了。虽然 Arch 的 commnuity 仓库里面有 `wordpress` 这个包，但根据 [Wiki](https://wiki.archlinux.org/index.php/Wordpress#Installation_using_pacman) ，如果使用 pacman 安装的话，是无法在后台管理面板更新或安装插件的。所以这里选择手动安装。然后不要忘了把所有文件的所有者设置成 `http` ，因为 `php-fpm` 是以这个用户运行的，这样可以很方便的安装插件和升级。

好了，现在配置 `nginx` ：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name SERVER_NAME;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 http2;
    listen [::]:443 http2;
    server_name SERVER_NAME;

    include /srv/ssl/SERVER_NAME.conf;
    client_max_body_size 100M;
    root /srv/wordpress;
    index index.php index.html index.htm;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include fastcgi.conf;
        fastcgi_pass unix:/run/php-fpm/php-fpm.sock;
    }
}
```

对了，为什么最大请求大小设为 100M 呢？因为 [CloudFlare 免费版的限制](https://support.cloudflare.com/hc/en-us/articles/201303340-How-can-I-change-the-client-maximum-upload-size-)是 100M ...

终于开始配置 WordPress 自己了 ...

```sh
sudo cp wp-config-sample.php wp-config.php
sudo vim wp-config.php
```

填一下数据库的端口和凭据，以及脸滚键盘填上几个 Key 和 Salt ，然后访问配置好的域名，应该就可以进入安装程序了。

![WordPress 语言选择界面](https://rocka.me/static/img/Screenshot_20181217_185916.png)

如果第一次访问时的界面不是语言选择界面，那可能需要检查一下当前运行的 `php` 进程是否有权写入 `wordpress` 目录。无权写入的话，很多事情都会变得更麻烦：升级、安装插件和语言包等。
