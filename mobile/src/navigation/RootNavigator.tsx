import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { LoadingState } from '../components/LoadingState';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ComposeScreen } from '../screens/ComposeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TweetDetailScreen } from '../screens/TweetDetailScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { colors } from '../theme';
import type { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<
            string,
            {
              active: keyof typeof Ionicons.glyphMap;
              inactive: keyof typeof Ionicons.glyphMap;
            }
          > = {
            HomeTab: { active: 'home', inactive: 'home-outline' },
            ComposeTab: { active: 'add-circle', inactive: 'add-circle-outline' },
            ProfileTab: {
              active: 'person-circle',
              inactive: 'person-circle-outline',
            },
          };
          const icon = map[route.name];
          return (
            <Ionicons
              name={icon ? (focused ? icon.active : icon.inactive) : 'ellipse'}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Feed' }} />
      <Tab.Screen
        name="ComposeTab"
        component={ComposeScreen}
        options={{ title: 'New Post' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Account' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name="Tabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="TweetDetail"
        component={TweetDetailScreen}
        options={{ title: 'Post' }}
      />
      <RootStack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: 'Profile' }}
      />
    </RootStack.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Starting…" />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
