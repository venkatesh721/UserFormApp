import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type User = {
  id: string;
  name: string;
  email: string;
};

const colors = {
  background: '#11152F',
  surface: '#FFFFFF',
  text: '#202343',
  secondaryText: '#747994',
  border: '#E4E3F1',
  primary: '#5967F2',
  primaryDark: '#414FD1',
  error: '#C23E68',
  errorBackground: '#FFF0F5',
  accent: '#ECEBFF',
  hero: '#30236D',
  heroLight: '#5844A2',
  heroAccent: '#6D59BF',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const animationConfig = { duration: 180, easing: Easing.out(Easing.quad) };
const gradientColors = ['#141633', '#25205A', '#312265', '#172B62'] as const;

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const contentPadding = Math.min(24, Math.max(16, width * 0.055));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const nextUserId = useRef(0);
  const submitLock = useRef(false);
  const submitUnlockTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailInput = useRef<TextInput>(null);
  const reduceMotion = useReducedMotion();
  const nameFocus = useSharedValue(0);
  const emailFocus = useSharedValue(0);
  const buttonPress = useSharedValue(1);
  const orbMotion = useSharedValue(0);
  const secondOrbMotion = useSharedValue(0);
  const countScale = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;

    orbMotion.value = withRepeat(withTiming(1, { duration: 9500 }), -1, true);
    secondOrbMotion.value = withRepeat(withTiming(1, { duration: 12000 }), -1, true);

    return () => {
      cancelAnimation(orbMotion);
      cancelAnimation(secondOrbMotion);
    };
  }, [orbMotion, reduceMotion, secondOrbMotion]);

  useEffect(() => {
    if (users.length === 0 || reduceMotion) return;

    countScale.value = withSequence(
      withTiming(1.18, { duration: 140, easing: animationConfig.easing }),
      withTiming(1, { duration: 200, easing: animationConfig.easing })
    );
  }, [countScale, reduceMotion, users.length]);

  useEffect(() => {
    if (!successMessage) return;

    const timeout = setTimeout(() => setSuccessMessage(''), 2800);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  useEffect(
    () => () => {
      if (submitUnlockTimeout.current) clearTimeout(submitUnlockTimeout.current);
    },
    []
  );

  const nameInputAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      nameFocus.value,
      [0, 1],
      [colors.border, colors.primary]
    ),
    shadowOpacity: nameFocus.value * 0.1,
  }));

  const emailInputAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      emailFocus.value,
      [0, 1],
      [colors.border, colors.primary]
    ),
    shadowOpacity: emailFocus.value * 0.1,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonPress.value }],
  }));

  const firstOrbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orbMotion.value * 22 },
      { translateY: orbMotion.value * -20 },
    ],
  }));

  const secondOrbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: secondOrbMotion.value * -18 },
      { translateY: secondOrbMotion.value * 22 },
    ],
  }));

  const countAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  function setFocus(value: typeof nameFocus, focused: boolean) {
    value.value = withTiming(focused ? 1 : 0, {
      duration: reduceMotion ? 0 : animationConfig.duration,
      easing: animationConfig.easing,
    });
  }

  function handleSubmit() {
    if (submitLock.current) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const nextNameError = trimmedName ? '' : 'Enter your name.';
    const nextEmailError = !trimmedEmail
      ? 'Enter your email address.'
      : emailPattern.test(trimmedEmail)
        ? ''
        : 'Enter a valid email address.';

    setNameError(nextNameError);
    setEmailError(nextEmailError);

    if (nextNameError || nextEmailError) return;

    submitLock.current = true;
    submitUnlockTimeout.current = setTimeout(() => {
      submitLock.current = false;
      submitUnlockTimeout.current = null;
    }, 450);

    setUsers((currentUsers) => [
      ...currentUsers,
      {
        id: `user-${++nextUserId.current}`,
        name: trimmedName,
        email: trimmedEmail,
      },
    ]);
    setName('');
    setEmail('');
    setNameError('');
    setEmailError('');
    setSuccessMessage(`${trimmedName} was added successfully.`);
    Keyboard.dismiss();
  }

  function renderUser({ item, index }: { item: User; index: number }) {
    return (
      <Animated.View
        entering={reduceMotion ? undefined : FadeInUp.duration(320).delay(Math.min(index, 3) * 35)}
        style={styles.userCard}
        accessibilityLabel={`User ${index + 1}: ${item.name}, ${item.email}`}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toLocaleUpperCase()}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        <View style={styles.userStatus}>
          <View style={styles.userStatusDot} />
          <Text style={styles.userStatusText}>Added</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0.04, y: 0 }}
        end={{ x: 0.96, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.backgroundDecor} pointerEvents="none">
        <Animated.View
          style={[styles.backgroundOrb, styles.backgroundOrbViolet, firstOrbAnimatedStyle]}
        />
        <Animated.View
          style={[styles.backgroundOrb, styles.backgroundOrbBlue, secondOrbAnimatedStyle]}
        />
      </View>
      <StatusBar barStyle="light-content" backgroundColor="#141633" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(user) => user.id}
          ItemSeparatorComponent={UserSeparator}
          ListHeaderComponent={
            <View>
              <Animated.View
                entering={reduceMotion ? undefined : FadeInDown.duration(500)}
                style={styles.heroCard}>
                <LinearGradient
                  colors={['#44358C', '#31246F', '#24285E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroGlow} />
                <View style={styles.heroGlowSmall} />
                <View style={styles.heroTopRow}>
                  <View style={styles.brandMark}>
                    <View style={styles.peopleIcon} accessible accessibilityLabel="People">
                      <View style={styles.peopleHeadSide} />
                      <View style={styles.peopleHeadMain} />
                      <View style={styles.peopleShoulderSide} />
                      <View style={styles.peopleShoulderMain} />
                    </View>
                  </View>
                  <View style={styles.onlineBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>WORKSPACE</Text>
                  </View>
                </View>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroEyebrow}>PEOPLE DIRECTORY</Text>
                  <Text style={styles.title}>User Management</Text>
                  <Text style={styles.subtitle}>
                    Keep your people organized, one profile at a time.
                  </Text>
                </View>
                <View style={styles.heroFooter}>
                  <View style={styles.heroFooterLine} />
                  <Text style={styles.heroFooterText}>SIMPLE. SECURE. ORGANIZED.</Text>
                </View>
              </Animated.View>

              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>Add a user</Text>
                  <Text style={styles.sectionDescription}>
                    Enter their details to create a profile.
                  </Text>
                </View>
                <View style={styles.sectionIcon}>
                  <Text style={styles.sectionIconText}>+</Text>
                </View>
              </View>

              <Animated.View
                entering={reduceMotion ? undefined : FadeInUp.duration(420).delay(80)}
                style={styles.formCard}>
                <Text style={styles.fieldLabel}>Full name</Text>
                <Animated.View
                  testID={nameError ? 'name-input-shell-error' : 'name-input-shell'}
                  style={[
                    styles.inputShell,
                    Platform.OS === 'web' ? null : nameInputAnimatedStyle,
                    nameFocused ? styles.inputShellFocused : null,
                    nameError ? styles.inputError : null,
                  ]}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.inputIconText}>Aa</Text>
                  </View>
                  <TextInput
                    accessibilityLabel="Full name"
                    accessibilityHint={
                      nameError
                        ? `Enter the user's name. Error: ${nameError}`
                        : "Enter the user's name"
                    }
                    style={styles.input}
                    placeholder="e.g. Jordan Lee"
                    placeholderTextColor="#A0A8B8"
                    value={name}
                    onChangeText={(value) => {
                      submitLock.current = false;
                      if (submitUnlockTimeout.current) {
                        clearTimeout(submitUnlockTimeout.current);
                        submitUnlockTimeout.current = null;
                      }
                      setName(value);
                      if (nameError) setNameError(value.trim() ? '' : 'Enter your name.');
                    }}
                    onFocus={() => {
                      setNameFocused(true);
                      setFocus(nameFocus, true);
                    }}
                    onBlur={() => {
                      setNameFocused(false);
                      setFocus(nameFocus, false);
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => emailInput.current?.focus()}
                  />
                </Animated.View>
                {nameError ? (
                  <Animated.Text
                    entering={reduceMotion ? undefined : FadeInDown.duration(180)}
                    style={styles.errorText}>
                    {nameError}
                  </Animated.Text>
                ) : null}

                <Text style={[styles.fieldLabel, styles.emailLabel]}>Email address</Text>
                <Animated.View
                  testID={emailError ? 'email-input-shell-error' : 'email-input-shell'}
                  style={[
                    styles.inputShell,
                    Platform.OS === 'web' ? null : emailInputAnimatedStyle,
                    emailFocused ? styles.inputShellFocused : null,
                    emailError ? styles.inputError : null,
                  ]}>
                  <View style={styles.inputIcon}>
                    <Text style={styles.inputIconText}>@</Text>
                  </View>
                  <TextInput
                    ref={emailInput}
                    accessibilityLabel="Email address"
                    accessibilityHint={
                      emailError
                        ? `Enter an email address. Error: ${emailError}`
                        : 'Enter a valid email address'
                    }
                    style={styles.input}
                    placeholder="e.g. jordan@example.com"
                    placeholderTextColor="#A0A8B8"
                    value={email}
                    onChangeText={(value) => {
                      submitLock.current = false;
                      if (submitUnlockTimeout.current) {
                        clearTimeout(submitUnlockTimeout.current);
                        submitUnlockTimeout.current = null;
                      }
                      setEmail(value);
                      if (emailError) {
                        setEmailError(
                          !value.trim()
                            ? ''
                            : emailPattern.test(value.trim())
                              ? ''
                              : 'Enter a valid email address.'
                        );
                      }
                    }}
                    onFocus={() => {
                      setEmailFocused(true);
                      setFocus(emailFocus, true);
                    }}
                    onBlur={() => {
                      setEmailFocused(false);
                      setFocus(emailFocus, false);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                </Animated.View>
                {emailError ? (
                  <Animated.Text
                    entering={reduceMotion ? undefined : FadeInDown.duration(180)}
                    style={styles.errorText}>
                    {emailError}
                  </Animated.Text>
                ) : null}

                <Animated.View style={[styles.buttonMotion, buttonAnimatedStyle]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Submit registration"
                    onPress={handleSubmit}
                    onPressIn={() => {
                      buttonPress.value = withTiming(reduceMotion ? 1 : 0.975, {
                        duration: reduceMotion ? 0 : 100,
                      });
                    }}
                    onPressOut={() => {
                      buttonPress.value = withTiming(1, {
                        duration: reduceMotion ? 0 : 160,
                        easing: animationConfig.easing,
                      });
                    }}
                    style={({ pressed }) => [
                      styles.submitButton,
                      pressed ? styles.submitButtonPressed : null,
                    ]}>
                    <LinearGradient
                      colors={['#6876FF', '#5364F0', '#3F79EA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitGradient}>
                      <Text style={styles.submitButtonText}>Add user</Text>
                      <Text style={styles.submitButtonArrow} accessible={false}>
                        →
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
                <Text style={styles.formFootnote}>All fields are required</Text>
              </Animated.View>

              <Animated.View
                entering={reduceMotion ? undefined : FadeInUp.duration(420).delay(140)}
                style={styles.listHeading}>
                <View>
                  <View style={styles.teamEyebrow}>
                    <View style={styles.teamEyebrowDot} />
                    <Text style={styles.teamEyebrowText}>DIRECTORY</Text>
                  </View>
                  <Text style={styles.listTitle}>Team members</Text>
                  <Text style={styles.listSubtitle}>Your people, all in one place</Text>
                </View>
                <Animated.View style={[styles.countBadge, countAnimatedStyle]}>
                  <Text style={styles.countText}>{users.length}</Text>
                </Animated.View>
              </Animated.View>

              {successMessage ? (
                <Animated.View
                  key={successMessage}
                  entering={reduceMotion ? undefined : FadeInUp.duration(260)}
                  style={styles.successMessage}
                  accessibilityRole="alert">
                  <View style={styles.successCheck}>
                    <Text style={styles.successCheckText}>✓</Text>
                  </View>
                  <Text style={styles.successText}>{successMessage}</Text>
                </Animated.View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <Animated.View
              entering={reduceMotion ? undefined : FadeInUp.duration(380).delay(100)}
              style={styles.emptyCard}>
              <View style={styles.emptyIllustration}>
                <View style={styles.emptyAvatarBack} />
                <View style={styles.emptyAvatar}>
                  <Text style={styles.emptyAvatarText}>+</Text>
                </View>
                <View style={styles.emptySparkle}>
                  <Text style={styles.emptySparkleText}>✦</Text>
                </View>
              </View>
              <Text style={styles.emptyTitle}>Your directory starts here</Text>
              <Text style={styles.emptyDescription}>
                Add your first team member and their profile will show up here.
              </Text>
            </Animated.View>
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: contentPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function UserSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.18,
  },
  backgroundOrbViolet: {
    width: 260,
    height: 260,
    top: 150,
    right: -135,
    backgroundColor: '#A763FF',
  },
  backgroundOrbBlue: {
    width: 210,
    height: 210,
    bottom: 42,
    left: -125,
    backgroundColor: '#1EBBFF',
  },
  backgroundDecor: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  keyboardAvoiding: {
    flex: 1,
  },
  listContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
  },
  heroCard: {
    minHeight: 236,
    padding: 22,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.hero,
    marginBottom: 27,
    shadowColor: '#172951',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.17,
    shadowRadius: 18,
    elevation: 6,
  },
  heroGlow: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -76,
    top: -82,
    backgroundColor: colors.heroLight,
    opacity: 0.72,
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 134,
    height: 134,
    borderRadius: 67,
    right: 22,
    top: 94,
    backgroundColor: colors.heroAccent,
    opacity: 0.23,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  peopleIcon: {
    width: 26,
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  peopleHeadMain: {
    position: 'absolute',
    top: 1,
    left: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#8DE9FF',
    zIndex: 1,
  },
  peopleHeadSide: {
    position: 'absolute',
    top: 4,
    left: 2,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F6A6E5',
  },
  peopleShoulderMain: {
    width: 18,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    backgroundColor: '#8DE9FF',
  },
  peopleShoulderSide: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 10,
    height: 7,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: '#F6A6E5',
    opacity: 0.95,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.11)',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 7,
    backgroundColor: '#81D9B4',
  },
  onlineText: {
    color: '#DCE5FF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  heroCopy: {
    marginTop: 25,
  },
  heroEyebrow: {
    color: '#AEBEFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.7,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    maxWidth: 300,
    color: '#D0D9EF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  heroFooterLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
    marginRight: 8,
    backgroundColor: '#AEBEFF',
  },
  heroFooterText: {
    color: '#C2CDE7',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionDescription: {
    color: '#D3D3ED',
    fontSize: 12,
    marginTop: 4,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  sectionIconText: {
    color: colors.primary,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '400',
  },
  formCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(250,249,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
    shadowColor: '#090D2A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.17,
    shadowRadius: 18,
    elevation: 5,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  emailLabel: {
    marginTop: 17,
  },
  inputShell: {
    minHeight: 51,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: 'rgba(246,246,253,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 7,
    elevation: 0,
  },
  inputShellFocused: {
    borderColor: colors.primary,
    shadowOpacity: 0.14,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorBackground,
  },
  inputIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginRight: 10,
  },
  inputIconText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: 0,
    color: colors.text,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 6,
  },
  buttonMotion: {
    marginTop: 20,
  },
  submitButton: {
    minHeight: 53,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.23,
    shadowRadius: 9,
    elevation: 4,
  },
  submitGradient: {
    minHeight: 53,
    paddingHorizontal: 17,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  submitButtonArrow: {
    position: 'absolute',
    right: 17,
    color: colors.surface,
    fontSize: 20,
    lineHeight: 24,
  },
  formFootnote: {
    color: '#99A1B0',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  listHeading: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#090D2A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2,
  },
  teamEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  teamEyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    backgroundColor: '#82E8FF',
  },
  teamEyebrowText: {
    color: '#B9C5FF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  listTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  listSubtitle: {
    color: '#D1D3EE',
    fontSize: 12,
    marginTop: 3,
  },
  countBadge: {
    minWidth: 31,
    height: 31,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginLeft: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(135,151,255,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(206,216,255,0.22)',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  successMessage: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(116,235,194,0.42)',
    backgroundColor: 'rgba(237,255,248,0.96)',
  },
  successCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    backgroundColor: '#D6F1E2',
  },
  successCheckText: {
    color: '#288456',
    fontSize: 13,
    fontWeight: '700',
  },
  successText: {
    flex: 1,
    color: '#28714C',
    fontSize: 12,
    fontWeight: '600',
  },
  userCard: {
    minHeight: 76,
    padding: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: 'rgba(250,249,255,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#090D2A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 3,
  },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 15,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  userEmail: {
    color: colors.secondaryText,
    fontSize: 12,
    marginTop: 4,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#F0FAF5',
  },
  userStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
    backgroundColor: '#47A878',
  },
  userStatusText: {
    color: '#39835D',
    fontSize: 10,
    fontWeight: '600',
  },
  separator: {
    height: 9,
  },
  emptyCard: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emptyIllustration: {
    width: 62,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyAvatarBack: {
    position: 'absolute',
    width: 37,
    height: 37,
    borderRadius: 14,
    left: 8,
    top: 9,
    backgroundColor: 'rgba(173,167,255,0.24)',
    transform: [{ rotate: '-12deg' }],
  },
  emptyAvatar: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.17)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  emptyAvatarText: {
    color: '#B4C3FF',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '400',
  },
  emptySparkle: {
    position: 'absolute',
    top: 0,
    right: 4,
  },
  emptySparkleText: {
    color: '#F2A7E4',
    fontSize: 14,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    maxWidth: 250,
    color: '#D1D3EE',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    textAlign: 'center',
  },
});
