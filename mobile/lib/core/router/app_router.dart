import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/splash_page.dart';
import '../../features/home/presentation/pages/home_page.dart';

/// Deep link: ödeme dönüşü için `/orders/:id` eklenebilir.
GoRouter createAppRouter({Listenable? refreshListenable}) {
  return GoRouter(
    refreshListenable: refreshListenable,
    initialLocation: SplashPage.path,
    routes: [
      GoRoute(
        path: SplashPage.path,
        builder: (_, __) => const SplashPage(),
      ),
      GoRoute(
        path: LoginPage.path,
        builder: (_, __) => const LoginPage(),
      ),
      GoRoute(
        path: HomePage.path,
        builder: (_, __) => const HomePage(),
      ),
    ],
  );
}
