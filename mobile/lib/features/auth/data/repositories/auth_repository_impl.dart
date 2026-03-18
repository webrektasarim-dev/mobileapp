import '../../../../core/storage/token_storage.dart';
import '../../domain/entities/auth_user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({
    required AuthRemoteDatasource remote,
    required TokenStorage tokenStorage,
  })  : _remote = remote,
        _tokens = tokenStorage;

  final AuthRemoteDatasource _remote;
  final TokenStorage _tokens;

  @override
  Future<void> login({required String email, required String password}) async {
    final data = await _remote.login(email: email, password: password);
    final access = data['accessToken'] as String? ?? '';
    final refresh = data['refreshToken'] as String? ?? '';
    await _tokens.writeTokens(access: access, refresh: refresh);
  }

  @override
  Future<void> register({
    required String email,
    required String password,
    required String name,
  }) async {
    final data = await _remote.register(
      email: email,
      password: password,
      name: name,
    );
    final access = data['accessToken'] as String? ?? '';
    final refresh = data['refreshToken'] as String? ?? '';
    await _tokens.writeTokens(access: access, refresh: refresh);
  }

  @override
  Future<void> logout() async {
    try {
      await _remote.logout();
    } catch (_) {}
    await _tokens.clear();
  }

  @override
  Future<AuthUser?> currentUser() async {
    final t = await _tokens.readAccessToken();
    if (t == null || t.isEmpty) return null;
    try {
      final data = await _remote.me();
      return AuthUser(
        id: data['id']?.toString() ?? '',
        email: data['email']?.toString() ?? '',
        name: data['name']?.toString() ?? '',
      );
    } catch (_) {
      return null;
    }
  }

  @override
  Future<bool> refreshSession() async {
    final refresh = await _tokens.readRefreshToken();
    if (refresh == null || refresh.isEmpty) return false;
    try {
      final data = await _remote.refresh(refresh);
      final access = data['accessToken'] as String? ?? '';
      final newRefresh = data['refreshToken'] as String? ?? refresh;
      await _tokens.writeTokens(access: access, refresh: newRefresh);
      return true;
    } catch (_) {
      await _tokens.clear();
      return false;
    }
  }
}
