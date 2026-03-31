package com.example.sms_localblast_mobile_gateway

import io.flutter.plugin.common.EventChannel

class SmsSendResultEmitter : EventChannel.StreamHandler {
    private var eventSink: EventChannel.EventSink? = null

    override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
        eventSink = events
    }

    override fun onCancel(arguments: Any?) {
        eventSink = null
    }

    fun emit(event: Map<String, Any?>) {
        eventSink?.success(event)
    }
}
