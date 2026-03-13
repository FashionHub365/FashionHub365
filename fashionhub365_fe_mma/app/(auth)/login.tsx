import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Button, SafeAreaView, Alert } from 'react-native';
import { router, Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    const result = await login(email, password, true);

    if (result && result.success) {
      if (result.requiresOtp) {
        // Navigate to OTP verification if required
        router.push({ pathname: '/(auth)/verify-otp' as any, params: { email } });
      } else {
        router.replace('/(tabs)/profile');
      }
    } else {
      Alert.alert('Login failed', result?.message || 'Invalid credentials');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        
        <TextInput 
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput 
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={styles.buttonContainer}>
          <Button title="Login" onPress={handleLogin} />
        </View>

        <View style={styles.linkContainer}>
          <Text>Don't have an account? </Text>
          <Link href="/(auth)/register" style={styles.link}>Register here</Link>
        </View>
        <View style={styles.linkContainer}>
          <Link href="/(auth)/forgot-password" style={styles.link}>Forgot Password?</Link>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  link: {
    color: '#007AFF',
    fontWeight: '500',
  }
});
