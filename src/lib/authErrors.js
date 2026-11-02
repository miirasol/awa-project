export function authErrorMessage(err) {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password is too weak (at least 6 characters).";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled.";
    case "auth/network-request-failed":
      return "Network error. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
}
