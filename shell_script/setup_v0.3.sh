#!/bin/bash

# apkのインストール
adb install sample.apk
# 「ユーザー補助」の設定画面を開く
adb shell am start -a android.settings.ACCESSIBILITY_SETTINGS
# 少し待つ
sleep 3
# 「表示サイズとテキスト」を開く
adb shell input touchscreen tap 500 1200
# 少し待つ
sleep 3
# フォントサイズの「+」をタップ
adb shell input touchscreen tap 1000 1650
# 少し待つ
sleep 3
# フォントサイズの「+」をタップ
adb shell input touchscreen tap 1000 1700
