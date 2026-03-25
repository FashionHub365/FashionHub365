import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { getUserRoleSlugs } from '../../utils/roleUtils';

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOtpLogin } = useAuth();

  const handleVerify = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtpLogin(email as string, otp, true);

      if (result && result.success) {
        const user = (result as any).user;
        const roles = getUserRoleSlugs(user);
        let redirectPath = '/(tabs)' as any;

        if (roles.includes('admin')) redirectPath = '/(admin)/dashboard' as any;
        else if (roles.includes('seller')) redirectPath = '/(seller)/dashboard' as any;

        Alert.alert('Thành công', 'Đăng nhập thành công!', [
          { text: 'OK', onPress: () => router.replace(redirectPath) }
        ]);
      } else {
        Alert.alert('Verification Failed', result?.message || 'Invalid OTP code.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.backButtonContainer}>
          <Link href="/(auth)/login" asChild>
            <Text style={styles.backButtonText}>
              <IconSymbol name="chevron.left" size={20} color="#007AFF" /> Back to Login
            </Text>
          </Link>
        </View>
      </View>

      <View style={styles.content}>
        <IconSymbol name="lock.shield" size={64} color="#007AFF" style={styles.icon} />
        <Text style={styles.title}>OTP Verification</Text>
        <Text style={styles.subtitle}>
          We have sent an OTP code to your email:{"\n"}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit OTP code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          autoFocus
        />

        <View style={styles.buttonContainer}>
          <Button title={loading ? "Verifying..." : "Verify OTP"} onPress={handleVerify} disabled={loading || otp.length < 6} />
        </View>

        {loading && <ActivityIndicator style={styles.loader} size="large" color="#007AFF" />}

        <View style={styles.linkContainer}>
          <Text style={styles.helpText}>Didn't receive code? Please check your spam folder.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButtonContainer: {
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 20,
    letterSpacing: 8,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  loader: {
    marginTop: 10,
  },
  linkContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  helpText: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  }
});
