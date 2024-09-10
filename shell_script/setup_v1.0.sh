#!/bin/bash

## 接続
# adbを再起動する
adb kill-server
adb start-server

# 端末が接続されるのを待つ
adb wait-for-device

## キッティングのための事前設定
# ディスプレイスリープを無効
adb shell settings put system screen_off_timeout 0

# 画面の自動回転を無効
adb shell settings put system accelerometer_rotation 0

## キッティング
# アプリのインストール
adb install sample.apk

# 設定 ユーザー補助を開く
adb shell am start -a android.settings.ACCESSIBILITY_SETTINGS
sleep 3

## キッティング
# 「表示サイズとテキスト」を開く
adb shell input touchscreen tap 500 1200
sleep 3
# フォントサイズの「+」をタップ
adb shell input touchscreen tap 1000 1650
sleep 3
# フォントサイズの「+」をタップ
adb shell input touchscreen tap 1000 1700
sleep 3

## キッティングのための設定を戻す
# ホーム画面に戻る
adb shell input keyevent KEYCODE_HOME

# ディスプレイ回転有効
adb shell settings put system accelerometer_rotation 1

# ディスプレイスリープ1分
adb shell settings put system screen_off_timeout 60000

## 接続終了
# USBデバッグを無効
adb shell settings put global adb_enabled 0

# 終了
adb kill-server
