import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RiseIn } from '@/components/ui/rise-in';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';

import { ForgotForm } from './forgot-form';
import { LogoBlock } from './logo-block';
import { SentConfirmation } from './sent-confirmation';
import { SigninForm } from './signin-form';
import { useLoginFlow } from './use-login-flow';

export function Login() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const flow = useLoginFlow();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>
          <LogoBlock />

          <RiseIn viewKey={flow.view}>
            {flow.view === 'signin' ? (
              <SigninForm
                email={flow.email}
                onEmailChange={flow.setEmail}
                password={flow.password}
                onPasswordChange={flow.setPassword}
                loading={flow.loading}
                error={flow.error}
                onSubmit={flow.submitSignin}
                onForgot={flow.goForgot}
              />
            ) : flow.view === 'forgot' ? (
              <ForgotForm
                email={flow.email}
                onEmailChange={flow.setEmail}
                loading={flow.loading}
                onSubmit={flow.submitReset}
                onBack={flow.goSignin}
              />
            ) : (
              <SentConfirmation emailShown={flow.emailShown} onBack={flow.goSignin} onResend={flow.submitReset} />
            )}
          </RiseIn>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>v1.0.0</Text>
          <Text style={[styles.footerLink, { color: theme.accentDeep }]}>Get help</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  column: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 24,
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  footerText: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
  footerLink: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
  },
});
