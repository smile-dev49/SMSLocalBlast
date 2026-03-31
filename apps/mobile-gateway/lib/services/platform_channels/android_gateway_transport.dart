import 'dart:async';

import 'package:flutter/services.dart';

import '../../core/models/dispatch_job.dart';
import 'gateway_transport.dart';

class AndroidGatewayTransport implements GatewayTransport {
  static const _methodChannel = MethodChannel('sms_localblast/gateway_transport/methods');
  static const _eventChannel = EventChannel('sms_localblast/gateway_transport/events');
  static final StreamController<TransportEvent> _eventsController =
      StreamController<TransportEvent>.broadcast();
  static bool _isEventStreamBound = false;
  static TransportEvent? _lastEvent;

  AndroidGatewayTransport() {
    _bindEventStreamOnce();
  }

  void _bindEventStreamOnce() {
    if (_isEventStreamBound) return;
    _isEventStreamBound = true;
    _eventChannel.receiveBroadcastStream().listen((dynamic rawEvent) {
      if (rawEvent is Map) {
        final event = TransportEvent.fromJson(rawEvent.cast<String, dynamic>());
        _lastEvent = event;
        _eventsController.add(event);
      }
    });
  }

  @override
  Stream<TransportEvent> get events => _eventsController.stream;

  @override
  TransportEvent? get lastEvent => _lastEvent;

  @override
  Future<TransportCapabilities> checkCapabilities() async {
    final raw = await _methodChannel.invokeMapMethod<String, dynamic>('checkCapabilities') ??
        const <String, dynamic>{};
    return TransportCapabilities.fromJson(raw);
  }

  @override
  Future<bool> requestPermissions() async {
    final granted = await _methodChannel.invokeMethod<bool>('requestPermissions');
    return granted ?? false;
  }

  @override
  Future<TransportResult> sendMessage(DispatchJob job) async {
    final response = await _methodChannel.invokeMapMethod<String, dynamic>('sendMessage', {
          'messageId': job.messageId,
          'normalizedPhoneNumber': job.normalizedPhoneNumber,
          'renderedBody': job.renderedBody,
          'channelType': job.channelType,
          'idempotencyKey': job.idempotencyKey,
        }) ??
        const <String, dynamic>{};

    final accepted = response['accepted'] as bool? ?? false;
    if (!accepted) {
      return TransportResult(
        type: 'report-failed',
        failureCode: (response['failureCode'] as String?) ?? 'ANDROID_SEND_REJECTED',
        failureReason: (response['failureReason'] as String?) ?? 'Android SMS send rejected',
      );
    }

    try {
      final event = await events.firstWhere(
        (evt) => evt.messageId == job.messageId && (evt.type == 'sent' || evt.type == 'failed'),
      ).timeout(const Duration(seconds: 45));

      if (event.type == 'sent') {
        return const TransportResult(type: 'report-sent');
      }
      return TransportResult(
        type: 'report-failed',
        failureCode: event.failureCode ?? 'ANDROID_SEND_FAILED',
        failureReason: event.failureReason ?? 'Android transport send failed',
      );
    } on TimeoutException {
      return const TransportResult(
        type: 'report-failed',
        failureCode: 'ANDROID_SEND_TIMEOUT',
        failureReason: 'Timed out waiting for Android sent callback',
      );
    }
  }
}
