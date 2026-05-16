export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email?: string } | undefined;
  AdminHome: undefined;
  ClientMain: undefined;
  PendingApproval: undefined;
  TeacherMain: undefined;
  Profile: undefined;
  ProductDetails: { productId: string };
  AdminProductDetails: { productId: string };
  AdminProductEditor:
    | {
        mode: 'create';
      }
    | {
        mode: 'edit';
        productId: string;
      };
  ChangePassword: undefined;
  RoleManager: undefined;
};
