"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createAdmin, loginAdmin, logoutAdmin, getCurrentAdmin } from "src/lib/services/api/adminAuth";
import { AdminResponse, ApiResponse, CreateAdminInput, LoginData } from "src/lib/types/adminAuthTypes";

// Hook to create a new admin
export const useCreateAdmin = () => {
  return useMutation<ApiResponse<AdminResponse>, unknown, CreateAdminInput>({
    mutationFn: (data: CreateAdminInput) => createAdmin(data),
  });
};

// Hook to log in an admin
export const useLoginAdmin = () => {
  return useMutation<ApiResponse<AdminResponse>, unknown, LoginData>({
    mutationFn: (credentials: LoginData) => loginAdmin(credentials),
  });
};

// Hook to log out an admin
export const useLogoutAdmin = () => {
  return useMutation<ApiResponse<null>, unknown, void>({
    mutationFn: () => logoutAdmin(),
  });
};

// Hook to get current admin
export const useCurrentAdmin = () => {
  return useQuery<ApiResponse<AdminResponse>, Error>({
    queryKey: ["currentAdmin"],
    queryFn: () => getCurrentAdmin(),
    retry: false,
    refetchOnWindowFocus: false,
  });
};
