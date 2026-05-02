import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { AdminResponse, ApiResponse, CreateAdminInput, LoginData } from 'src/lib/types/adminAuthTypes';
import { firebaseAuth } from '../firebase/firebaseConfig';

const mapFirebaseUser = (user: User): AdminResponse => ({
  id: user.uid,
  email: user.email || '',
  name: user.displayName || 'Admin',
});

function toApiResponse<T>(data: T, message = 'Success'): ApiResponse<T> {
  return {
    status: 'success',
    message,
    error: null,
    data,
  };
}

export const createAdmin = async (_admin: CreateAdminInput): Promise<ApiResponse<AdminResponse>> => {
  throw new Error('Admin creation is not supported from this client app.');
};

export const loginAdmin = async (data: LoginData): Promise<ApiResponse<AdminResponse>> => {
  const credential = await signInWithEmailAndPassword(firebaseAuth, data.email, data.password);
  return toApiResponse(mapFirebaseUser(credential.user), 'Login successful');
};

export const logoutAdmin = async (): Promise<ApiResponse<null>> => {
  await signOut(firebaseAuth);
  return toApiResponse(null, 'Logout successful');
};

export const getCurrentAdmin = async (): Promise<ApiResponse<AdminResponse>> => {
  const currentUser = firebaseAuth.currentUser;
  if (currentUser) {
    return toApiResponse(mapFirebaseUser(currentUser));
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribe();
      if (!user) {
        reject(new Error('Not authenticated'));
        return;
      }
      resolve(toApiResponse(mapFirebaseUser(user)));
    });
  });
};