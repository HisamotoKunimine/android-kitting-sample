package com.example.kittingsample

import android.accessibilityservice.AccessibilityService
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Parcelable
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.parcelize.Parcelize

class KittingAccessibilityService : AccessibilityService() {

    @Parcelize
    enum class Type(val type: String) : Parcelable {
        ChangeFontSize("ChangeFontSize");

        companion object {
            fun get(type: String?): Type? = entries.find { it.type == type }
        }
    }

    private val job = Job()
    private val scope = CoroutineScope(Dispatchers.Main + job)

    override fun onCreate() {
        super.onCreate()
        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_DEFAULT
        )
        (getSystemService(NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(
            channel
        )
        val notification: Notification = Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("KittingSampleService")
            .setContentText("running").build()
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(1, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(1, notification)
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}

    override fun onInterrupt() {}

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val operationType: Type? = if (Build.VERSION.SDK_INT >= 33) {
            intent?.extras?.getParcelable(KEY_TYPE, Type::class.java)
        } else {
            intent?.extras?.getParcelable(KEY_TYPE)
        }
        handleOperationType(operationType)
        return START_STICKY
    }

    private fun handleOperationType(type: Type?) = scope.launch {
        when (type) {
            Type.ChangeFontSize -> {
                openAccessibilitySettings()
                delay(3000L)
                // U+2060 Word Joiner
                findAndClickButtonByText(
                    rootInActiveWindow,
                    "表示サイズとテ\u2060キ\u2060ス\u2060ト"
                )
                delay(3000L)
                findAndClickButtonByContentDescription(rootInActiveWindow, "拡大")
                delay(3000L)
                findAndClickButtonByContentDescription(rootInActiveWindow, "拡大")
            }

            null -> Unit
        }
    }

    private fun openAccessibilitySettings() {
        findAndClickButtonByText(null, "")
        applicationContext.startActivity(
            Intent("android.settings.ACCESSIBILITY_SETTINGS").apply {
                setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        )
    }

    private fun findAndClickButtonByText(nodeInfo: AccessibilityNodeInfo?, label: String) {
        if(nodeInfo == null) {
            return
        }

        nodeInfo.findAccessibilityNodeInfosByText(label).firstOrNull()?.let { node ->
            findClickableNode(node).performAction(AccessibilityNodeInfo.ACTION_CLICK)
        }
    }

    private fun findClickableNode(info: AccessibilityNodeInfo): AccessibilityNodeInfo {
        return if (info.isClickable) info else findClickableNode(info.parent)
    }

    private fun findAndClickButtonByContentDescription(
        nodeInfo: AccessibilityNodeInfo?,
        contentDescription: String
    ): Boolean {
        if (nodeInfo == null) {
            return false
        }

        if (contentDescription == nodeInfo.contentDescription) {
            nodeInfo.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            return true
        }

        for (i in 0 until nodeInfo.childCount) {
            if (findAndClickButtonByContentDescription(nodeInfo.getChild(i), contentDescription)) {
                return true
            }
        }
        return false
    }

    companion object {
        private const val KEY_TYPE = "type"
        private const val CHANNEL_ID = "kitting_sample"
        private const val CHANNEL_NAME = "kitting_sample_service"

        fun run(context: Context, type: Type) {
            val intent = Intent(context, KittingAccessibilityService::class.java).apply {
                putExtra(KEY_TYPE, type as Parcelable)
            }
            context.startForegroundService(intent)
        }
    }
}
