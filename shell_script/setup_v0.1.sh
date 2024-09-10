#!/bin/bash

# apkのインストール
adb install sample.apk
# 「ユーザー補助」の設定画面を開く
adb shell am start -a android.settings.ACCESSIBILITY_SETTINGS
# 「表示サイズとテキスト」を開く
adb shell input touchscreen tap 500 1200
# フォントサイズの「+」をタップ
adb shell input touchscreen tap 1000 1650
# フォントサイズの「+」をタップ
adb shell input touchscreen tap 1000 1650
