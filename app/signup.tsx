import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

import { supabase } from '@/utils/supabase';
import UserIcon from '../assets/images/user.svg';

// --- PROFILE UPSERT FUNCTION ---
const upsertProfile = async (
  userId: string,
  fullName: string,
  mobileNo: string,
  agriStackId: string
) => {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: fullName,
      mobile_no: mobileNo,
      agristack_id: agriStackId,
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error('Error upserting profile:', error);
    return false;
  }
  return true;
};


// --- OTP OVERLAY COMPONENT (UPDATED FOR 6 DIGITS) ---
interface OtpOverlayProps {
  onConfirm: (code: string) => void;
  onClose: () => void;
  mobileNo: string;
  onResend: () => void;
}

const OtpOverlay: React.FC<OtpOverlayProps> = ({ onConfirm, onClose, mobileNo, onResend }) => {
  // CHANGE 1: Initialize state with 6 empty strings instead of 4
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);
  
  // We need refs for 6 inputs
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    
    // CHANGE 2: Update auto-focus logic for 6 inputs (index < 5)
    if (text.length === 1 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (timer === 0 && !isResending) {
      setIsResending(true);
      await onResend();
      setIsResending(false);
      setTimer(30);
    }
  };

  const isOtpComplete = otp.every(digit => digit.length === 1);
  const resendDisabled = timer !== 0 || isResending;

  return (
    <View style={overlayStyles.fullScreenOverlay}>
      <View style={overlayStyles.otpBox}>
        <TouchableOpacity style={overlayStyles.closeButton} onPress={onClose}>
          <Text style={overlayStyles.closeText}>X</Text>
        </TouchableOpacity>
        <Text style={overlayStyles.enterOtpText}>ENTER 6-DIGIT OTP</Text>
        
        <View style={overlayStyles.otpInputContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => {
                if (el) {
                  inputRefs.current[index] = el;
                }
              }}
              style={overlayStyles.otpInput as StyleProp<TextStyle>} 
              value={digit}
              onChangeText={(text) => handleOtpChange(text.slice(-1), index)}
              keyboardType="numeric"
              maxLength={1}
              autoFocus={index === 0}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && digit === '' && index > 0) {
                  inputRefs.current[index - 1]?.focus();
                }
              }}
            />
          ))}
        </View>
        
        <TouchableOpacity
          style={[
            overlayStyles.confirmButton,
            isOtpComplete ? overlayStyles.confirmButtonActive : overlayStyles.confirmButtonDisabled,
          ]}
          disabled={!isOtpComplete}
          onPress={() => onConfirm(otp.join(''))}>
          <Text style={overlayStyles.confirmButtonText}>CONFIRM</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleResendOtp} disabled={resendDisabled}>
          <Text style={[
            overlayStyles.resendText,
            resendDisabled && { opacity: 0.5 }
          ]}>
            {isResending ? 'SENDING...' : `RESEND OTP? ${timer > 0 ? `${timer}SEC` : 'RESEND'}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- LOGIN SCREEN MAIN COMPONENT ---
export default function LoginScreen() {
  const router = useRouter();
  const { lesson_completed } = useLocalSearchParams<{ lesson_completed?: string }>();

  const [fullName, setFullName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [agriStackId, setAgriStackId] = useState('');
  const [showOtpOverlay, setShowOtpOverlay] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const phoneNoWithCode = '+91' + mobileNo;

  // Handle Sending OTP
  const handleSendOTP = async () => {
    if (mobileNo.length === 10 && !isLoading) {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNoWithCode,
      });

      setIsLoading(false);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setShowOtpOverlay(true);
      }
    } else {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number');
    }
  };

  // Handle Confirming OTP
  const handleOtpConfirmation = async (code: string) => {
    if (isLoading) return;
    setIsLoading(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: phoneNoWithCode,
      token: code,
      type: 'sms',
    });

    if (verifyError) {
      setIsLoading(false);
      Alert.alert('Error', 'Invalid OTP, please try again.');
      return;
    }

    if (data.session && data.user) {
      // Save profile data if this is a new user or update if existing
      await upsertProfile(
        data.user.id,
        fullName,
        mobileNo,
        agriStackId
      );

      setIsLoading(false);
      setShowOtpOverlay(false);

      // Navigate based on where they came from
      router.replace({
        pathname: '/lessons',
        params: { lesson_completed: lesson_completed }
      });
    } else {
        setIsLoading(false);
        Alert.alert('Error', 'Authentication failed unexpectedly.');
    }
  };

  const handleResendOTPFromOverlay = async () => {
    const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNoWithCode,
    });

    if (error) {
        Alert.alert('Resend Error', error.message);
    } else {
        Alert.alert('Success', 'New OTP sent!');
    }
  }

  const handleConfirmLogin = () => { /* Placeholder */ };

  const isSendOtpActive = mobileNo.length === 10 && !isLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>LOGIN</Text>

        <View style={styles.avatarContainer}>
          <UserIcon width={100} height={100} />
        </View>

        <Text style={styles.inputLabel}>FULL NAME</Text>
        <TextInput
          style={styles.input as StyleProp<TextStyle>} 
          placeholder="Enter your Full name"
          placeholderTextColor="#A0A0A0"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.inputLabel}>MOBILE NO.</Text>
        <TextInput
          style={styles.input as StyleProp<TextStyle>}
          placeholder="Enter your phone no."
          placeholderTextColor="#A0A0A0"
          keyboardType="numeric"
          maxLength={10}
          value={mobileNo}
          onChangeText={setMobileNo}
        />

        <Text style={styles.inputLabel}>AGRISTACK ID</Text>
        <TextInput
          style={styles.input as StyleProp<TextStyle>}
          placeholder="Enter your agristack id"
          placeholderTextColor="#A0A0A0"
          value={agriStackId}
          onChangeText={setAgriStackId}
        />

        <TouchableOpacity
          style={[
            styles.sendOtpButton,
            isSendOtpActive ? styles.sendOtpButtonActive : styles.sendOtpButtonDisabled,
          ]}
          disabled={!isSendOtpActive}
          onPress={handleSendOTP}>
          <Text style={styles.sendOtpButtonText}>
            {isLoading && !showOtpOverlay ? 'SENDING...' : 'SEND OTP'}
          </Text>
        </TouchableOpacity>

        <View style={styles.accountLinkContainer}>
          <Text style={styles.accountLinkText}>Don't have an account?</Text>
          <TouchableOpacity><Text style={styles.createOneText}>Create one</Text></TouchableOpacity>
        </View>

        <Text style={styles.dataNote}>DATA AS PER FARMER REGISTRY 2025</Text>

        <TouchableOpacity
          style={[styles.confirmButton, styles.confirmButtonDisabled]}
          disabled={true}
          onPress={handleConfirmLogin}>
          <Text style={styles.confirmButtonText}>CONFIRM</Text>
        </TouchableOpacity>

      </ScrollView>

      {showOtpOverlay && (
        <OtpOverlay
          onConfirm={handleOtpConfirmation}
          onClose={() => setShowOtpOverlay(false)}
          mobileNo={mobileNo}
          onResend={handleResendOTPFromOverlay}
        />
      )}
    </SafeAreaView>
  );
}

// --- STYLES ---

type ViewAndTextStyle = ViewStyle & TextStyle;

interface LoginStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  title: TextStyle;
  avatarContainer: ViewStyle;
  inputLabel: TextStyle;
  input: ViewAndTextStyle; 
  sendOtpButton: ViewStyle;
  sendOtpButtonActive: ViewStyle;
  sendOtpButtonDisabled: ViewStyle;
  sendOtpButtonText: TextStyle;
  accountLinkContainer: ViewStyle;
  accountLinkText: TextStyle;
  createOneText: TextStyle;
  dataNote: TextStyle;
  confirmButton: ViewStyle;
  confirmButtonDisabled: ViewStyle;
  confirmButtonActive: ViewStyle;
  confirmButtonText: TextStyle;
}

const styles = StyleSheet.create<LoginStyles>({
  safeArea: { flex: 1, backgroundColor: '#151718' },
  container: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 40, paddingBottom: 30, alignItems: 'center' },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
  avatarContainer: { backgroundColor: '#333333', borderRadius: 15, padding: 20, marginBottom: 30 },
  inputLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 5, marginTop: 15 },
  input: { width: '100%', backgroundColor: '#333333', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, borderWidth: 1, borderColor: '#444444', color: '#FFFFFF', fontSize: 16 },
  sendOtpButton: { width: '100%', paddingVertical: 14, borderRadius: 30, marginTop: 25 },
  sendOtpButtonActive: { backgroundColor: '#388e3c' },
  sendOtpButtonDisabled: { backgroundColor: '#555555' },
  sendOtpButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  accountLinkContainer: { flexDirection: 'row', marginTop: 20 },
  accountLinkText: { color: '#B0B0B0', fontSize: 14, marginRight: 5 },
  createOneText: { color: '#388e3c', fontSize: 14, textDecorationLine: 'underline' },
  dataNote: { color: '#B0B0B0', fontSize: 12, marginTop: 30, marginBottom: 10, textAlign: 'center' },
  confirmButton: { width: '100%', paddingVertical: 16, borderRadius: 30 },
  confirmButtonDisabled: { backgroundColor: '#555555' },
  confirmButtonActive: { backgroundColor: '#388e3c' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});

interface OverlayStyles {
  fullScreenOverlay: ViewStyle;
  otpBox: ViewStyle;
  closeButton: ViewStyle;
  closeText: TextStyle;
  enterOtpText: TextStyle;
  otpInputContainer: ViewStyle;
  otpInput: ViewAndTextStyle; 
  confirmButton: ViewStyle;
  confirmButtonDisabled: ViewStyle;
  confirmButtonActive: ViewStyle;
  confirmButtonText: TextStyle;
  resendText: TextStyle;
}

const overlayStyles = StyleSheet.create<OverlayStyles>({
  fullScreenOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  otpBox: { width: '90%', maxWidth: 380, backgroundColor: '#333333', borderRadius: 20, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#444444' },
  closeButton: { position: 'absolute', top: 15, right: 15, padding: 5 },
  closeText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  enterOtpText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20, marginTop: 10, letterSpacing: 1.5, borderBottomWidth: 2, borderColor: '#FFFFFF', paddingBottom: 5 },
  
  // CHANGE 3: Adjusted container to fit 6 boxes
  otpInputContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25, gap: 8 },
  
  // CHANGE 4: Made boxes slightly smaller to fit 6 in a row
  otpInput: { width: 40, height: 50, backgroundColor: '#151718', borderRadius: 8, borderWidth: 1, borderColor: '#555555', color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  
  confirmButton: { width: '80%', paddingVertical: 12, borderRadius: 30, marginBottom: 15 },
  confirmButtonDisabled: { backgroundColor: '#555555' },
  confirmButtonActive: { backgroundColor: '#388e3c' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  resendText: { color: '#FDD835', fontSize: 14, fontWeight: '500' },
});