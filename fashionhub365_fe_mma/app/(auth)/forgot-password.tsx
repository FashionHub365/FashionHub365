import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, SafeAreaView, Alert } from 'react-native';
import { router, Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword } = useAuth();

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    const result = await forgotPassword(email);

    if (result && result.success) {
      setIsSubmitted(true);
      Alert.alert('Success', 'Password reset instructions have been sent to your email.');
    } else {
      Alert.alert('Failed', result?.message || 'Could not send reset email');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        
        {isSubmitted ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Check your email for password reset instructions.
            </Text>
            <Button title="Back to Login" onPress={() => router.replace('/(auth)/login')} />
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <TextInput 
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.buttonContainer}>
              <Button title="Send Reset Link" onPress={handleReset} />
            </View>

            <View style={styles.linkContainer}>
              <Link href="/(auth)/login" style={styles.link}>Back to Login</Link>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  link: {
    color: '#007AFF',
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#28a745',
    textAlign: 'center',
    marginBottom: 30,
  }
});
