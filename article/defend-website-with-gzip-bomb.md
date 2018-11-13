```meta
{
    "title": "使用 GZip Bomb 对抗站点扫描工具",
    "date": "Tue Nov 13 2018 20:28:11 GMT+0800 (CST)",
    "tags": [ "Linux" ]
}
```

如果你翻看过公网 `nginx` 服务器的 `access.log` 的话，一定会发现很多尝试搞你的人。比如：

```log
47.52.119.128 - - [12/Nov/2018:15:47:22 +0800] "POST /wp-admins.php HTTP/1.1" 404 153 "-" "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:59.0) Gecko/20100101 Firefox/59.0"
92.154.49.175 - - [12/Nov/2018:17:37:39 +0800] "GET /mysql/admin/index.php?lang=en HTTP/1.1" 404 555 "-" "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
14.141.146.139 - - [13/Nov/2018:02:25:17 +0800] "POST /qq.php HTTP/1.1" 405 157 "-" "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0"
63.146.211.234 - - [13/Nov/2018:05:43:50 +0800] "POST / HTTP/1.1" 405 157 "-" "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko"
```

诸如此类，懒得给这些 IP 打码了。这些类似的请求一次少说也有上百个，弄得 Nginx 的日志里面红红一片。其实一开始是懒得搭理这些东西的，毕竟对我来说也没什么损失，大不了跑点流量，反正国外辣鸡主机流量跟不要钱似的。

趁着双 11 ，剁手入了一台辣鸡主机， 2C2G 的配置看起来很是豪华。但才刚跑完 [vps2arch][1] 和 [初始化脚本][2] ，就发现已经有人摸到我的 IP 开始扫描奇怪的东西了。这怎么能忍？于是我决定搞点防御措施，至少要让那些只会用工具扫描的 Script Boy 们吃点苦头。

<!-- more -->

原材料只需要一个 `nginx` ，用到的工具有 `dd` ， `gzip` ，编辑器酌情选用。当然如果硬要在本地编辑好再 `scp` 到服务器上我也没法拦着你。（笑

首先弄个炸弹出来。

```sh
dd if=/dev/zero bs=1M count=10240 | gzip > /tmp/bomb
```

这个炸弹的体积只有 10MB ，可以说是非常环保了。~~（雾~~

然后找个安全空旷的平地，把炸弹引爆。 ~~（大雾~~

啊不对，是找个安全空旷的文件夹，把 bomb 这个文件放在里面。随便放那都行，前提是 `nginx` 进程要有权限读取。

然后改一下 `nginx` 的默认配置文件 ~~准备引爆~~ 。 Arch 里面直接改

```sh
/etc/nginx/nginx.conf
```

就完事了， Debian 系系统里面一般是

```sh
/etc/nginx/sites-available/default
```

总之找到 `server` 块 的 `listen` 指令含有 `default` 的那个文件，改它就对了。更改的内容也不多：

```nginx
server {
    listen 80 default;

    root /usr/share/nginx/html;

    location = / {
        index index.html;
    }

    location / {
        try_files $uri /bomb;
    }

    location = /bomb {
        default_type text/html;
        add_header Content-Encoding gzip;
        root /srv/http/gzip_bomb;
    }
}
```

使用 `location = /` 的目的，是将对根目录的访问重定向到 `index.html` ，让这个炸弹看起来“人畜无害” 。

`/usr/share/nginx/html` 是默认站点的位置，里面一般只含有 `index.html` 一个文件。访问这个目录里面存在的位置，不会触发引爆。

`/srv/http/gzip_bomb` 就是弹药库，里面 ~~只有一发~~ 只包含 `bomb` 一个文件，任何**未经允许**的访问都会被重定向到炸弹，然后引爆访问者的浏览器。

这里对 “未经允许” 的定义，是 “未配置 `server_name` ，且路径不为 `/` 或 `/index.html` ”。

在 Nginx 无法判断目标文件的 MIME 时，就会使用 `default_type` 中声明的 `Content-Type：text/html` ，再配合 `Content-Encoding： gzip` ，指导浏览器解开 gzip ，慢慢吃光所有内存，然后一步一步走向死亡的深渊。（笑

好奇心强的同学可以试着点一下 [这个链接][3] ，即可引爆炸弹！后果自负哦，可不要说我没有警告过你 ...

不过，用这个来当作手机上的 “内存清理大师” 还是挺有用的，除了浏览器，瞬间所有进程都被杀光了呢。（笑

![Chromium 正在吃光所有内存](https://rocka.me/static/img/Screenshot_20181113_212002.png)

## 战果

才部署不到一天，就有两个小朋友上钩了：

```
37.6.220.34 - - [13/Nov/2018:16:30:52 +0800] "GET /386232A170CF1A2A45210C23A3645E0C.php HTTP/1.1" 200 10420385 "-" "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
37.6.220.34 - - [13/Nov/2018:16:30:59 +0800] "GET /mysql/admin/index.php?lang=en HTTP/1.1" 200 10420385 "-" "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"

97.117.89.122 - - [13/Nov/2018:20:31:23 +0800] "GET /386232A170CF1A2A45210C23A3645E0C.php HTTP/1.1" 200 10420385 "-" "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
97.117.89.122 - - [13/Nov/2018:20:31:33 +0800] "GET /mysql/admin/index.php?lang=en HTTP/1.1" 200 10420385 "-" "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
```

而且好像还是用的同一种扫描工具？这两个小朋友吃下两颗炸弹之后，就一起安安静静了，没有发出一点声音 ~~一家人就是要整整齐齐~~ 。而根据以前的 log ，这种工具似乎能连续发起几十个请求，并且全与 SQL Admin 相关。

---

## 参考

1. https://blog.haschek.at/2017/how-to-defend-your-website-with-zip-bombs.html
2. http://nginx.org/en/docs/http/ngx_http_core_module.html#try_files

[1]: https://gitlab.com/drizzt/vps2arch/
[2]: https://gist.github.com/rocka/d00d5c49c7ecfd1c658dc08c1bb0a0eb
[3]: https://rocka.me/static/bomb
