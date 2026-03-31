package com.example.sms_localblast_mobile_gateway

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class GatewayPermissionHelper(
    private val activity: Activity,
) {
    private var pendingCallback: ((Boolean) -> Unit)? = null

    fun hasSendSmsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.SEND_SMS,
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun requestSendSmsPermission(callback: (Boolean) -> Unit) {
        if (hasSendSmsPermission()) {
            callback(true)
            return
        }
        pendingCallback = callback
        ActivityCompat.requestPermissions(
            activity,
            arrayOf(Manifest.permission.SEND_SMS),
            SEND_SMS_PERMISSION_REQUEST_CODE,
        )
    }

    fun onRequestPermissionsResult(
        requestCode: Int,
        grantResults: IntArray,
    ): Boolean {
        if (requestCode != SEND_SMS_PERMISSION_REQUEST_CODE) {
            return false
        }
        val granted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
        pendingCallback?.invoke(granted)
        pendingCallback = null
        return true
    }

    companion object {
        const val SEND_SMS_PERMISSION_REQUEST_CODE = 4001
    }
}
