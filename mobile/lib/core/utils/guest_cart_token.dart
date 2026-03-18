import 'dart:math';

/// Misafir sepeti için cihazda saklanacak token üretimi (SharedPreferences ile persist edilir).
String generateGuestCartToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  final r = Random.secure();
  return List.generate(32, (_) => chars[r.nextInt(chars.length)]).join();
}
