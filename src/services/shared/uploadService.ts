// src/services/shared/uploadService.ts
// Firebase Storage'a fotoğraf yükleme — tüm ekranlar kullanır

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

// Genel fotoğraf yükleme
export const uploadPhoto = async (
  path: string,
  photoUri: string
): Promise<string> => {
  const response = await fetch(photoUri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
};

// Profil fotoğrafı yükle
export const uploadProfilePhoto = async (uid: string, photoUri: string): Promise<string> => {
  return await uploadPhoto(`profiles/${uid}/avatar.jpg`, photoUri);
};

// Portfolyo fotoğrafı yükle
export const uploadPortfolioPhoto = async (
  hairdresserId: string,
  photoUri: string,
  type: 'before' | 'after'
): Promise<string> => {
  return await uploadPhoto(
    `portfolio/${hairdresserId}/${Date.now()}_${type}.jpg`,
    photoUri
  );
};

// Chat fotoğrafı yükle
export const uploadChatPhoto = async (
  chatId: string,
  photoUri: string
): Promise<string> => {
  return await uploadPhoto(
    `chats/${chatId}/${Date.now()}.jpg`,
    photoUri
  );
};

// Fotoğraf sil
export const deletePhoto = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
};