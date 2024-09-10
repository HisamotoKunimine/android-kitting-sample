package com.example.kittingsample

import android.app.Activity
import android.os.Bundle

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        KittingAccessibilityService.Type.get(intent.extras?.getString("type"))?.let {
            KittingAccessibilityService.run(context = applicationContext, type = it)
        }
        finish()
    }
}
