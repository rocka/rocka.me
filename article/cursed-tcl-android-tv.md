---
title: 揭秘“太差了”智障电视
date: Wed Feb 05 2020 01:25:02 GMT+0800 (CST)
tags:
  - Android
  - 逆向
  - 笔记
---

大概 2017 年吧，家里换了一台 TCL 电视，是在本地的家电商场买的。在自带的应用商店里面下载了几个直播与视频软件，“又不是不能用”。可是最近，这台电视突然收到了几个系统更新，变成了一个智障电视。默认桌面也变得像个视频软件一样，一直卡顿，充斥着乱七八糟的推荐内容，还把常用应用隐藏到了二级菜单里面。是时候把它修理一下了。

![智障电视的默认桌面](https://rocka.me/static/img/Screenshot_2020-02-03-21-05-31.png)

## TL;DR

1. 开启 TCL 电视的 adb ，可以看下一节，不长。

2. 解除 TCL 电视的 adb/pm install 安装限制：进入 adb shell 后，使用 `tclsu` 取得 root shell ，然后执行

```shell
# setprop persist.tcl.installapk.enable 1
# setprop persist.tcl.debug.installapk 1
```

3. 给 TCL 电视安装第三方 Launcher ：进入 root shell 后，执行

```shell
# mount -o remount,rw /system
```

挂载 system 分区为可写，新建 /system/app/<应用名称> 目录，权限为 0755 ；再将 apk 文件复制到刚才的目录中，权限为 0644 。

4. TCL 电视就是智障，千万别买。

以下是正文。

## 开启 adb

如果你上网搜索“TCL 电视 adb”这个几个关键词，会发现很多所谓的“教程”。但中文互联网的魅力就在于此，大部分搜索结果都是 SEO 垃圾站对某些论坛中帖子的无署名转载，而另一部分是 SEO 垃圾站的互相转载。如果你打开一些论坛中所谓“置顶教程”，又会发现“游客，该内容只有回复后才可以浏览”。然而注册这些论坛无一不需要手机号，而新注册的用户也不一定马上就能发表回复。

经过漫无目的搜索，不断更改搜索关键词，终于找到了一个[有效的教程][1]：

- 打开电视，进入直播，选择 TV 信源
- 按遥控器上的“设置”按钮，进入显示 -> 高级设定，然后把焦点移动在“对比度”上，但不要进入
- 快速依次按下遥控器上的 `1`  `9`  `5`  `0` 数字键，稍等几秒后便会打开“Main menu/Factory”工厂模式菜单 <sup>1</sup> <sup>2</sup>
- 选择 Other -> ADB ，按下遥控器中的 OK 键将其从 OFF 改为 ON

> <sup>1</sup> 但是这个智障电视的遥控器上并没有数字键。在电视背面的 USB 接口上接一个键盘，然后按字母键盘上方的那一排数字键也可以。不要按数字小键盘，那些按键被映射为了方向键，但也许是我没打开 Number Lock ？
>
> <sup>2</sup> 有些教程中的按键顺序为 `9` `7` `3` `5`  ，虽然这样也能打开一个类似界面的菜单，但并不能启用 adb 。可能是因为型号不同？不过在这里也记录一下。

![操作图示](https://rocka.me/static/img/Screenshot_2020-02-03-21-07-31.jpg)

然后就可以连接 WiFi ADB ，并进入 adb shell 了：

```shell
$ adb connect $TV_IP_ADDR:5555
connected to xxx.xxx.xx.x:5555
```

## 手动安装 SuperSU

根据上一步找到的教程，在 adb shell 中执行 `tclsu` 便能直接得到一个 root 权限的 shell ，如果这样就结束了，那是不是有点太容易了？当然，这台智障电视并没有在这里 GG ：`tclsu` 这个文件，只有 root 用户与 shell 组是可执行的，其他用户连读权限都没有；就算复制到别的地方，并强行 chmod 777 ，也会无情的告诉你：这么简单就想当 root ？没门！

![就是不让你 root](https://rocka.me/static/img/Screenshot_2020-02-04-17-08-45.jpg)

> 上图中的应用为 Material Terminal ，使用智障电视内置的“电视卫视”从 U 盘中安装。详见下一节。

那只有再想个办法了。记得我年轻的时候，各种“一键 ROOT”还很流行。那时候各大流氓厂商，诸如 360 、百度等都推出了自家的“一键 ROOT”软件。但有一家尤为流氓，它的名字叫做 KingRoot 。用了 KingRoot ，就别再想用其它的软件接管 root 权限；卸载了 KingRoot ，也别再想用 KingRoot 以外的软件再获取 root 权限。不过当时也流传着一种干掉 KingRoot 的办法：有了 root 权限并刷入第三方 recovery 后，卸载 KingRoot ，显然它并不能把 recovery 复原。然后在第三方 recovery 中刷入 SuperSU 的 zip 文件，就能得到干净的 SuperSU 。

再看这个智障电视，它真的有 recovery 吗 ... 但既然现在已经有了 root shell ，那 SuperSU 的刷机脚本中能做到的事，这里应该也能做到 ... 顺着这个思路，下载了 [SuperSU 的卡刷包][su]，并解压出来。

```plain
.
├── LICENSE
├── META-INF
│   ├── CERT.RSA
│   ├── CERT.SF
│   ├── com
│   │   └── google
│   │       └── android
│   │           ├── update-binary
│   │           └── updater-script
│   └── MANIFEST.MF
├── common
├── arm64
│   ├── chromeos
│   │   └── futility
│   ├── libsupol.so
│   ├── su
│   ├── suinit
│   ├── sukernel
│   └── supolicy
└── ........
```

打开 [update-binary 文件][ub]，注释中详细说明了 SuperSU 正常工作所需的文件，以及安装的位置及权限。那么接下来，只要按照这个步骤，手工把所有的文件依次放好，应该就可以了 ...

这台智障电视的 CPU 是 arm64 架构，运行 Android 5.0.1 API Level 21 ，显然应该选择 arm64 子目录中的文件。然后再对照注释，找到每个文件的安装位置以及权限等信息：

<div class="table-wrapper"><table>
<thead>
<tr><th>source</th>                               <th>target</th>                            <th>chmod</th>   <th>chcon</th></tr>
</thead>
<tbody>
<tr><td>common/Superuser.apk</td>                 <td>/system/app/SuperSU/SuperSU.apk</td>   <td>0644</td>    <td>u:object_r:system_file:s0</td></tr>
<tr><td>common/install-recovery.sh</td>           <td>/system/etc/install-recovery.sh</td>   <td>0755</td>    <td>u:object_r:toolbox_exec:s0</td></tr>
<tr><td>(N/A)</td>                                <td>/system/bin/install-recovery.sh</td>   <td colspan="2">(symlink to /system/etc/install-recovery.sh)</td></tr>
<tr><td rowspan="3">su</td>                       <td>/system/xbin/su</td>                   <td>0755</td>    <td>u:object_r:system_file:s0</td></tr>
<tr>                                              <td>/system/bin/.ext/.su</td>              <td>0755</td>    <td>u:object_r:system_file:s0</td></tr>
<tr>                                              <td>/system/xbin/daemonsu</td>             <td>0755</td>    <td>u:object_r:system_file:s0</td></tr>
<tr><td>supolicy</td>                             <td>/system/xbin/supolicy</td>             <td>0755</td>    <td>u:object_r:system_file:s0</td></tr>
<tr><td>libsupol.so</td>                          <td>/system/lib64/libsupol.so</td>         <td>0644</td>    <td>u:object_r:system_file:s0</td></tr>
<tr><td rowspan="2">/system/bin/app_process64</td><td>/system/bin/app_process64_original</td><td>0755</td>    <td>u:object_r:zygote_exec:s0</td></tr>
<tr>                                              <td>/system/bin/app_process_init</td>      <td>0755</td>    <td>u:object_r:system_file:s0</td></tr>
<tr><td>(N/A)</td>                                <td>/system/bin/app_process</td>           <td colspan="2">(symlink to /system/xbin/daemonsu)</td></tr>
<tr><td>(N/A)</td>                                <td>/system/bin/app_process64</td>         <td colspan="2">(symlink to /system/xbin/daemonsu)</td></tr>
<tr><td>(new empty file)</td>                     <td>/system/etc/.installed_su_daemon</td>  <td>0644</td>    <td>u:object_r:system_file:s0</td></tr>
</tbody>
</table></div>

向系统中安装文件时，会遇到 read-only file system 的报错，重新 mount 一下就可以了。

```shell
# mount -o remount,rw /system
```

所有文件都安装到对应的位置后，再仔细检查一遍权限以及 SELinux security context 是否正确，可以用 `ls -lZ` 一并列出这些信息。这里要注意，新创建的文件，如果没有用 `chcon` 指定过任何 context ，那就是没有 ... 所以每个文件都要正确设定。检查无误后，执行

```shell
# /system/xbin/su --install
```

然后重启。如果前面的步骤没出错的话， SuperSU 应该已经安装成功，并正能常接管其他应用的 root 权限申请。

![SuperSU Pesudo Pro](https://rocka.me/static/img/Screenshot_2020-02-03-21-10-08.png)

## 解除 PackageInstaller 限制

现在有了 root 权限，但在智障电视上安装应用仍然是个问题。虽然智障电视自带了文件管理器，但并不能直接打开 apk 文件，它会说不支持。通过自带的“电视卫士”，可以安装 U 盘上的 apk 文件，但不能从内置存储安装 apk ... 怎么想都太智障了吧。通过这个方法安装的应用，如果自带更新功能，那下载完 apk 后，又可以通过 Android 标准的 软件包安装程序/PackageInstaller 升级自己。所以这个 PackageInstaller 应该是被魔改过的，只允许升级，而不允许安装新的应用。

为了验证这一点，我决定反编译一下这个智障。在 adb shell 中找到 /system/app/PacageInstaller ，发现里面除了 apk ，还有一个同名的 odex 文件。这时候就需要 [oat2dex][2] 了：

```shell
$ adb pull /system/priv-app/PackageInstaller/arm64/PackageInstaller.odex pi.odex
/system/priv-app/PackageInstaller...1 file pulled.
$ java -jar ./oat2dex.jar odex pi.odex
Output raw dex: /tmp/PackageInstaller.dex
```

使用 bytecode-viewer 打开 dex 文件，反编译 com/android/packageinstaller/PackageInstallerActivity.class ，很快找到了这一段代码：

```java
// JADX
package com.android.packageinstaller;
// ...
public class PackageInstallerActivity extends Activity implements OnCancelListener, OnClickListener {
    // ...
    public void onCreate(Bundle bundle) {
        // ...
        try {
            String str = SystemProperties.get("persist.tcl.installapk.enable", "0");
            debug("isAllowInstallUnknowApkEnable: " + str);
            if ("0".equals(str)) {
                debug("mPkgInfo.packageName: " + this.mPkgInfo.packageName);
                String callingPackageName = getCallingPackageName();
                debug("callingpackageName: " + callingPackageName);
                if (this.mPkgInfo.packageName.equals(callingPackageName)) {
                    debug("callingpackageName selfupdate: " + callingPackageName);
                } else {
                    debug("disable install apk from  unknow AppMarket ! callingPackage: " + callingPackageName);
                    finish();
                    return;
                }
            }
        } catch (Exception e2) {
            e2.printStackTrace();
        }
        if (!isInstallRequestFromUnknownSource || isInstallingUnknownAppsAllowed()) {
            initiateInstall();
            return;
        }
        // ...
    }
}
```

如果 prop 值 persist.tcl.installapk.enable 为 0 ，此时一个应用尝试通过 PackageInstaller 安装 apk ，若待安装 apk 的包名与请求安装的应用的包名不同， PackageInstaller 将直接结束 Activity ，不让安装。只有一个应用尝试安装自己的 apk ，通常是应用内置的升级，这时候才会进入正常的安装流程。

显然，要解除这个限制，只要把对应的 prop 值设置为 1 就行了。

```shell
# setprop persist.tcl.installapk.enable 1
```

这样，使用“电视卫士”安装一个文件浏览器后，就可以自由安装智障电视中存储的 apk 文件了。

## 解除 pm 限制

有必要搞那么麻烦吗？都有 adb shell 了，直接一个 adb install 不就能随便安装应用了吗？我也是这么想的，可是智障电视并不同意：

```shell
$ adb install whatever.apk
Performing Push Install
whatever.apk: 1 file pushed.
        pkg: /data/local/tmp/whatever.apk
install apk has be disabled from pm by system default!
```

这英文，无力吐槽了 ... adb install 调用的是 pm install ，看来这个 pm 也是被魔改过的。找到 pm 的可执行文件 /system/bin/pm ，它的内容是

```bash
# Script to start "pm" on the device, which has a very rudimentary
# shell.
#
base=/system
export CLASSPATH=$base/framework/pm.jar
exec app_process $base/bin com.android.commands.pm.Pm "$@"
```

取出 jar 对应的 odex 文件，并转换为 dex ：

```shell
$ adb pull /system/framework/arm64/pm.odex pm64.odex
/system/framework/arm64/pm.odex: 1 file pulled.
$ java -jar ./oat2dex.jar odex pm64.odex
Output raw dex: /tmp/pm.dex
```

然后使用 bytecode-viewer 打开。搜索刚才报错信息的字符串，一下就找到了这段代码：

```java
// JADX
package com.android.commands.pm;
// ...
public final class Pm {
    // ...
    private void runInstall() {
        // ...
        if ("1".equals(SystemProperties.get("persist.tcl.debug.installapk", "0"))) {
            debug("install apk has be enabled from pm by user!");
            LocalPackageInstallObserver localPackageInstallObserver = new LocalPackageInstallObserver(this);
            try {
                // ...
            } catch (RemoteException e2) {
                // ...
            }
        } else {
            debug("install apk has be disabled from pm by system default!");
            return;
        }
        // ...
    }
    // ...
}
```

又是一个 prop 值，persist.tcl.debug.installapk ，设置为 0 则不允许通过 pm 安装 apk 。虽然这个设定很智障，但好歹还能解除限制，那就先这样吧。

```shell
# setprop persist.tcl.debug.installapk 1
```

至此，终于能使用 pm 和 adb 自由安装 apk 了。

既然这两个软件安装限制都是由 prop 值控制的，会不会还有更有趣的东西？

```shell
$ getprop | grep tcl
[init.svc.tcl_tvservice32]: [running]
[persist.tcl.appblacklistpath]: [/data/data/com.tcl.appmarket2/shared_prefs/blacklist_data.xml]
[persist.tcl.debug.installapk]: [0]
[persist.tcl.installapk.enable]: [1]
[persist.tcl.whitelistpath]: [/data/user/0/com.tcl.appmarket2/shared_prefs/whitelist_data.xml]
[sys.com.tcl.tvweishi.lock]: [true]
[sys.com.tcl.tvweishi.unlocktime]: [1]
[tcl.cur.activity]: [ ... ]
```

居然还有黑白名单！？但当我找到那个目录时，里面已经没有这两个文件了 ... 真可惜，仿佛错过了一个大瓜。

## 智障电视就是智障电视

费了这么大劲解除了安装 apk 的限制，赶紧装个第三方 Launcher ，智障电视的默认桌面真的太智障了，又慢又丑，广告还特别多。经过一番搜索，找到一个[当贝桌面 2.3.1 去广告版][3]，准备安装。

> 分享链接来源是[这里](https://www.znds.com/tv-1134460-1-1.html)，但这篇帖子也已经被各种垃圾 SEO 站与营销号转载了很多遍，我也不确定真正的来源到底是哪里。至少上面这篇是我能找到的时间最靠前的。修改版应用的最早出处应该是[这里](https://www.znds.com/tv-1116957-1-1.html)？但原帖的楼主也说他是转载的 ...不管怎么说，向原作者表示感谢。
>
>写这篇文章时，当贝桌面 3.x 版本早已发布了，但 3.x 版本更卡，广告更多。也有一个基于 2.3.2 版本修改的，能找到的最早出处是[这里](https://www.znds.com/tv-1133339-1-1.html)，可以从[这里](https://m.ddooo.com/softdown/143584.htm)下载。但安装后，每次开机时会自己停止运行一次，这里就不做推荐了。

智障电视之所以是智障电视，是因为它是不会轻易放弃智障的！果然 adb install 的时候又出幺蛾子了：

```shell
$ adb install dbzm.apk
Performing Push Install
wdlauncher.apk: 1 file pushed.
        pkg: /data/local/tmp/dbzm.apk
install apk has be enabled from pm by user!
Failure [INSTALL_PARSE_FAILED_INCONSISTENT_CERTIFICATES]
```

证书冲突？可是智障电视根本就没有预装当贝桌面啊 ... 又尝试安装了几个其他桌面，甚至手机用的 Launcher ，均报错证书冲突。

毫无疑问，这部分肯定也被魔改过了。继续上一步的代码， runInstall 方法被省略的安装过程，是这样的：

```java
try {
    this.mPm.installPackageAsUser(nextArg, localPackageInstallObserver.getBinder(), i3, str4, new VerificationParams(uri, uri2, uri3, -1, null), str, i);
    synchronized (localPackageInstallObserver) {
        while (!localPackageInstallObserver.finished) {
            try {
                localPackageInstallObserver.wait();
            } catch (InterruptedException e) {
            }
        }
        if (localPackageInstallObserver.result == 1) {
            System.out.println("Success");
        } else {
            System.err.println("Failure [" + installFailureToString(localPackageInstallObserver) + "]");
        }
    }
    return;
} catch (RemoteException e2) {
    System.err.println(e2.toString());
    System.err.println(PM_NOT_RUNNING_ERR);
    return;
}
```

其中的 `mPm` 成员变量，是这么来的：

```java
package com.android.commands.pm;
// ...
import android.content.pm.IPackageManager;
// ...
public final class Pm {
    // ...
    IPackageManager mPm;
    public void run(String[] strArr) throws IOException, RemoteException {
        // ...
        this.mPm = IPackageManager.Stub.asInterface(ServiceManager.getService("package"));
    }
    // ...
}
```

它并没有在这里被实例化，只是一个 Service 。

再找到把错误代码转换为字符串的 installFailureToString 方法：

```java
package com.android.commands.pm;
// ...
import android.content.pm.PackageManager;
// ...
public final class Pm {
    // ...
    private String installFailureToString(LocalPackageInstallObserver localPackageInstallObserver) {
        Field[] fields;
        int i = localPackageInstallObserver.result;
        for (Field field : PackageManager.class.getFields()) {
            if (field.getType() == Integer.TYPE) {
                int modifiers = field.getModifiers();
                if ((modifiers != false && 16 != false) && (modifiers != false && 1 != false) && (modifiers != false && 8 != false)) {
                    String name = field.getName();
                    if (name.startsWith("INSTALL_FAILED_") || name.startsWith("INSTALL_PARSE_FAILED_")) {
                        try {
                            if (i == field.getInt(null)) {
                                StringBuilder sb = new StringBuilder(64);
                                sb.append(name);
                                if (localPackageInstallObserver.extraPermission != null) {
                                    sb.append(" perm=");
                                    sb.append(localPackageInstallObserver.extraPermission);
                                }
                                if (localPackageInstallObserver.extraPackage != null) {
                                    sb.append(" pkg=" + localPackageInstallObserver.extraPackage);
                                }
                                return sb.toString();
                            }
                        } catch (IllegalAccessException e) {
                        }
                    }
                }
            }
        }
        return Integer.toString(i);
    }
    // ...
}
```

取了 `PackageManager` 类的所有的 `Integer` 字段，与安装过程的 result 进行对比，如果相等，就取出字段名作为错误信息。

去翻了一下 [AOSP 的 android-5.0.1_r1][5] ，找到了错误代码的定义：

```java
package android.content.pm;
// ...
public abstract class PackageManager {
    // ...
    /**
     * Installation parse return code: this is passed to the {@link IPackageInstallObserver} by
     * {@link #installPackage(android.net.Uri, IPackageInstallObserver, int)}
     * if the parser found inconsistent certificates on the files in the .apk.
     * @hide
     */
    @SystemApi
    public static final int INSTALL_PARSE_FAILED_INCONSISTENT_CERTIFICATES = -104;
    // ...
}
```

但 `PackageManager` 是个抽象类，没有安装过程的实现。经过一番 Google ，在[爆栈网][4]上找到了相关的问题。PackageManager 代码实现的位置，在 /services/core/java/com/android/server/pm/PackageManagerService.java 。

提取智障电视的 services.odex ，然后转换为 dex ：

```shell
$ adb pull /system/framework/arm64/services.odex services.odex
/system/framework/arm64/services.odex: 1 file pulled.
$ java -jar ./oat2dex.jar odex services.odex
Output raw dex: /tmp/fw/services.dex
```

使用 `jadx-gui --show-bad-code` 启动 [jadx][jadx] ，并打开 services.dex 文件；如果不加参数， jadx 会因为出现部分错误，视整个方法为反编译失败，只能看到 smali 。然后直接搜索错误代码 `-104` ，一下就找到了这一段：

```java
public void installPackageLI(InstallArgs args, PackageInstalledInfo res) {
    boolean sigsOk;
    int installFlags = args.installFlags;
    String installerPackageName = args.installerPackageName;
    File file = new File(args.getCodePath());
    boolean forwardLocked = (installFlags & 1) != 0;
    boolean onSd = (installFlags & 8) != 0;
    boolean replace = false;
    res.returnCode = 1;
    int parseFlags = this.mDefParseFlags | 2 | (forwardLocked ? 16 : 0) | (onSd ? 32 : 0);
    PackageParser pp = new PackageParser();
    pp.setSeparateProcesses(this.mSeparateProcesses);
    pp.setDisplayMetrics(this.mMetrics);
    try {
        PackageParser.Package pkg = pp.parsePackage(file, parseFlags);
        pkg.cpuAbiOverride = args.abiOverride;
        String pkgName = pkg.packageName;
        res.name = pkgName;
        if ((pkg.applicationInfo.flags & 256) == 0 || (installFlags & 4) != 0) {
            try {
                pp.collectCertificates(pkg, parseFlags);
                pp.collectManifestDigest(pkg);
                boolean launcherApp = false;
                int N1 = pkg.activities.size();
                for (int i = 0; i < N1; i++) {
                    PackageParser.Activity ins_activity = (PackageParser.Activity) pkg.activities.get(i);
                    int N2 = ins_activity.intents.size();
                    int j = 0;
                    while (true) {
                        if (j < N2) {
                            IntentFilter ins_intent = (IntentFilter) ins_activity.intents.get(j);
                            if (ins_intent != null && ins_intent.hasAction("android.intent.action.MAIN") && ins_intent.hasCategory("android.intent.category.HOME")) {
                                Slog.d(TAG, "install the Launcher,Actvity is :" + ins_activity);
                                launcherApp = true;
                                break;
                            }
                            j++;
                        } else {
                            break;
                        }
                    }
                }
                if (launcherApp) {
                    if (!isTclLauncher(pkg)) {
                        res.setError(-104, "disable install launcher app not signature by tcl");
                        return;
                    }
                    Slog.d(TAG, "install the TCL Launcher App " + pkg.packageName);
                }
                // ...
```

稍有常识的人都能看出，这个智障电视在遍历待安装 apk 的每个 Activity ，如果其中含有提供 Launcher 的 Activity ，就判断它是否为 TCL Launcher ，这一步失败的话，就直接返回签名冲突错误！这真是何其的智障！

既然都走到这一步了，那再看一下判断 TCL Launcher 的逻辑吧：

```java
private boolean isTclLauncher(PackageParser.Package pkg) {
    PackageParser.Package tclpkg;
    if (pkg == null) {
        Slog.d(TAG, "isTclLauncher,pkg is null,so return false");
        return false;
    }
    String currentLauncher = SystemProperties.get("sys.currentlauncher");
    if (currentLauncher == null || currentLauncher.equals("")) {
        tclpkg = this.mPackages.get("com.tcl.cyberui");
        if (tclpkg == null) {
            tclpkg = this.mPackages.get("com.android.providers.settings");
            Slog.w(TAG, "fetch com.android.providers.settings signature info");
        }
    } else {
        Slog.w(TAG, "fetch signature info from :" + currentLauncher);
        tclpkg = this.mPackages.get(currentLauncher);
    }
    if (tclpkg == null) {
        Slog.e(TAG, "com.android.providers.settings not exist, disable install thirdpart launcher mechanism exception !");
        return false;
    } else if (compareSignatures(pkg.mSignatures, tclpkg.mSignatures) != 0) {
        Slog.w(TAG, "signature not match for tcl " + pkg.packageName + "will not be installed !");
        return false;
    } else {
        Slog.d(TAG, " signature check successed ! app :" + pkg.packageName);
        if (pkg.mAppMetaData != null) {
            Slog.d(TAG, "pkg.mAppMetaData != null");
            String tuivalue = pkg.mAppMetaData.getString("com.tcl.app.type");
            if (tuivalue == null) {
                Slog.w(TAG, "The installing app not support tcl ui tab !~");
                return false;
            } else if ("com.tcl.ui".equals(tuivalue)) {
                Slog.d(TAG, "TAB Check successed ,The insalling launcher app" + pkg.packageName + "will be installed !");
                return true;
            } else {
                Slog.w(TAG, "TAB Check failed,The installing launcher app is not valid ");
                return false;
            }
        } else {
            Slog.w(TAG, "The installing app not support tcl ui tab  !");
            return false;
        }
    }
}
```

先读取 prop 值 sys.currentlauncher ，如果读不到就 fallback 到“公司.太差了.赛博用户界面”，如果还是没有，再次 fallback 到 com.android.providers.settings ，如果还是没有，就直接禁止安装 Launcher ！

那如何才能跟随历史的进程，通过智障电视的研究决定，成为认证的“赛博用户界面”呢？也没有什么别的，大概三件事：一个，签名要一致；第二个，要包含 com.tcl.app.type 这项 MetaData ；第三个， MetaData 的值必须是 com.tcl.ui 。~~什么？你说还有一点？没了没了 ...~~

看来，这还是一个有底线的智障电视，绝对不会让人通过正常的方式安装 Launcher 。如果连这个底线都突破了，那还算什么智障电视！

## 安装第三方 Launcher 为系统应用

所以到底怎么才能强行安装第三方 Launcher 呢？根据前面安装 SuperSU 的过程，也很简单：在 /system/app 中创建一个新目录，权限为 755 ；再把 apk 复制到刚才的目录里，权限为 644 ；然后 `chcon` 为 u:object_r:system_file:s0 ；最后重启；就完事了 ...

## 后记

折腾这个智障电视，花了接近一天半的时间；而写这篇文章，又花了整整一晚上的时间。

千万不要买“太差了”牌智障电视，听名字就是个坑。

我好像也学会一点逆向了？好像还挺有意思的 ...

---

## 参考

1. https://blog.fyun.org/tcl-root.html
2. https://github.com/zyonbao/Brevent/blob/a9e6ee9e681735c51f5a49247c101bf09ea412f8/aosp/README.md
3. https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-5.0.1_r1
4. https://stackoverflow.com/a/43390073
5. [https://www.hmoegirl.com/蛤三篇#原文_2](https://www.hmoegirl.com/%E8%9B%A4%E4%B8%89%E7%AF%87#%E5%8E%9F%E6%96%87_2)

[1]: https://blog.fyun.org/tcl-root.html
[su]: https://download.chainfire.eu/supersu
[ub]: https://rocka.me/static/file/cursed-android-tv/update-binary.txt
[2]: https://github.com/testwhat/SmaliEx/releases/tag/0.86
[3]: https://www.lanzous.com/i2z7ywf
[4]: https://stackoverflow.com/a/56646488/8370777
[5]: https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-5.0.1_r1/core/java/android/content/pm/PackageManager.java
[jadx]: https://github.com/skylot/jadx
