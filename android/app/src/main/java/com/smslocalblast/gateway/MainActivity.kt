package com.smslocalblast.gateway

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.telephony.SmsManager
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.random.Random

class MainActivity : AppCompatActivity() {

    private val executor: ExecutorService = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val SEND_SMS_REQUEST = 1001

    private lateinit var apiUrl: EditText
    private lateinit var email: EditText
    private lateinit var password: EditText
    private lateinit var loginBtn: Button
    private lateinit var startBtn: Button
    private lateinit var stopBtn: Button
    private lateinit var status: TextView

    private var token: String? = null
    private var polling = false
    private val pollIntervalMs = 15_000L
    private val jitterMinMs = 10_000L
    private val jitterRangeMs = 20_001L

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        apiUrl = findViewById(R.id.apiUrl)
        email = findViewById(R.id.email)
        password = findViewById(R.id.password)
        loginBtn = findViewById(R.id.loginBtn)
        startBtn = findViewById(R.id.startBtn)
        stopBtn = findViewById(R.id.stopBtn)
        status = findViewById(R.id.status)

        apiUrl.setText("http://10.0.2.2:3000")

        requestSmsPermission()

        loginBtn.setOnClickListener { doLogin() }
        startBtn.setOnClickListener { startPolling() }
        stopBtn.setOnClickListener { stopPolling() }
    }

    private fun requestSmsPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.SEND_SMS),
                SEND_SMS_REQUEST
            )
        }
    }

    private fun doLogin() {
        val base = apiUrl.text.toString().trim().trimEnd('/')
        val em = email.text.toString().trim()
        val pw = password.text.toString()

        if (base.isEmpty() || em.isEmpty() || pw.isEmpty()) {
            Toast.makeText(this, "Fill all fields", Toast.LENGTH_SHORT).show()
            return
        }

        setStatus("Signing in...")
        loginBtn.isEnabled = false

        executor.execute {
            try {
                val conn = URL("$base/api/auth/login").openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 10000
                conn.readTimeout = 10000

                conn.outputStream.use { os ->
                    os.write(JSONObject().apply {
                        put("email", em)
                        put("password", pw)
                    }.toString().toByteArray())
                }

                val code = conn.responseCode
                val body = if (code in 200..299) conn.inputStream else conn.errorStream
                val json = body?.bufferedReader()?.readText() ?: ""

                mainHandler.post {
                    loginBtn.isEnabled = true
                    if (code in 200..299) {
                        val obj = JSONObject(json)
                        token = obj.optString("token").takeIf { it.isNotEmpty() }
                        if (token != null) {
                            setStatus("Signed in. Tap Start gateway.")
                            startBtn.isEnabled = true
                            Toast.makeText(this, "Signed in", Toast.LENGTH_SHORT).show()
                        } else {
                            setStatus("No token in response")
                        }
                    } else {
                        val err = try { JSONObject(json).optString("error", json) } catch (_: Exception) { json }
                        setStatus("Login failed: $err")
                        Toast.makeText(this, "Login failed", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                mainHandler.post {
                    loginBtn.isEnabled = true
                    setStatus("Error: ${e.message}")
                    Toast.makeText(this, "Network error", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun startPolling() {
        if (token == null) return
        polling = true
        startBtn.isEnabled = false
        stopBtn.isEnabled = true
        setStatus("Polling...")
        pollOnce()
    }

    private fun stopPolling() {
        polling = false
        startBtn.isEnabled = true
        stopBtn.isEnabled = false
        setStatus("Stopped. Tap Start to resume.")
    }

    private fun pollOnce() {
        if (!polling || token == null) return

        val base = apiUrl.text.toString().trim().trimEnd('/')
        val t = token!!

        executor.execute {
            try {
                val conn = URL("$base/api/messages/claim-next").openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Authorization", "Bearer $t")
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 10000
                conn.readTimeout = 10000
                conn.outputStream.use { it.write(ByteArray(0)) }

                val code = conn.responseCode
                val body = conn.inputStream.bufferedReader().readText()
                val obj = JSONObject(body)
                val msg = obj.optJSONObject("message")

                mainHandler.post {
                    if (code in 200..299 && msg != null) {
                        val id = msg.optString("id")
                        val toPhone = msg.optString("to_phone")
                        val bodyText = msg.optString("body")
                        sendSmsAndReport(base, t, id, toPhone, bodyText) {
                            if (polling) {
                                val jitterMs = jitterMinMs + Random.nextLong(jitterRangeMs)
                                setStatus("Jitter: waiting ${jitterMs / 1000}s before next poll…")
                                mainHandler.postDelayed({ pollOnce() }, jitterMs)
                            }
                        }
                    } else {
                        setStatus("Polling... (no message)")
                        if (polling) mainHandler.postDelayed({ pollOnce() }, pollIntervalMs)
                    }
                }
            } catch (e: Exception) {
                Log.e("Gateway", "Poll error", e)
                mainHandler.post {
                    setStatus("Poll error: ${e.message}")
                    if (polling) mainHandler.postDelayed({ pollOnce() }, pollIntervalMs)
                }
            }
        }
    }

    private fun sendSmsAndReport(
        base: String,
        t: String,
        id: String,
        toPhone: String,
        body: String,
        onDone: () -> Unit = {}
    ) {
        setStatus("Sending to $toPhone...")

        executor.execute {
            var smsOk = false
            try {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS)
                    == PackageManager.PERMISSION_GRANTED
                ) {
                    SmsManager.getDefault().sendTextMessage(toPhone, null, body, null, null)
                    smsOk = true
                }
            } catch (e: Exception) {
                Log.e("Gateway", "SMS send error", e)
            }

            val statusToReport = if (smsOk) "sent" else "failed"
            try {
                val conn = URL("$base/api/messages/$id/status").openConnection() as HttpURLConnection
                conn.requestMethod = "PATCH"
                conn.setRequestProperty("Authorization", "Bearer $t")
                conn.setRequestProperty("Content-Type", "application/json")
                conn.doOutput = true
                conn.connectTimeout = 5000
                conn.readTimeout = 5000
                conn.outputStream.use { os ->
                    os.write(JSONObject().put("status", statusToReport).toString().toByteArray())
                }
                conn.responseCode
            } catch (_: Exception) {}

            mainHandler.post {
                setStatus(if (smsOk) "Sent to $toPhone" else "Failed to send to $toPhone")
                onDone()
            }
        }
    }

    private fun setStatus(text: String) {
        status.text = text
    }

    override fun onDestroy() {
        polling = false
        executor.shutdown()
        super.onDestroy()
    }
}
