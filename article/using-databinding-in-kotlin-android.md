```meta
{
    "title": "在 Kotlin 中使用 Andorid 的 DataBinding",
    "date": "Thu May 18 2017 20:25:25 GMT+0800 (CST)",
    "tags": [ "Android", "Kotlin" ]
}
```

写教程之前，先闲扯点别的。昨天的 Google I/O 大会上，Google [钦点了 Kotlin](https://blog.jetbrains.com/kotlin/2017/05/kotlin-on-android-now-official/) 作为开发 Android 的官方语言，据说此言一出，台下开发者立即掌声雷动， ~~我没看直播所以只是听说~~ 大概是天下苦 Oracle 久矣，Java 太辣鸡还天天想着抢钱。最近要组队搞某创新创业大赛，Android 端由我来负责，我终于也要开始写原生 Android 应用了呢，想想就有些激动。早就听说 JetBrains 的 Kotlin ，因为之前不用 Java 所以也没太在意，只是听说语法甜甜的。之前一直被灌输一些 Java 辣鸡的言论，而且身边有些 Java 使用者也这么认同了，当然不否认 Java 9 加入了很多新东西就是了。但如果让被 JS 惯坏了的我去写 Java ，我肯定是拒绝的，于是就开始学 Kotlin 了呗～

上学期，我接触了第一个前端框架 Vue.js 。当时觉得这个东西设计很精巧，上手也快，看了半天教程跟着打了几个 Demo 就上手写了，于是乎就习惯了双向数据绑定的写法，并且认为这是理所应当的。然而寒假之后接触了 React Native ，对没有双向绑定非常不爽。虽然双向绑定只是块糖，但有总比没有好嘛。听闻 Google 也搞了个 Android 上实现数据绑定的库 DataBinding ，而且兼容性也不错 ~~我好像不是很在意兼容性2333~~ ，然后就想着要尝试一下。首先对于这个 DataBing 库，是有[详细文档](https://developer.android.com/topic/libraries/data-binding/index.html)的，只不过如果要想在 Kotlin 上用它，有一些不一样。

>下文中，`~` 代表项目根目录。应用包名为 `me.rocka.kotlindemo`

## 1. 配环境 = =

首先在最外层的`~/build.gradle` ，添加 Kotlin Plugin Android Plugin ：

```gradle
buildscript {
    ext.kotlin_version = '1.1.2-3'
    ext.android_plugin_version = '2.3.0'
    { ... }
}
```

在当前版本的 Android Studio (2.3.3) 中，还不能直接新建 Kotlin 项目。但如果用工具（菜单栏 Code->Convert Java File To Kotlin File）将代码转换为 Kotlin ，应该会自动提示配置 Kotlin 项目，即上面的 `ext.kotlin_version` 。

最新的 Android Plugin 版本，可以在 [这里](http://google.github.io/android-gradle-dsl/current/) 查看。

然后在 `~/app/build.gradle` ，添加一些东西：

```gradle
android {
    { .... }
    dataBinding {
        enabled = true
    }
}
// using kapt
kapt {
    generateStubs = true
}
dependencies {
    { ... }
    // using databinding in kotlin
    compile "org.jetbrains.kotlin:kotlin-stdlib:$kotlin_version"
    kapt "com.android.databinding:compiler:$android_plugin_version"
}
```

~~先不管是什么意思，能跑就行。。。~~

## 2. 声明要绑定的数据类

然后新建一个 Kotlin 类咯，随便放在哪。比如我要搞的这个：

```kotlin
package me.rocka.kotlindemo.model

class Track(
        var id: Int = -1,
        var name: String = "name",
        var artistName: String = "artistName"
)
```

写到这里真的要大赞一下 JB 公司了。在那 ~~辣鸡~~ Java 里面，声明一个类居然还要给所有数据字段搞 get/set ，真是傻爆了...明明一个 val/var 就可以解决问题了。

## 3. 创建数据绑定的 Layout

反正做个 Demo ，偷懒搞个 Activity 算了 ~~才不是因为不会~~ 。新建一个布局文件，我这个是 `activity_binding.xml`。

```xml
<?xml version="1.0" encoding="utf-8"?>
<layout>

    <data>

        <variable
            name="track"
            type="me.rocka.kotlindemo.model.Track" />
    </data>

    <LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
        xmlns:app="http://schemas.android.com/apk/res-auto"
        xmlns:tools="http://schemas.android.com/tools"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:orientation="vertical"
        tools:context="me.rocka.kotlindemo.MainActivity">

        <EditText
            android:id="@+id/editTextName"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="@={track.name}" />

        <EditText
            android:id="@+id/editTextArtistName"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="@={track.artistName}" />

        <Button
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            style="?android:buttonBarButtonStyle"
            android:text="Show Track"
            android:onClick="showTrack"/>
    </LinearLayout>
</layout>

```

注意这边的根元素是 `layout` ，然后在 `data` 里面绑定相应的 `variable` ，就是布局中将要绑定的变量，其中 `name` 和 `type` 都是必须的。然后下面就可以随便布局辣，应该就是正经布局文件的写法了。需要绑定属性的地方使用 `@{ ... }` ，比如我这边的 `@{track.name}` ~~其实并没有。。。~~ 。如果要双向绑定的话，使用 `@={ ... }` 。呃，上面使用似乎的都是双向绑定...

## 4. 在 Activity 中绑定变量

添加一个 Kotlin Activity ，开始绑定数据就好了。比如我这个 `BindingActivity.kt` ：

```kotlin
package me.rocka.kotlindemo

import android.databinding.DataBindingUtil
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.widget.Toast
import me.rocka.kotlindemo.databinding.ActivityBindingBinding
import me.rocka.kotlindemo.model.Track

class BindingActivity : ThemedActivity() {
    private var track: Track = Track()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val binding = DataBindingUtil.setContentView<ActivityBindingBinding>(this, R.layout.activity_binding);
        track = Track(30830838, "天ノ弱", "GUMI / 164")
        binding.track = track
    }

    fun showTrack(v: View) {
        track.apply {
            Toast.makeText(applicationContext, """
                    |id: $id
                    |name: $name
                    |artistName: $artistName
            """.trimMargin(), Toast.LENGTH_SHORT).show()
        }
    }
}
```

上面用到的 `ActivityBindingBinding` 是自动生成的，应该是根据布局文件的名字吧，否则应该不会这么奇怪。~~总之凭感觉写就行了， Android Studio 会给你自动补全和引入的~~

## 5. 完成

然后我们来测试了。初始是这样的：

![Init](https://rocka.me/static/img/877509-20170518212841478-959859850.png)

然后我们修改一些数据， 并点击 ”Show Track“ ：

![changed](https://rocka.me/static/img/877509-20170518212852869-1050085326.png)

很完美对不对？而且代码量比起 ~~辣鸡~~ Java 来说少多了，语法太甜了，我喜欢哈哈哈哈哈哈哈。

然后本教程就结束了。期待自己可以用 Kotlin 搞出一些大新闻来。
