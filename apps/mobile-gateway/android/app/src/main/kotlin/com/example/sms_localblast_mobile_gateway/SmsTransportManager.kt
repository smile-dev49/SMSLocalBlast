package com.example.sms_localblast_mobile_gateway

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.SmsManager
import android.util.Log
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

class SmsTransportManager(
    private val activity: Activity,
    private val permissionHelper: GatewayPermissionHelper,
    private val eventEmitter: SmsSendResultEmitter,
) {
    private val correlationMap = ConcurrentHashMap<String, MessageCorrelation>()
    private val sendStatusReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent == null) return
            val messageId = intent.getStringExtra(EXTRA_MESSAGE_ID) ?: return
            val correlationId = intent.getStringExtra(EXTRA_CORRELATION_ID) ?: ""
            val isSentEvent = intent.action == ACTION_SMS_SENT
            if (isSentEvent) {
                if (resultCode == Activity.RESULT_OK) {
                    eventEmitter.emit(
                        mapOf(
                            "type" to "sent",
                            "messageId" to messageId,
                            "correlationId" to correlationId,
                        )
                    )
                } else {
                    eventEmitter.emit(
                        mapOf(
                            "type" to "failed",
                            "messageId" to messageId,
                            "correlationId" to correlationId,
                            "failureCode" to "ANDROID_SEND_ERROR_$resultCode",
                            "failureReason" to "SMS send broadcast failed with code $resultCode",
                        )
                    )
                    correlationMap.remove(correlationId)
                }
            } else {
                if (resultCode == Activity.RESULT_OK) {
                    eventEmitter.emit(
                        mapOf(
                            "type" to "delivered",
                            "messageId" to messageId,
                            "correlationId" to correlationId,
                        )
                    )
                } else {
                    eventEmitter.emit(
                        mapOf(
                            "type" to "failed",
                            "messageId" to messageId,
                            "correlationId" to correlationId,
                            "failureCode" to "ANDROID_DELIVERY_ERROR_$resultCode",
                            "failureReason" to "SMS delivery broadcast failed with code $resultCode",
                        )
                    )
                }
                correlationMap.remove(correlationId)
            }
        }
    }

    init {
        registerReceiverCompat(IntentFilter(ACTION_SMS_SENT))
        registerReceiverCompat(IntentFilter(ACTION_SMS_DELIVERED))
    }

    fun checkCapabilities(): Map<String, Any> {
        val smsSupported = activity.packageManager.hasSystemFeature("android.hardware.telephony")
        return mapOf(
            "platform" to "android",
            "smsSupported" to smsSupported,
            "deliveryReportsSupported" to smsSupported,
            "permissionGranted" to permissionHelper.hasSendSmsPermission(),
            "note" to if (smsSupported) {
                "Android SMS transport is available when SEND_SMS permission is granted."
            } else {
                "Device lacks telephony feature; SMS transport unavailable."
            },
        )
    }

    fun sendMessage(
        messageId: String,
        phone: String,
        body: String,
        channelType: String,
        idempotencyKey: String,
    ): Map<String, Any?> {
        if (channelType != "SMS") {
            return mapOf(
                "accepted" to false,
                "failureCode" to "CHANNEL_UNSUPPORTED",
                "failureReason" to "Only SMS is currently supported by Android transport",
            )
        }
        if (!permissionHelper.hasSendSmsPermission()) {
            return mapOf(
                "accepted" to false,
                "failureCode" to "PERMISSION_DENIED",
                "failureReason" to "SEND_SMS permission not granted",
            )
        }
        val correlationId = UUID.randomUUID().toString()
        val requestCode = correlationId.hashCode()
        try {
            val sentIntent = Intent(ACTION_SMS_SENT).apply {
                putExtra(EXTRA_MESSAGE_ID, messageId)
                putExtra(EXTRA_CORRELATION_ID, correlationId)
            }
            val deliveredIntent = Intent(ACTION_SMS_DELIVERED).apply {
                putExtra(EXTRA_MESSAGE_ID, messageId)
                putExtra(EXTRA_CORRELATION_ID, correlationId)
            }
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val sentPendingIntent = PendingIntent.getBroadcast(activity, requestCode, sentIntent, flags)
            val deliveredPendingIntent =
                PendingIntent.getBroadcast(activity, requestCode + 1, deliveredIntent, flags)

            correlationMap[correlationId] = MessageCorrelation(
                messageId = messageId,
                phone = phone,
                idempotencyKey = idempotencyKey,
            )

            val smsManager = SmsManager.getDefault()
            smsManager.sendTextMessage(phone, null, body, sentPendingIntent, deliveredPendingIntent)
            eventEmitter.emit(
                mapOf(
                    "type" to "accepted",
                    "messageId" to messageId,
                    "correlationId" to correlationId,
                )
            )

            return mapOf(
                "accepted" to true,
                "correlationId" to correlationId,
            )
        } catch (ex: SecurityException) {
            Log.e(TAG, "Security exception while sending SMS", ex)
            return mapOf(
                "accepted" to false,
                "failureCode" to "PERMISSION_DENIED",
                "failureReason" to "SEND_SMS permission denied by platform",
            )
        } catch (ex: Exception) {
            Log.e(TAG, "Unhandled SMS send exception", ex)
            return mapOf(
                "accepted" to false,
                "failureCode" to "ANDROID_SEND_EXCEPTION",
                "failureReason" to (ex.message ?: "Unknown Android SMS exception"),
            )
        }
    }

    fun dispose() {
        try {
            activity.unregisterReceiver(sendStatusReceiver)
        } catch (_: IllegalArgumentException) {
            // Receiver already unregistered.
        }
    }

    private fun registerReceiverCompat(filter: IntentFilter) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.registerReceiver(sendStatusReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            activity.registerReceiver(sendStatusReceiver, filter)
        }
    }

    private data class MessageCorrelation(
        val messageId: String,
        val phone: String,
        val idempotencyKey: String,
    )

    companion object {
        private const val TAG = "SmsTransportManager"
        private const val ACTION_SMS_SENT = "com.smslocalblast.gateway.SMS_SENT"
        private const val ACTION_SMS_DELIVERED = "com.smslocalblast.gateway.SMS_DELIVERED"
        private const val EXTRA_MESSAGE_ID = "messageId"
        private const val EXTRA_CORRELATION_ID = "correlationId"
    }
}
