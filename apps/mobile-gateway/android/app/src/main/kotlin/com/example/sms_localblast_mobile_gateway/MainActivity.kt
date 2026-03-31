package com.example.sms_localblast_mobile_gateway

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine

class MainActivity : FlutterActivity() {
    private lateinit var gatewayChannelHandler: GatewayMethodChannelHandler

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        gatewayChannelHandler = GatewayMethodChannelHandler(
            activity = this,
            messenger = flutterEngine.dartExecutor.binaryMessenger,
        )
    }

    override fun onDestroy() {
        if (::gatewayChannelHandler.isInitialized) {
            gatewayChannelHandler.dispose()
        }
        super.onDestroy()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        if (::gatewayChannelHandler.isInitialized) {
            val handled = gatewayChannelHandler.onRequestPermissionsResult(requestCode, grantResults)
            if (handled) {
                return
            }
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    }
}
