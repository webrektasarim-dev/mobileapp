import '../entities/auth_user.dart';

abstract class AuthRepository {
  Future<void> login({required String email, required String password});
  Future<void> register({
    required String email,
    required String password,
    required String name,
  });
  Future<void> logout();
  Future<AuthUser?> currentUser();
  Future<bool> refreshSession();
}
