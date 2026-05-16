import {
  NavigationContainer,
  StackActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Platform, StatusBar, useColorScheme } from 'react-native';
import { Modal, Pressable, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { SplashScreen } from '../screens/common/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { ChangePasswordScreen } from '../screens/auth/ChangePasswordScreen';
import { ClientMainScreen } from '../screens/client/ClientMainScreen';
import { AdminMainScreen } from '../screens/admin/AdminMainScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ProductDetailsScreen } from '../screens/products/ProductDetailsScreen';
import { AdminProductDetailsScreen } from '../screens/admin/AdminProductDetailsScreen';
import { AdminProductEditorScreen } from '../screens/admin/AdminProductEditorScreen';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { bootstrapAuth } from '../redux/slices/authSlice';
import { logout } from '../redux/slices/authSlice';
import { setSelectedPanel } from '../redux/slices/uiSlice';
import type { RootStackParamList } from './types';
import { RoleManagerScreen } from '../screens/admin/RoleManagerScreen';
import { TeacherMainScreen } from '../screens/teacher/TeacherMainScreen';
import { PendingApprovalScreen } from '../screens/common/PendingApprovalScreen';
import { canSwitchPanels, getSessionRoles, hasSessionRole } from '../utils/session';
import { setSessionExpiredHandler } from '../services/api/httpClient';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();
const AUTH_ROUTES: Array<keyof RootStackParamList> = [
  'Login',
  'Register',
  'ForgotPassword',
  'ResetPassword',
];

export function AppNavigator() {
  const dispatch = useAppDispatch();
  const status = useAppSelector(state => state.auth.status);
  const theme = useAppSelector(state => state.ui.theme);
  const systemScheme = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const session = useAppSelector(state => state.auth.session);
  const sessionRoles = getSessionRoles(session);
  const hasStudentRole = hasSessionRole(session, 'Student');
  const hasClientOnlyRole = hasSessionRole(session, 'Client') && !hasSessionRole(session, 'Student');
  const hasTeacherRole = hasSessionRole(session, 'Teacher');
  const hasAdminRole = hasSessionRole(session, 'Admin');
  const hasMultiPanelAccess = canSwitchPanels(session) || (hasTeacherRole && hasStudentRole) || (hasAdminRole && hasTeacherRole);
  const selectedPanel = useAppSelector(state => state.ui.selectedPanel);
  const [isSplashFinished, setSplashFinished] = useState(false);
  const [isNavReady, setNavReady] = useState(false);

  const nextRoute = useMemo<keyof RootStackParamList>(() => {
      if (isAuthenticated) {
      if (selectedPanel === 'student' && hasStudentRole) {
        return 'ClientMain';
      }
      if (selectedPanel === 'student' && hasClientOnlyRole) {
        return 'PendingApproval';
      }
      if (selectedPanel === 'teacher' && hasTeacherRole) {
        return 'TeacherMain';
      }
      if (selectedPanel === 'admin' && hasAdminRole) {
        return 'AdminHome';
      }

      if (sessionRoles.length === 1) {
        if (hasStudentRole) {
          return 'ClientMain';
        }
        if (hasClientOnlyRole) {
          return 'PendingApproval';
        }
        if (hasTeacherRole) {
          return 'TeacherMain';
        }

        return 'AdminHome';
      }

      if (hasMultiPanelAccess) {
        if (selectedPanel === 'student') return 'ClientMain';
        if (selectedPanel === 'teacher') return 'TeacherMain';
        if (selectedPanel === 'admin') return 'AdminHome';
        return 'Splash';
      }

      if (hasTeacherRole) {
        return 'TeacherMain';
      }
      if (hasAdminRole) {
        return 'AdminHome';
      }

      if (hasStudentRole) return 'ClientMain';
      if (hasClientOnlyRole) return 'PendingApproval';
      return 'Login';
    }

    return 'Login';
  }, [hasAdminRole, hasClientOnlyRole, hasMultiPanelAccess, hasStudentRole, hasTeacherRole, isAuthenticated, selectedPanel, sessionRoles]);

  const handleSplashFinish = useCallback(() => {
    setSplashFinished(true);
  }, []);

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      dispatch(logout());
    });
    return () => setSessionExpiredHandler(null);
  }, [dispatch]);

  useEffect(() => {
    if (!isNavReady) {
      return;
    }

    if (status === 'bootstrapping' || !isSplashFinished) {
      return;
    }

    if (navigationRef.getCurrentRoute()?.name !== 'Splash') {
      return;
    }

    navigationRef.dispatch(StackActions.replace(nextRoute));
  }, [isNavReady, isSplashFinished, nextRoute, status]);

  // When user picks a panel, replay the splash then navigate.
  useEffect(() => {
    if (!isNavReady) return;
    if (!selectedPanel) return;

    // reset splash finished flag so the SplashScreen will play its animation
    // and only after it calls onFinish (setting isSplashFinished) will we
    // automatically navigate to the selected panel (nextRoute).
    setSplashFinished(false);
    // navigate to splash so it plays and then onFinish will redirect to nextRoute
    navigationRef.dispatch(StackActions.replace('Splash'));
  }, [selectedPanel, isNavReady]);

  useEffect(() => {
    if (!isNavReady || status === 'bootstrapping') {
      return;
    }

    const currentRoute = navigationRef.getCurrentRoute()?.name;
    if (!currentRoute || currentRoute === 'Splash') {
      return;
    }

    const isAuthRoute = AUTH_ROUTES.includes(currentRoute);
    const targetRoute = isAuthenticated ? nextRoute : 'Login';

    if (!isAuthenticated && !isAuthRoute && currentRoute !== targetRoute) {
      navigationRef.dispatch(StackActions.replace('Login'));
      return;
    }

    if (isAuthenticated && targetRoute === 'Splash') {
      navigationRef.dispatch(StackActions.replace('Splash'));
      return;
    }

    if (isAuthenticated && isAuthRoute && currentRoute !== targetRoute) {
      navigationRef.dispatch(StackActions.replace(targetRoute));
    }
  }, [isAuthenticated, isNavReady, nextRoute, status]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const routeName = navigationRef.getCurrentRoute()?.name;
      if (routeName === 'Login') {
        BackHandler.exitApp();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  const splashExitOptions = useMemo(
    () => ({
      animation: 'fade_from_bottom' as const,
    }),
    [],
  );

  const modalBackdropStyle = { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' } as const;
  const modalCardStyle = { width: '88%', borderRadius: 14, padding: 18, backgroundColor: '#fff' } as const;
  const modalOptionStyle = { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 } as const;
  const modalOptionText = { marginTop: 8, fontWeight: '800' } as const;
  const modalTitleStyle = { fontSize: 18, fontWeight: '800', marginBottom: 6 } as const;
  const modalSubtitleStyle = { marginBottom: 12, color: '#6B7280' } as const;
  const modalRowStyle = { flexDirection: 'row', gap: 12 } as const;

  return (
    <NavigationContainer ref={navigationRef} onReady={() => setNavReady(true)}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="Splash"
          options={{ animationTypeForReplace: 'push' }}
        >
          {() => <SplashScreen onFinish={handleSplashFinish} />}
        </Stack.Screen>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={splashExitOptions}
        />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen
          name="ClientMain"
          component={ClientMainScreen}
          options={splashExitOptions}
        />
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} options={splashExitOptions} />
        <Stack.Screen
          name="AdminHome"
          component={AdminMainScreen}
          options={splashExitOptions}
        />
        <Stack.Screen
          name="TeacherMain"
          component={TeacherMainScreen}
          options={splashExitOptions}
        />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen
          name="AdminProductDetails"
          component={AdminProductDetailsScreen}
        />
        <Stack.Screen
          name="AdminProductEditor"
          component={AdminProductEditorScreen}
        />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="RoleManager" component={RoleManagerScreen} />
      </Stack.Navigator>
      {/* Panel chooser modal for multi-role users */}
      <Modal visible={Boolean(isAuthenticated && hasMultiPanelAccess && sessionRoles.length > 1 && !selectedPanel && isSplashFinished)} transparent animationType="fade">
        <View style={modalBackdropStyle}>
          <View style={modalCardStyle}>
            <Text style={modalTitleStyle}>Choose your role</Text>
            <Text style={modalSubtitleStyle}>Select which workspace you want to enter for this session.</Text>
            <View style={modalRowStyle}>
              {Array.from(new Set(sessionRoles)).map(roleName => {
                const normalizedRole = roleName.toLowerCase();
                const selected = normalizedRole === 'client' || normalizedRole === 'student'
                  ? 'student'
                  : normalizedRole === 'teacher'
                    ? 'teacher'
                    : 'admin';
                return (
                  <Pressable
                    key={roleName}
                    onPress={() => dispatch(setSelectedPanel(selected))}
                    style={modalOptionStyle}>
                    <Ionicons name={selected === 'student' ? 'person-outline' : selected === 'teacher' ? 'school-outline' : 'shield-checkmark-outline'} size={28} />
                    <Text style={modalOptionText}>{roleName}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </NavigationContainer>
  );
}
