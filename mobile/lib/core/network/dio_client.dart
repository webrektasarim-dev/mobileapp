import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../errors/app_exception.dart';
import '../storage/token_storage.dart';

/// Dio + access token + 401'de refresh ile tek deneme retry.
Dio createDio(TokenStorage tokenStorage) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {'Accept': 'application/json'},
    ),
  );

  final plain = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {'Accept': 'application/json'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        if (options.path.contains('/auth/login') ||
            options.path.contains('/auth/register') ||
            options.path.contains('/auth/refresh')) {
          return handler.next(options);
        }
        final token = await tokenStorage.readAccessToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (err, handler) async {
        final status = err.response?.statusCode;
        final path = err.requestOptions.path;
        final isAuthPath =
            path.contains('/auth/login') || path.contains('/auth/register');

        final alreadyRetried = err.requestOptions.extra['retried'] == true;
        if (status == 401 && !isAuthPath && !alreadyRetried) {
          final refresh = await tokenStorage.readRefreshToken();
          if (refresh != null && refresh.isNotEmpty) {
            try {
              final res = await plain.post<Map<String, dynamic>>(
                '/auth/refresh',
                data: {'refreshToken': refresh},
              );
              final data = res.data ?? {};
              final access = data['accessToken'] as String? ?? '';
              final newRefresh = data['refreshToken'] as String? ?? refresh;
              if (access.isNotEmpty) {
                await tokenStorage.writeTokens(access: access, refresh: newRefresh);
                final ro = err.requestOptions.copyWith(
                  headers: Map.from(err.requestOptions.headers)
                    ..['Authorization'] = 'Bearer $access',
                  extra: {...err.requestOptions.extra, 'retried': true},
                );
                final clone = await dio.fetch(ro);
                return handler.resolve(clone);
              }
            } catch (_) {
              await tokenStorage.clear();
            }
          }
        }

        final msg = err.response?.data is Map
            ? (err.response!.data['message']?.toString() ?? err.message)
            : err.message;
        handler.reject(
          DioException(
            requestOptions: err.requestOptions,
            error: NetworkException(msg ?? 'Ağ hatası'),
            type: err.type,
            response: err.response,
          ),
        );
      },
    ),
  );

  return dio;
}
