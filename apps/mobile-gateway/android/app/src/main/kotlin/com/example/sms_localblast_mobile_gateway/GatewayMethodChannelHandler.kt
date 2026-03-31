package com.example.sms_localblast_mobile_gateway

import android.app.Activity
import io.flutter.plugin.common.BinaryMessenger
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class GatewayMethodChannelHandler(
    private val activity: Activity,
    messenger: BinaryMessenger,
) : MethodChannel.MethodCallHandler {
    private val methodChannel = MethodChannel(messenger, METHODS_CHANNEL_NAME)
    private val eventChannel = EventChannel(messenger, EVENTS_CHANNEL_NAME)
    private val permissionHelper = GatewayPermissionHelper(activity)
    private val eventEmitter = SmsSendResultEmitter()
    private val smsTransportManager = SmsTransportManager(
        activity = activity,
        permissionHelper = permissionHelper,
        eventEmitter = eventEmitter,
    )

    init {
        methodChannel.setMethodCallHandler(this)
        eventChannel.setStreamHandler(eventEmitter)
    }

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "checkCapabilities" -> result.success(smsTransportManager.checkCapabilities())
            "requestPermissions" -> {
                permissionHelper.requestSendSmsPermission { granted ->
                    result.success(granted)
                }
            }
            "sendMessage" -> {
                val messageId = call.argument<String>("messageId")
                val phone = call.argument<String>("normalizedPhoneNumber")
                val body = call.argument<String>("renderedBody")
                val channelType = call.argument<String>("channelType")
                val idempotencyKey = call.argument<String>("idempotencyKey")
                if (messageId.isNullOrBlank() || phone.isNullOrBlank() || body.isNullOrBlank()) {
                    result.success(
                        mapOf(
                            "accepted" to false,
                            "failureCode" to "INVALID_ARGUMENT",
                            "failureReason" to "messageId, normalizedPhoneNumber, renderedBody are required",
                        )
                    )
                    return
                }
                result.success(
                    smsTransportManager.sendMessage(
                        messageId = messageId,
                        phone = phone,
                        body = body,
                        channelType = channelType ?: "SMS",
                        idempotencyKey = idempotencyKey ?: "",
                    )
                )
            }
            else -> result.notImplemented()
        }
    }

    fun dispose() {
        smsTransportManager.dispose()
        methodChannel.setMethodCallHandler(null)
        eventChannel.setStreamHandler(null)
    }

    fun onRequestPermissionsResult(
        requestCode: Int,
        grantResults: IntArray,
    ): Boolean {
        return permissionHelper.onRequestPermissionsResult(requestCode, grantResults)
    }

    companion object {
        const val METHODS_CHANNEL_NAME = "sms_localblast/gateway_transport/methods"
        const val EVENTS_CHANNEL_NAME = "sms_localblast/gateway_transport/events"
    }
}
