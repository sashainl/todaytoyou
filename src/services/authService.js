import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth'
import { auth } from '../config/firebase'

/**
 * 이메일로 회원가입
 */
export async function signUpWithEmail(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // 사용자 이름 설정
    if (displayName) {
      await updateProfile(userCredential.user, { displayName })
    }
    
    return userCredential.user
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}

/**
 * 이메일로 로그인
 */
export async function signInWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

/**
 * Google로 로그인
 */
export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    return userCredential.user
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

/**
 * 로그아웃
 */
export async function signOutUser() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

/**
 * 인증 상태 변경 감지
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback)
}

/**
 * 현재 사용자 가져오기
 */
export function getCurrentUser() {
  return auth.currentUser
}

