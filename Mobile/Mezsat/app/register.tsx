import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  TextInputProps,
} from 'react-native';
// import { useNavigation } from '@react-navigation/native'; // 👈 Bu satırı kaldırın veya yorum satırı yapın
import { Link } from 'expo-router'; // 👈 Link bileşenini import edin (zaten import edilmiş olabilir)
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faGavel } from '@fortawesome/free-solid-svg-icons';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

interface InputFieldProps extends TextInputProps {
  icon: React.ReactNode;
  secureToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
  icon,
  secureTextEntry,
  secureToggle = false,
  showPassword,
  onTogglePassword,
  ...props
}) => (
  <View style={styles.inputWrapper}>
    <View style={styles.iconWrapper}>{icon}</View>
    <TextInput
      style={styles.input}
      placeholderTextColor="#9ca3af"
      secureTextEntry={secureTextEntry && !showPassword}
      {...props}
    />
    {secureToggle && onTogglePassword && (
      <TouchableOpacity onPress={onTogglePassword}>
        <Ionicons
          name={showPassword ? 'eye-off' : 'eye'}
          size={20}
          color="#9ca3af"
        />
      </TouchableOpacity>
    )}
  </View>
);

const RegisterScreen: React.FC = () => {
  // const navigation = useNavigation(); // 👈 Bu satırı kaldırın veya yorum satırı yapın
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [matchError, setMatchError] = useState(false);

  const handleRegister = async () => {
    if (password !== password2) {
      setMatchError(true);
      Alert.alert('Hata', 'Şifreler eşleşmiyor!');
      return;
    }

    try {
      const response = await fetch('http://192.168.0.4:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          phone,
          password,
          password2,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Başarılı', 'Kayıt başarılı!');
      } else {
        Alert.alert('Hata', data.message || 'Kayıt başarısız.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <FontAwesomeIcon icon={faGavel} size={40} color="#4f46e5" style={{ alignSelf: 'center', marginBottom: 10 }} />
            <Text style={styles.title}>Mezsat'a Kayıt Ol</Text>
            <Text style={styles.subtitle}>Açık artırmalara katılmak için bir hesap oluştur</Text>

            <InputField
              icon={<Ionicons name="person" size={20} color="#9ca3af" />}
              placeholder="Kullanıcı Adı"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <InputField
              icon={<MaterialIcons name="email" size={20} color="#9ca3af" />}
              placeholder="E-posta"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <InputField
              icon={<FontAwesome name="phone" size={20} color="#9ca3af" />}
              placeholder="Telefon"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <InputField
              icon={<Ionicons name="lock-closed" size={20} color="#9ca3af" />}
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              secureToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
            <InputField
              icon={<Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />}
              placeholder="Şifre (Tekrar)"
              value={password2}
              onChangeText={(text) => {
                setPassword2(text);
                setMatchError(text !== password);
              }}
              secureTextEntry
              secureToggle
              showPassword={showPassword2}
              onTogglePassword={() => setShowPassword2(!showPassword2)}
            />

            {matchError && (
              <Text style={styles.errorText}>🔴 Şifreler uyuşmuyor!</Text>
            )}

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>Kayıt Ol</Text>
            </TouchableOpacity>

            {/* Değişiklik: TouchableOpacity yerine Link kullanın */}
            <Link href="/login" style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>
                Zaten hesabınız var mı? <Text style={{ fontWeight: '600' }}>Giriş Yap</Text>
              </Text>
            </Link>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#4f46e5', // login sayfasındaki gibi mavi
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4f46e5',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
  },
  iconWrapper: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    color: '#111827',
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },
  loginLink: {
    fontSize: 14,
    color: '#4f46e5',
    textAlign: 'center',
    marginTop: 20,
  },
  loginLinkContainer: { // Yeni stil veya mevcut loginLink stilini uyarlayın
    marginTop: 20,
    alignItems: 'center', // Metni ortalamak için
  },
  loginLinkText: { // Yeni stil veya mevcut loginLink stilini uyarlayın
    fontSize: 14,
    color: '#4f46e5',
    textAlign: 'center',
  },
});

export default RegisterScreen;
