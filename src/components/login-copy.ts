export const LOGIN_COPY = {
  subtitle: 'Sign in to your account to continue exploring movies',
  methodPrompt: 'Choose your preferred method',
  authHint: 'Choose between secure passkey authentication or social login',
  terms: 'By signing in, you agree to our terms of service and privacy policy',
} as const;

export const LOGIN_FEATURES = [
  {
    id: 'secure',
    title: 'Secure Login',
    description: 'Fast and secure authentication',
  },
  {
    id: 'personalized',
    title: 'Personalized Experience',
    description: 'Get recommendations tailored to you',
  },
  {
    id: 'quick',
    title: 'Quick Access',
    description: 'Save favorites and create watchlists',
  },
] as const;
